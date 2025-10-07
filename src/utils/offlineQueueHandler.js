import pinataService from '../utils/pinataService';
import axios from 'axios';
import {BACKEND_RESULT, CHAIN, BACKEND_SECRET} from '@env';
import {oracleCalls, oracleReads} from '../api/oracle';
import {availableNetworks} from '../api/params';
import {removePersistedImage} from '../utils/persistLocalImage';
import {executeOperation} from '../api/account';
import { displayLocalActaPublished } from '../notifications';
import { requestPushPermissionExplicit } from '../services/pushPermission';

export const publishActaHandler = async (item, userData) => {
  const {imageUri, aiAnalysis, electoralData, additionalData, tableData} =
    item.task.payload;

  const normalizedAdditional = (() => {
    const idRecinto =
      additionalData?.idRecinto ||
      additionalData?.locationId ||
      tableData?.idRecinto ||
      tableData?.locationId ||
      tableData?.location?._id ||
      null;

    const tableCode =
      additionalData?.tableCode ||
      tableData?.codigo ||
      tableData?.tableCode ||
      '';

    const tableNumber =
      additionalData?.tableNumber ||
      tableData?.tableNumber ||
      tableData?.numero ||
      tableData?.number ||
      '';

    return {
      ...additionalData,
      idRecinto,
      locationId: idRecinto,
      tableCode: String(tableCode),
      tableNumber: String(tableNumber),
    };
  })();

  const buildFromPayload = type => {
    const norm = s =>
      String(s ?? '')
        .trim()
        .toLowerCase();
    const aliases = {
      validos: ['validos', 'válidos', 'votos válidos'],
      nulos: ['nulos', 'votos nulos'],
      blancos: ['blancos', 'votos en blanco', 'votos blancos'],
    };
    const pickRow = key =>
      (electoralData?.voteSummaryResults || []).find(
        r => r.id === key || aliases[key]?.includes(norm(r.label)),
      );
    const getValue = key => {
      const row = pickRow(key);
      const raw = type === 'presidente' ? row?.value1 : row?.value2;
      const n = parseInt(String(raw ?? '0'), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    return {
      validVotes: getValue('validos'),
      nullVotes: getValue('nulos'),
      blankVotes: getValue('blancos'),
      partyVotes: (electoralData?.partyResults || []).map(p => ({
        partyId: p.partido,
        votes:
          parseInt(type === 'presidente' ? p.presidente : p.diputado, 10) || 0,
      })),
      totalVotes: getValue('validos') + getValue('nulos') + getValue('blancos'),
    };
  };
  const verificationData = {
    tableNumber: tableData?.codigo || 'N/A',
    votes: {
      parties: buildFromPayload('presidente'),
      deputies: buildFromPayload('diputado'),
    },
  };

  const duplicateCheck = await pinataService.checkDuplicateBallot(
    verificationData,
  );
  if (duplicateCheck?.exists) {
    await removePersistedImage(imageUri);
    return true;
  }

  const imagePath = imageUri.startsWith('file://')
    ? imageUri.substring(7)
    : imageUri;

  const normalizedVoteSummary = (electoralData?.voteSummaryResults || []).map(
    data => {
      if (data.id === 'validos') return {...data, label: 'Votos Válidos'};
      if (data.id === 'nulos') return {...data, label: 'Votos Nulos'};
      if (data.id === 'blancos') return {...data, label: 'Votos en Blanco'};
      return data;
    },
  );

  const ipfs = await pinataService.uploadElectoralActComplete(
    imagePath,
    aiAnalysis || {},
    {...electoralData, voteSummaryResults: normalizedVoteSummary},
    additionalData,
  );

  if (!ipfs.success) throw new Error(ipfs.error);
  const ipfsData = ipfs.data;

  const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/validate-ballot-data`;

  await axios.post(
    backendUrl,
    {
      ipfsUri: ipfsData.jsonUrl,
      recordId: 'String',
      tableIdIpfs: 'String',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BACKEND_SECRET,
      },
      timeout: 30000,
    },
  );

  const privateKey = userData?.privKey;
  let isRegistered = await oracleReads.isRegistered(CHAIN, userData.account, 1);
  if (!isRegistered) {
    await executeOperation(
      privateKey,
      userData.account,
      CHAIN,
      oracleCalls.requestRegister(CHAIN, ipfsData.imageUrl),
    );
    isRegistered = await oracleReads.isRegistered(CHAIN, userData.account, 20);
    if (!isRegistered) throw Error('Failed to register user on oracle');
  }

  let response;
  try {
    response = await executeOperation(
      privateKey,
      userData.account,
      CHAIN,
      oracleCalls.createAttestation(CHAIN, tableData.codigo, ipfsData.jsonUrl),
      oracleReads.waitForOracleEvent,
      'AttestationCreated',
    );
    console.log(response)
  } catch (e) {
    const msg = e.message || '';
    if (msg.indexOf('416c72656164792063726561746564') >= 0) {
      response = await executeOperation(
        privateKey,
        userData.account,
        CHAIN,
        oracleCalls.attest(
          CHAIN,
          tableData.codigo,
          BigInt(0),
          ipfsData.jsonUrl,
        ),
        oracleReads.waitForOracleEvent,
        'Attested',
      );
    } else {
      throw e;
    }
  }

  const {explorer, nftExplorer, attestationNft} = availableNetworks[CHAIN];
  console.log(explorer)
  console.log(nftExplorer)
  console.log(attestationNft)
  const nftId = response.returnData.recordId.toString();
  console.log(nftId)
  const nftResult = {
    txHash: response.receipt.transactionHash,
    nftId,
    txUrl: explorer + 'tx/' + response.receipt.transactionHash,
    nftUrl: nftExplorer + '/' + attestationNft + '/' + nftId,
  };
  console.log(nftResult)

  await axios.post(
    `${BACKEND_RESULT}/api/v1/ballots/from-ipfs`,
    {
      ipfsUri: String(ipfsData.jsonUrl),
      recordId: String(nftId),
      tableIdIpfs: 'String',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BACKEND_SECRET,
      },
      timeout: 30000,
    },
  );
  await removePersistedImage(imageUri);
    await requestPushPermissionExplicit();
  await displayLocalActaPublished({ ipfsData, nftData: nftResult, tableData });
  return {success: true, ipfsData, nftData: nftResult, tableData};
};
