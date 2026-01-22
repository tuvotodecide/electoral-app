import pinataService from '../utils/pinataService';
import axios from 'axios';
import {BACKEND_RESULT, CHAIN, BACKEND_SECRET, VERIFIER_REQUEST_ENDPOINT} from '@env';
import {oracleCalls, oracleReads} from '../api/oracle';
import {availableNetworks} from '../api/params';
import {removePersistedImage} from '../utils/persistLocalImage';
import {executeOperation} from '../api/account';
import {
  displayLocalActaPublished,
  showActaDuplicateNotification,
} from '../notifications';
import {requestPushPermissionExplicit} from '../services/pushPermission';
import wira from 'wira-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ELECTION_ID} from '../common/constants';

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

const fetchLatestBallotByTable = async code => {
  try {
    if (!code) return null;
    const url = `${BACKEND_RESULT}/api/v1/ballots/by-table/${encodeURIComponent(
      code,
    )}`;
    const {data} = await axios.get(url, {
      timeout: 15000,
    });
    const list = Array.isArray(data) ? data : [];
    return (
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ||
      null
    );
  } catch {
    return null;
  }
};

const extractJsonUrlFromBallot = b =>
  b?.ipfsUri ||
  b?.jsonUrl ||
  b?.ipfsJSON ||
  b?.ipfs?.json ||
  b?.ipfs?.jsonUrl ||
  null;

