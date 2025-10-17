import pinataService from '../utils/pinataService';
import axios from 'axios';
import {BACKEND_RESULT, CHAIN, BACKEND_SECRET} from '@env';
import {oracleCalls, oracleReads} from '../api/oracle';
import {availableNetworks} from '../api/params';
import {removePersistedImage} from '../utils/persistLocalImage';
import {executeOperation} from '../api/account';
import {
  displayLocalActaPublished,
  showActaDuplicateNotification,
} from '../notifications';
import {requestPushPermissionExplicit} from '../services/pushPermission';

const safeStr = v =>
  String(v ?? '')
    .trim()
    .toLowerCase();
const getBallotTableCode = b =>
  safeStr(
    b?.table?.tableCode ||
      b?.tableCode ||
      b?.table?.code ||
      b?.table?.codigo ||
      b?.codigo ||
      b?.code ||
      '',
  );
const fetchUserAttestations = async dniValue => {
  if (!dniValue) return [];
  const url = `${BACKEND_RESULT}/api/v1/attestations/by-user/${dniValue}`;
  const {data} = await axios.get(url, {
    headers: {'x-api-key': BACKEND_SECRET},
    timeout: 15000,
  });
  return data?.data || [];
};
const fetchBallotById = async ballotId => {
  if (!ballotId) return null;
  const url = `${BACKEND_RESULT}/api/v1/ballots/${ballotId}`;
  const {data} = await axios.get(url, {
    headers: {'x-api-key': BACKEND_SECRET},
    timeout: 15000,
  });
  return data?.data ?? data;
};
const hasUserAttestedTable = async (dniValue, tableCode) => {
  try {
    if (!dniValue || !tableCode) return false;
    const list = await fetchUserAttestations(dniValue);
    if (!list?.length) return false;
    const ids = [...new Set(list.map(a => String(a.ballotId)).filter(Boolean))];
    for (const id of ids) {
      const ballot = await fetchBallotById(id).catch(() => null);
      if (getBallotTableCode(ballot) === safeStr(tableCode)) return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const publishActaHandler = async (item, userData) => {
  try {
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

    const dniValue =
      userData?.dni ||
      userData?.vc?.credentialSubject?.governmentIdentifier ||
      userData?.vc?.credentialSubject?.documentNumber ||
      userData?.vc?.credentialSubject?.nationalIdNumber ||
      '';
    const tableCodeToCheck =
      normalizedAdditional?.tableCode ||
      tableData?.codigo ||
      tableData?.tableCode ||
      '';
    if (dniValue && tableCodeToCheck) {
      const alreadyMine = await hasUserAttestedTable(
        dniValue,
        tableCodeToCheck,
      );
      if (alreadyMine) {
        try {
          await removePersistedImage(imageUri);
        } catch {}
        await showActaDuplicateNotification({
          reason: 'Detectamos un acta igual. Se descartó el envío.',
        });

        return true;
      }
    }

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
            parseInt(type === 'presidente' ? p.presidente : p.diputado, 10) ||
            0,
        })),
        totalVotes:
          getValue('validos') + getValue('nulos') + getValue('blancos'),
      };
    };
    const verificationData = {
      tableNumber: tableData?.codigo || 'N/A',
      votes: {parties: buildFromPayload('presidente')},
    };

    let duplicateCheck;
    try {
      duplicateCheck = await pinataService.checkDuplicateBallot(
        verificationData,
      );
      if (duplicateCheck?.exists) {
        await removePersistedImage(imageUri);
        await showActaDuplicateNotification({
          reason:
            'Ya atestiguaste esta mesa con tu usuario. Se descartó el envío.',
        });
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
      ipfs = await pinataService.uploadElectoralActComplete(
        imagePath,
        aiAnalysis || {},
        {...electoralData, voteSummaryResults: normalizedVoteSummary},
        normalizedAdditional,
      );
      if (!ipfs.success) {
        console.error(
          '[OFFLINE-QUEUE] fallo uploadElectoralActComplete',
          ipfs.error,
        );
        throw new Error(ipfs.error || 'uploadElectoralActComplete failed');
      }
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error subiendo a IPFS', err);
      throw err;
    }
    const ipfsData = ipfs.data;

    const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/validate-ballot-data`;

    try {
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
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error en backend validation', err);
      throw err;
    }

    const privateKey = userData?.privKey;
    let isRegistered = await oracleReads.isRegistered(
      CHAIN,
      userData.account,
      1,
    );
    if (!isRegistered) {
      await executeOperation(
        privateKey,
        userData.account,
        CHAIN,
        oracleCalls.requestRegister(CHAIN, ipfsData.imageUrl),
      );
      isRegistered = await oracleReads.isRegistered(
        CHAIN,
        userData.account,
        20,
      );
      if (!isRegistered) {
        console.error('[OFFLINE-QUEUE] registro en oracle fallido');
        throw Error(
          'No se pudo ver si eres jurado, asegúrate que la foto sea clara e inténtelo de nuevo',
        );
      }
    } else {
    }

    let response;
    try {
      response = await executeOperation(
        privateKey,
        userData.account,
        CHAIN,
        oracleCalls.createAttestation(
          CHAIN,
          tableData.codigo,
          ipfsData.jsonUrl,
        ),
        oracleReads.waitForOracleEvent,
        'AttestationCreated',
      );
    } catch (e) {
      console.error('[OFFLINE-QUEUE] error createAttestation', e);
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
        console.error('[OFFLINE-QUEUE] error no recuperable en attestation', e);
        throw e;
      }
    }

    const {explorer, nftExplorer, attestationNft} = availableNetworks[CHAIN];
    const nftId = response.returnData.recordId.toString();
    const nftResult = {
      txHash: response.receipt.transactionHash,
      nftId,
      txUrl: explorer + 'tx/' + response.receipt.transactionHash,
      nftUrl: nftExplorer + '/' + attestationNft + '/' + nftId,
    };

    let backendBallot;
    try {
      const {data} = await axios.post(
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
      backendBallot = data;
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error notificando backend from-ipfs', err);
    }

    try {
      if (backendBallot && backendBallot._id) {
        const isJury = await oracleReads.isUserJury(CHAIN, userData.account);
        const dniValue =
          userData?.dni ||
          userData?.vc?.credentialSubject?.governmentIdentifier ||
          userData?.vc?.credentialSubject?.documentNumber ||
          userData?.vc?.credentialSubject?.nationalIdNumber ||
          '';

        await axios.post(
          `${BACKEND_RESULT}/api/v1/attestations`,
          {
            attestations: [
              {
                ballotId: backendBallot._id,
                support: true,
                isJury,
                dni: String(dniValue),
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': BACKEND_SECRET,
            },
            timeout: 30000,
          },
        );
      }
    } catch (err) {}

    try {
      await removePersistedImage(imageUri);
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error eliminando imagen local', err);
    }

    try {
      await requestPushPermissionExplicit();
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error solicitando permisos de push', err);
    }

    try {
      await displayLocalActaPublished({
        ipfsData,
        nftData: nftResult,
        tableData,
      });
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error mostrando notificacion local', err);
    }

    return {success: true, ipfsData, nftData: nftResult, tableData};
  } catch (fatalErr) {
    console.error('[OFFLINE-QUEUE] publishActaHandler fallo fatal', fatalErr);
    throw fatalErr;
  }
};
