import pinataService from '../utils/pinataService';
import axios from 'axios';
import {BACKEND_RESULT, CHAIN, BACKEND_SECRET} from '@env';
import {oracleCalls, oracleReads} from '../api/oracle';
import {availableNetworks} from '../api/params';
import {removePersistedImage} from '../utils/persistLocalImage';
import {executeOperation} from '../api/account';
import {displayLocalActaPublished} from '../notifications';
import {requestPushPermissionExplicit} from '../services/pushPermission';

export const publishActaHandler = async (item, userData) => {
  console.log('[OFFLINE-QUEUE] publishActaHandler inicio', { itemId: item.id });
  try {
    const {imageUri, aiAnalysis, electoralData, additionalData, tableData} =
      item.task.payload;
    console.log('[OFFLINE-QUEUE] payload recibido', { imageUri, tableData: { codigo: tableData?.codigo } });

    
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
  console.log('[OFFLINE-QUEUE] normalizedAdditional', normalizedAdditional);

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
    tableNumber: normalizedAdditional.tableCode || tableData?.codigo || 'N/A',
    votes: {
      parties: buildFromPayload('presidente'),
      deputies: buildFromPayload('diputado'),
    },
  };

  let duplicateCheck;
  try {
    console.log('[OFFLINE-QUEUE] verificando duplicados en backend', { verificationData });
    duplicateCheck = await pinataService.checkDuplicateBallot(
      verificationData,
    );
    console.log('[OFFLINE-QUEUE] resultado duplicateCheck', duplicateCheck);
    if (duplicateCheck?.exists) {
      console.warn('[OFFLINE-QUEUE] duplicado detectado, eliminando imagen local', { imageUri });
      await removePersistedImage(imageUri);
      return true;
    }
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error al checkDuplicateBallot', err);
    // continuar el flujo si el check falla
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

  let ipfs;
  try {
    console.log('[OFFLINE-QUEUE] subiendo acta a IPFS', { imagePath });
    ipfs = await pinataService.uploadElectoralActComplete(
      imagePath,
      aiAnalysis || {},
      {...electoralData, voteSummaryResults: normalizedVoteSummary},
      normalizedAdditional,
    );
    console.log('[OFFLINE-QUEUE] resultado IPFS', { success: ipfs?.success });
    if (!ipfs.success) {
      console.error('[OFFLINE-QUEUE] fallo uploadElectoralActComplete', ipfs.error);
      throw new Error(ipfs.error || 'uploadElectoralActComplete failed');
    }
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error subiendo a IPFS', err);
    throw err;
  }
  const ipfsData = ipfs.data;

  const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/validate-ballot-data`;

  try {
    console.log('[OFFLINE-QUEUE] validando datos del acta en backend', { backendUrl, jsonUrl: ipfsData.jsonUrl });
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
    console.log('[OFFLINE-QUEUE] backend validation success');
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error en backend validation', err);
    throw err;
  }

  const privateKey = userData?.privKey;
  let isRegistered = await oracleReads.isRegistered(CHAIN, userData.account, 1);
  if (!isRegistered) {
    console.log('[OFFLINE-QUEUE] usuario no registrado en oracle, solicitando registro');
    await executeOperation(
      privateKey,
      userData.account,
      CHAIN,
      oracleCalls.requestRegister(CHAIN, ipfsData.imageUrl),
    );
    isRegistered = await oracleReads.isRegistered(CHAIN, userData.account, 20);
    console.log('[OFFLINE-QUEUE] estado registro despues de requestRegister', { isRegistered });
    if (!isRegistered) {
      console.error('[OFFLINE-QUEUE] registro en oracle fallido');
      throw Error('Failed to register user on oracle');
    }
  } else {
    console.log('[OFFLINE-QUEUE] usuario ya registrado en oracle');
  }

  let response;
  try {
    console.log('[OFFLINE-QUEUE] creando attestation en oracle', { tableCode: tableData?.codigo });
    response = await executeOperation(
      privateKey,
      userData.account,
      CHAIN,
      oracleCalls.createAttestation(CHAIN, tableData.codigo, ipfsData.jsonUrl),
      oracleReads.waitForOracleEvent,
      'AttestationCreated',
    );
    console.log('[OFFLINE-QUEUE] createAttestation response', response);
  } catch (e) {
    console.error('[OFFLINE-QUEUE] error createAttestation', e);
    const msg = e.message || '';
    if (msg.indexOf('416c72656164792063726561746564') >= 0) {
      console.log('[OFFLINE-QUEUE] intentando fallback attest');
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
      console.log('[OFFLINE-QUEUE] attest response', response);
    } else {
      console.error('[OFFLINE-QUEUE] error no recuperable en attestation', e);
      throw e;
    }
  }

  const {explorer, nftExplorer, attestationNft} = availableNetworks[CHAIN];
  console.log(explorer);
  console.log(nftExplorer);
  console.log(attestationNft);
  const nftId = response.returnData.recordId.toString();
  console.log(nftId);
  const nftResult = {
    txHash: response.receipt.transactionHash,
    nftId,
    txUrl: explorer + 'tx/' + response.receipt.transactionHash,
    nftUrl: nftExplorer + '/' + attestationNft + '/' + nftId,
  };
  console.log(nftResult);

  try {
    console.log('[OFFLINE-QUEUE] notificando backend desde IPFS', { nftId });
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
    console.log('[OFFLINE-QUEUE] backend from-ipfs success');
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error notificando backend from-ipfs', err);
    // continuar para limpiar recursos locales
  }

  try {
    await removePersistedImage(imageUri);
    console.log('[OFFLINE-QUEUE] imagen local eliminada', { imageUri });
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error eliminando imagen local', err);
  }

  try {
    await requestPushPermissionExplicit();
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error solicitando permisos de push', err);
  }

  try {
    await displayLocalActaPublished({ipfsData, nftData: nftResult, tableData});
  } catch (err) {
    console.error('[OFFLINE-QUEUE] error mostrando notificacion local', err);
  }

  console.log('[OFFLINE-QUEUE] publishActaHandler finalizado con exito', { nftId });
  return {success: true, ipfsData, nftData: nftResult, tableData};
  } catch (fatalErr) {
    console.error('[OFFLINE-QUEUE] publishActaHandler fallo fatal', fatalErr);
    throw fatalErr;
  }
};