const fetchUserAttestations = async (dniValue, electionId) => {
  if (!dniValue) return [];
  const queryEID = electionId
    ? `?electionId=${encodeURIComponent(electionId)}`
    : '';
  const url = `${BACKEND_RESULT}/api/v1/attestations/by-user/${dniValue}${queryEID}`;
  const {data} = await axios.get(url, {
    timeout: 15000,
  });
  return data?.data || [];
};
const fetchBallotById = async ballotId => {
  if (!ballotId) return null;
  const url = `${BACKEND_RESULT}/api/v1/ballots/${ballotId}`;
  const {data} = await axios.get(url, {

    timeout: 15000,
  });
  return data?.data ?? data;
};
const hasUserAttestedTable = async (dniValue, tableCode, electionId) => {
  try {
    if (!dniValue || !tableCode) return false;
    const list = await fetchUserAttestations(dniValue, electionId);
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

const uploadCertificateAndNotifyBackend = async (
  certificateImageUri,
  normalizedAdditional,
  userData,
) => {
  if (!certificateImageUri) return;

  try {
    // Normalizar path (igual que con el acta)
    const certPath = certificateImageUri.startsWith('file://')
      ? certificateImageUri.substring(7)
      : certificateImageUri;

    // 1) Subir certificado a IPFS (imagen + metadata, SIN data)
    const nftResult = await pinataService.uploadCertificateNFT(certPath, {
      userName: normalizedAdditional.userName || '',
      tableNumber: normalizedAdditional.tableNumber || '',
      tableCode: normalizedAdditional.tableCode || '',
      location: normalizedAdditional.location || 'Bolivia',
    });

    if (!nftResult.success) {
      console.error(
        '[OFFLINE-QUEUE] error uploadCertificateNFT',
        nftResult.error,
      );
      return;
    }
    const {jsonUrl, imageUrl} = nftResult.data;

    const dniValue =
      userData?.dni ||
      userData?.vc?.credentialSubject?.governmentIdentifier ||
      userData?.vc?.credentialSubject?.documentNumber ||
      userData?.vc?.credentialSubject?.nationalIdNumber ||
      '';

    if (!dniValue) {
      console.warn('[OFFLINE-QUEUE] no hay DNI para enviar certificado');
      return;
    }
    const electionId = normalizedAdditional?.electionConfigId || undefined;

    const res = await axios.post(
      `${BACKEND_RESULT}/api/v1/users/${dniValue}/participation-nft`,
      {
        account: userData?.account,
        imageUrl,
        electionId,
      },
      {
        headers: {
          'Content-Type': 'application/json',

        },
        timeout: 30000,
      },
    );
    return {jsonUrl, imageUrl};
  } catch (err) {
    console.error(
      '[OFFLINE-QUEUE] error al subir certificado y notificar backend',
      err,
    );
  }
};

export const publishActaHandler = async (item, userData) => {
  try {
    const {
      imageUri,
      certificateImageUri,
      aiAnalysis,
      electoralData,
      additionalData,
      tableData,
    } = item.task.payload;

    // Make zk-auth to get API key for backend for upload atestation
    const apiKey = await authenticateWithBackend(
      userData.did,
      userData.privKey,
    );

    // --- Normalización de metadatos adicionales (mismos nombres) ---
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

    // --- Datos base del usuario / mesa (mismos nombres) ---
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

    const tableCodeStrict = String(tableCodeToCheck || '').trim();
    if (!tableCodeStrict || tableCodeStrict.toLowerCase() === 'n/a') {
      console.warn('[OFFLINE-QUEUE] tableCode ausente; reintento diferido');
      throw new Error('RETRY_LATER_MISSING_TABLECODE');
    }
    const electionConfigId = normalizedAdditional?.electionConfigId;

    const tableCodeForOracle = electionConfigId
      ? `${tableCodeStrict}-${electionConfigId}`
      : tableCodeStrict;

    // 0) Si este usuario YA atestiguó esta mesa → descartar (igual que online)
    if (dniValue && tableCodeStrict) {
      const alreadyMine = await hasUserAttestedTable(
        dniValue,
        tableCodeStrict,
        electionConfigId,
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

    // Helper para verificación de votos (sin cambiar nombres)
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
          partyId: String(p.id ?? p.partyId ?? p.partido ?? p.name ?? '')
            .trim()
            .toLowerCase(),
          votes:
            parseInt(type === 'presidente' ? p.presidente : p.diputado, 10) ||
            0,
        })),
        totalVotes:
          getValue('validos') + getValue('nulos') + getValue('blancos'),
      };
    };

    // 1) PRIMERO: verificar duplicado por votos (idéntico a online)
    const verificationData = {
      tableNumber: tableCodeStrict,
      votes: {parties: buildFromPayload('presidente')},
    };

    let duplicateCheck;
    try {
      duplicateCheck = await pinataService.checkDuplicateBallot(
        verificationData,
      );
      if (duplicateCheck?.exists) {
        // = Duplicado por contenido → NO subir a IPFS; attest al existente
        const existingBallot =
          duplicateCheck.ballot ||
          (await fetchLatestBallotByTable(tableCodeStrict));
        if (!existingBallot) {
          await removePersistedImage(imageUri).catch(() => {});
          await showActaDuplicateNotification({
            reason:
              'Acta ya creada y no se pudo recuperar. Se descartó el envío.',
          });
          return true;
        }

        const jsonUrl =
          existingBallot?.ipfsUri ||
          existingBallot?.jsonUrl ||
          existingBallot?.ipfsJSON ||
          existingBallot?.ipfs?.json ||
          existingBallot?.ipfs?.jsonUrl ||
          null;
        if (!jsonUrl) {
          await removePersistedImage(imageUri).catch(() => {});
          await showActaDuplicateNotification({
            reason:
              'Acta ya creada pero sin JSON accesible. Se descartó el envío.',
          });
          return true;
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
            oracleCalls.requestRegister(CHAIN, jsonUrl),
          );
          isRegistered = await oracleReads.isRegistered(
            CHAIN,
            userData.account,
            20,
          );
          if (!isRegistered) {
            throw Error(
              'No se pudo ver si eres jurado, asegúrate que la foto sea clara e inténtelo de nuevo',
            );
          }
        }

        const response = await executeOperation(
          privateKey,
          userData.account,
          CHAIN,
          oracleCalls.attest(CHAIN, tableCodeForOracle, BigInt(0), jsonUrl),
          oracleReads.waitForOracleEvent,
          'Attested',
        );

        try {
          if (existingBallot && existingBallot._id) {
            const isJury = await oracleReads.isUserJury(
              CHAIN,
              userData.account,
            );
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
                    ballotId: existingBallot._id,
                    support: true,
                    isJury,
                    dni: String(dniValue),
                  },
                ],
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                   },
                timeout: 30000,
              },
            );
          }
        } catch {}

        try {
          await removePersistedImage(imageUri);
        } catch {}
        try {
          await requestPushPermissionExplicit();
        } catch {}

        const {explorer, nftExplorer, attestationNft} =
          availableNetworks[CHAIN];
        const nftId = response.returnData.recordId.toString();
        const nftResult = {
          txHash: response.receipt.transactionHash,
          nftId,
          txUrl: explorer + 'tx/' + response.receipt.transactionHash,
          nftUrl: nftExplorer + '/' + attestationNft + '/' + nftId,
        };

        if (certificateImageUri) {
          try {
            certificateData = await uploadCertificateAndNotifyBackend(
              certificateImageUri,
              normalizedAdditional,
              userData,
            );
          } catch (err) {
            console.error(
              '[OFFLINE-QUEUE] error subiendo certificado (createAttestation)',
              err,
            );
          }
        }

        try {
          await displayLocalActaPublished({
            ipfsData: {jsonUrl, imageUrl: existingBallot?.image || null},
            nftData: nftResult,
            tableData,
            certificateData,
          });
        } catch {}

        return {
          success: true,
          ipfsData: {jsonUrl},
          nftData: nftResult,
          tableData,
          certificateData,
        };
      }
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error al checkDuplicateBallot', err);
    }

    // 2) NO fue duplicado por votos → mirar si ya existe acta en la mesa
    const existingByTable = await fetchLatestBallotByTable(tableCodeStrict);
    if (existingByTable) {
      // HAY record en la mesa PERO votos distintos:
      // SUBIR a IPFS y luego ATESTIGUAR con el JSON NUEVO (NO createAttestation)
      const imagePath = imageUri.startsWith('file://')
        ? imageUri.substring(7)
        : imageUri;

      const normalizedVoteSummary = (
        electoralData?.voteSummaryResults || []
      ).map(data => {
        if (data.id === 'validos') return {...data, label: 'Votos Válidos'};
        if (data.id === 'nulos') return {...data, label: 'Votos Nulos'};
        if (data.id === 'blancos') return {...data, label: 'Votos en Blanco'};
        return data;
      });

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
            '[OFFLINE-QUEUE] fallo uploadElectoralActComplete (attest-nuevo)',
            ipfs.error,
          );
          throw new Error(ipfs.error || 'uploadElectoralActComplete failed');
        }
      } catch (err) {
        console.error(
          '[OFFLINE-QUEUE] error subiendo a IPFS (attest-nuevo)',
          err,
        );
        throw err;
      }
      const ipfsData = ipfs.data;

      // Validación backend
      try {
        await axios.post(
          `${BACKEND_RESULT}/api/v1/ballots/validate-ballot-data`,
          {
            ipfsUri: ipfsData.jsonUrl,
            recordId: 'String',
            tableIdIpfs: 'String',
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );
      } catch (err) {
        console.error(
          '[OFFLINE-QUEUE] error en backend validation (attest-nuevo)',
          err,
        );
        throw err;
      }

      // Registrar si falta y ATESTIGUAR con JSON nuevo
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
          console.error(
            '[OFFLINE-QUEUE] registro en oracle fallido (attest-nuevo)',
          );
          throw Error(
            'No se pudo ver si eres jurado, asegúrate que la foto sea clara e inténtelo de nuevo',
          );
        }
      }

      const response = await executeOperation(
        privateKey,
        userData.account,
        CHAIN,
        oracleCalls.attest(
          CHAIN,
          tableCodeForOracle,
          BigInt(0),
          ipfsData.jsonUrl,
        ),
        oracleReads.waitForOracleEvent,
        'Attested',
      );

      // Notificar backend (from-ipfs) y registrar attestation
      let backendBallot;
      try {
        const {data} = await axios.post(
          `${BACKEND_RESULT}/api/v1/ballots/from-ipfs`,
          {
            ipfsUri: String(ipfsData.jsonUrl),
            recordId: String(response.returnData.recordId.toString()),
            tableIdIpfs: 'String',
          },
          {
            headers: {
              'Content-Type': 'application/json',

            },
            timeout: 30000,
          },
        );
        backendBallot = data;
      } catch (err) {
        console.error(
          '[OFFLINE-QUEUE] error notificando backend from-ipfs (attest-nuevo)',
          err,
        );
      }

      try {
        if (backendBallot && backendBallot._id) {
          const isJury = await oracleReads.isUserJury(CHAIN, userData.account);
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
        console.error(
          '[OFFLINE-QUEUE] error solicitando permisos de push',
          err,
        );
      }

      const {explorer, nftExplorer, attestationNft} = availableNetworks[CHAIN];
      const nftId = response.returnData.recordId.toString();
      const nftResult = {
        txHash: response.receipt.transactionHash,
        nftId,
        txUrl: explorer + 'tx/' + response.receipt.transactionHash,
        nftUrl: nftExplorer + '/' + attestationNft + '/' + nftId,
      };

      if (certificateImageUri) {
        try {
          certificateData = await uploadCertificateAndNotifyBackend(
            certificateImageUri,
            normalizedAdditional,
            userData,
          );
        } catch (err) {
          console.error(
            '[OFFLINE-QUEUE] error subiendo certificado (attest-nuevo)',
            err,
          );
        }
      }

      try {
        await displayLocalActaPublished({
          ipfsData,
          nftData: nftResult,
          tableData,
          certificateData,
        });
      } catch (err) {
        console.error(
          '[OFFLINE-QUEUE] error mostrando notificacion local',
          err,
        );
      }

      return {
        success: true,
        ipfsData,
        nftData: nftResult,
        tableData,
        certificateData,
      };
    }

    // 3) NO hay acta por mesa → primera vez: subir + createAttestation
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

    // Validación en backend
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
      
          },
          timeout: 30000,
        },
      );
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error en backend validation', err);
      throw err;
    }

    // Registro + createAttestation (fallback a attest)
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
    }

    let response;
    try {
      response = await executeOperation(
        privateKey,
        userData.account,
        CHAIN,
        oracleCalls.createAttestation(
          CHAIN,
          tableCodeForOracle,
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
            tableCodeForOracle,
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
             
            },
            timeout: 30000,
          },
        );
      }
    } catch (err) {}

    console.log('[OFFLINE-QUEUE] acta publicada OK', { ipfsData, nftResult });

    try {
      await removePersistedImage(imageUri);
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error eliminando imagen local', err);
    }

    console.log('[OFFLINE-QUEUE] imagen local eliminada');

    try {
      await requestPushPermissionExplicit();
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error solicitando permisos de push', err);
    }

    // 👉 Subir certificado y obtener enlace (si hay foto de certificado)
    if (certificateImageUri) {
      try {
        certificateData = await uploadCertificateAndNotifyBackend(
          certificateImageUri,
          normalizedAdditional,
          userData,
        );
      } catch (err) {
        console.error(
          '[OFFLINE-QUEUE] error subiendo certificado (createAttestation)',
          err,
        );
      }
    }

    console.log('[OFFLINE-QUEUE] permisos de push gestionados');

    try {
      await displayLocalActaPublished({
        ipfsData,
        nftData: nftResult,
        tableData,
        certificateData,
      });
    } catch (err) {
      console.error('[OFFLINE-QUEUE] error mostrando notificacion local', err);
    }

    console.log('[OFFLINE-QUEUE] notificacion local mostrada');

    return {success: true, ipfsData, nftData: nftResult, tableData};
  } catch (fatalErr) {
    console.error('[OFFLINE-QUEUE] publishActaHandler fallo fatal', fatalErr);
    throw fatalErr;
  }
};

export const authenticateWithBackend = async (did, privateKey) => {
  const request = await axios.get(VERIFIER_REQUEST_ENDPOINT);

  const authData = request.data;
  if (!authData.apiKey || !authData.request) {
    throw new Error('Invalid authentication request response: missing message');
  }

  await wira.authenticateWithVerifier(
    JSON.stringify(authData.request),
    did,
    privateKey
  );

  return authData.apiKey;
}