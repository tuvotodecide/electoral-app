import pinataService from '../utils/pinataService';
import axios from 'axios';
import { BACKEND_RESULT, CHAIN, VERIFIER_REQUEST_ENDPOINT } from '@env';
import { oracleCalls, oracleReads } from '../api/oracle';
import { availableNetworks } from '../api/params';
import { removePersistedImage } from '../utils/persistLocalImage';
import { executeOperation } from '../api/account';
import {
  displayLocalActaPublished,
  showActaDuplicateNotification,
  showLocalNotification,
} from '../notifications';
import { requestPushPermissionExplicit } from '../services/pushPermission';
import wira from 'wira-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ELECTION_ID } from '../common/constants';
import { captureError, addBlockchainBreadcrumb } from '../config/sentry';
import {
  WorksheetStatus,
  getWorksheetLocalStatus,
  upsertWorksheetLocalStatus,
} from './worksheetLocalStatus';

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

const fetchLatestBallotByTable = async (code, electionId = null) => {
  try {
    if (!code) return null;
    const electionQuery = electionId
      ? `?electionId=${encodeURIComponent(String(electionId))}`
      : '';
    const url = `${BACKEND_RESULT}/api/v1/ballots/by-table/${encodeURIComponent(
      code,
    )}${electionQuery}`;
    const { data } = await axios.get(url, {
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
  const { data } = await axios.get(url, {
    timeout: 15000,
  });
  return data?.data || [];
};
const fetchBallotById = async ballotId => {
  if (!ballotId) return null;
  const url = `${BACKEND_RESULT}/api/v1/ballots/${ballotId}`;
  const { data } = await axios.get(url, {

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

const normalizeTableNumber = value => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? raw : String(parsed);
};

const fetchTablesByLocationId = async locationId => {
  const normalizedLocationId = String(locationId || '').trim();
  if (!normalizedLocationId) return [];

  const encodedLocationId = encodeURIComponent(normalizedLocationId);
  const tablesEndpoint = `${BACKEND_RESULT}/api/v1/geographic/electoral-tables?electoralLocationId=${encodedLocationId}&limit=500`;

  try {
    const { data } = await axios.get(tablesEndpoint, { timeout: 15000 });
    const list = data?.data || data?.tables || data?.data?.tables || [];
    if (Array.isArray(list)) {
      return list;
    }
  } catch {
    // fallback de compatibilidad
  }

  try {
    const legacyUrl = `${BACKEND_RESULT}/api/v1/geographic/electoral-locations/${encodedLocationId}/tables`;
    const { data } = await axios.get(legacyUrl, { timeout: 15000 });
    const list = data?.tables || data?.data?.tables || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const extractErrorMessage = error => {
  const responseData = error?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData.trim();
  }
  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message.trim();
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }
  return 'Error no controlado';
};

const isRetriableNetworkError = error => {
  if (!error) return false;
  const code = String(error?.code || '').toUpperCase();
  if (
    code === 'ECONNABORTED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT'
  ) {
    return true;
  }
  if (error?.request && !error?.response) return true;
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('internet')
  );
};

const buildWorksheetVotesFromElectoralData = electoralData => {
  const voteSummary = Array.isArray(electoralData?.voteSummaryResults)
    ? electoralData.voteSummaryResults
    : [];
  const partyResults = Array.isArray(electoralData?.partyResults)
    ? electoralData.partyResults
    : [];
  const normalize = value =>
    String(value ?? '')
      .trim()
      .toLowerCase();
  const aliases = {
    validos: ['validos', 'votos validos', 'votos válidos', 'validVotes'],
    nulos: ['nulos', 'votos nulos', 'nullVotes'],
    blancos: ['blancos', 'votos en blanco', 'blankVotes'],
  };
  const findRow = key =>
    voteSummary.find(row => {
      const id = normalize(row?.id);
      const label = normalize(row?.label);
      return id === key || aliases[key].includes(label);
    });
  const toNumber = raw => {
    const value = parseInt(String(raw ?? '0'), 10);
    return Number.isFinite(value) && value >= 0 ? value : 0;
  };
  const validVotes = toNumber(findRow('validos')?.value1);
  const nullVotes = toNumber(findRow('nulos')?.value1);
  const blankVotes = toNumber(findRow('blancos')?.value1);

  return {
    parties: {
      validVotes,
      nullVotes,
      blankVotes,
      partyVotes: partyResults.map(party => ({
        partyId: String(
          party?.id ?? party?.partyId ?? party?.partido ?? party?.name ?? '',
        )
          .trim()
          .toLowerCase(),
        votes: toNumber(party?.presidente),
      })),
      totalVotes: validVotes + nullVotes + blankVotes,
    },
  };
};

const normalizeWorksheetStatusValue = value => {
  const status = String(value || '')
    .trim()
    .toUpperCase();
  if (status === 'UPLOADED' || status === 'SUBIDA') {
    return WorksheetStatus.UPLOADED;
  }
  if (status === 'PENDING' || status === 'PENDIENTE') {
    return WorksheetStatus.PENDING;
  }
  if (status === 'FAILED' || status === 'FALLIDA' || status === 'ERROR') {
    return WorksheetStatus.FAILED;
  }
  return '';
};

const getWorksheetReferenceForActa = async ({
  dniValue,
  electionId,
  tableCode,
  apiKey,
}) => {
  const normalizedDni = String(dniValue || '').trim();
  const normalizedElectionId = String(electionId || '').trim();
  const normalizedTableCode = String(tableCode || '').trim();
  if (!normalizedDni || !normalizedElectionId || !normalizedTableCode) {
    return null;
  }

  try {
    const localStatus = await getWorksheetLocalStatus({
      dni: normalizedDni,
      electionId: normalizedElectionId,
      tableCode: normalizedTableCode,
    });
    const localWorksheetStatus = normalizeWorksheetStatusValue(
      localStatus?.status,
    );
    const localIpfsUri = String(localStatus?.ipfsUri || '').trim();
    if (localWorksheetStatus === WorksheetStatus.UPLOADED && localIpfsUri) {
      return {
        ipfsUri: localIpfsUri,
        nftLink: String(localStatus?.nftLink || '').trim() || undefined,
        source: 'local',
      };
    }
  } catch {
    // fallback backend
  }

  try {
    const { data } = await axios.get(
      `${BACKEND_RESULT}/api/v1/worksheets/${encodeURIComponent(
        normalizedDni,
      )}/by-table/${encodeURIComponent(
        normalizedTableCode,
      )}?electionId=${encodeURIComponent(normalizedElectionId)}`,
      {
        headers: {
          'x-api-key': apiKey,
        },
        timeout: 15000,
      },
    );
    const backendWorksheetStatus = normalizeWorksheetStatusValue(data?.status);
    const backendIpfsUri = String(data?.ipfsUri || '').trim();
    if (backendWorksheetStatus === WorksheetStatus.UPLOADED && backendIpfsUri) {
      return {
        ipfsUri: backendIpfsUri,
        nftLink: String(data?.nftLink || '').trim() || undefined,
        source: 'backend',
      };
    }
  } catch {
    // worksheet missing or backend unavailable
  }

  return null;
};

const assertTableExistsInLocation = async ({
  locationId,
  tableCode,
  tableNumber,
}) => {
  if (!locationId) {
    throw new Error('No se pudo validar la mesa: recinto no disponible.');
  }

  try {
    const tables = await fetchTablesByLocationId(locationId);

    if (!Array.isArray(tables) || tables.length === 0) {
      throw new Error(
        'No se pudo validar la mesa porque el recinto no devolvio mesas.',
      );
    }

    const normalizedCode = safeStr(tableCode);
    const normalizedNumber = normalizeTableNumber(tableNumber);

    const exists = tables.some(table => {
      const candidateCode = safeStr(
        table?.tableCode || table?.codigo || table?.code || '',
      );
      const candidateNumber = normalizeTableNumber(
        table?.tableNumber || table?.numero || table?.number,
      );

      const codeMatch = normalizedCode && candidateCode === normalizedCode;
      const numberMatch =
        normalizedNumber && candidateNumber === normalizedNumber;

      return codeMatch || numberMatch;
    });

    if (!exists) {
      throw new Error(
        `La mesa ${tableNumber || tableCode || ''} no existe en el recinto seleccionado.`,
      );
    }
  } catch (error) {
    if (error?.response?.status === 404) {
      throw new Error(
        'No se pudo validar la mesa porque el recinto seleccionado no existe.',
      );
    }
    throw error;
  }
};

const uploadCertificateAndNotifyBackend = async (
  certificateImageUri,
  normalizedAdditional,
  userData,
  apiKey
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
      captureError(new Error(nftResult.error || 'uploadCertificateNFT failed'), {
        flow: 'offline_queue',
        step: 'upload_certificate_nft',
        critical: true,
        tableCode: normalizedAdditional?.tableCode,
      });
      return;
    }
    const { jsonUrl, imageUrl } = nftResult.data;

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
    const electionId = normalizedAdditional?.electionId || undefined;

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
          'x-api-key': apiKey
        },
        timeout: 30000,
      },
    );
    return { jsonUrl, imageUrl };
  } catch (err) {
    captureError(err, {
      flow: 'offline_queue',
      step: 'certificate_notify_backend',
      critical: true,
      tableCode: normalizedAdditional?.tableCode,
    });
  }
};

export const publishActaHandler = async (item, userData) => {
  let certificateData = null;
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
        electionId: additionalData?.electionId ?? item?.task?.payload?.electionId ?? undefined,
        electionType: additionalData?.electionType ?? item?.task?.payload?.electionType ?? undefined,
      };
    })();
    const storedElectionId = String(
      (await AsyncStorage.getItem(ELECTION_ID)) || '',
    ).trim();
    const electionId = String(
      normalizedAdditional?.electionId ||
      item?.task?.payload?.electionId ||
      storedElectionId ||
      '',
    ).trim() || undefined;
    normalizedAdditional.electionId = electionId;
    const observationPayload = (() => {
      const hasObservationCandidate =
        typeof electoralData?.hasObservation === 'boolean'
          ? electoralData.hasObservation
          : typeof normalizedAdditional?.hasObservation === 'boolean'
            ? normalizedAdditional.hasObservation
            : undefined;
      const observationTextCandidate = String(
        electoralData?.observationText ??
        normalizedAdditional?.observationText ??
        '',
      ).trim();

      if (hasObservationCandidate === true) {
        return {
          hasObservation: true,
          observationText: observationTextCandidate,
        };
      }
      if (hasObservationCandidate === false) {
        return {
          hasObservation: false,
        };
      }
      return {};
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
    const locationIdToCheck =
      normalizedAdditional?.locationId ||
      normalizedAdditional?.idRecinto ||
      tableData?.idRecinto ||
      tableData?.locationId ||
      null;
    const tableNumberToCheck =
      normalizedAdditional?.tableNumber ||
      tableData?.tableNumber ||
      tableData?.numero ||
      tableData?.number ||
      '';

    const tableCodeStrict = String(tableCodeToCheck || '').trim();
    if (!tableCodeStrict || tableCodeStrict.toLowerCase() === 'n/a') {
      console.warn('[OFFLINE-QUEUE] tableCode ausente; reintento diferido');
      throw new Error('RETRY_LATER_MISSING_TABLECODE');
    }
    const tableCodeForOracle = electionId
      ? `${tableCodeStrict}-${electionId}`
      : tableCodeStrict;
    // try {
    //   const worksheetReference = await getWorksheetReferenceForActa({
    //     dniValue,
    //     electionId,
    //     tableCode: tableCodeStrict,
    //     apiKey,
    //   });
    //   if (worksheetReference?.ipfsUri) {
    //     normalizedAdditional.worksheetIpfsUri = worksheetReference.ipfsUri;
    //     normalizedAdditional.worksheetReferenceSource = worksheetReference.source;
    //     if (worksheetReference?.nftLink) {
    //       normalizedAdditional.worksheetNftLink = worksheetReference.nftLink;
    //     }
    //   }
    // } catch {
    //   // non-critical: attestation can continue without worksheet reference.
    // }

    try {
      await assertTableExistsInLocation({
        locationId: locationIdToCheck,
        tableCode: tableCodeStrict,
        tableNumber: tableNumberToCheck,
      });
    } catch (err) {
      captureError(err, {
        flow: 'offline_queue',
        step: 'validate_table_exists',
        critical: true,
        tableCode: tableCodeStrict,
        locationId: locationIdToCheck,
      });
      throw err;
    }
    // 0) Si este usuario YA atestiguó esta mesa → descartar (igual que online)
    if (dniValue && tableCodeStrict) {
      const alreadyMine = await hasUserAttestedTable(
        dniValue,
        tableCodeStrict,
        electionId,
      );
      if (alreadyMine) {
        try {
          await removePersistedImage(imageUri);
        } catch { }
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
      votes: { parties: buildFromPayload('presidente') },
    };

    let duplicateCheck;
    try {
      duplicateCheck = await pinataService.checkDuplicateBallot(
        verificationData,
      );
      if (duplicateCheck?.exists) {
        const existingBallot =
          duplicateCheck.ballot ||
          (await fetchLatestBallotByTable(tableCodeStrict, electionId));
        if (!existingBallot) {
          await removePersistedImage(imageUri).catch(() => { });
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
          await removePersistedImage(imageUri).catch(() => { });
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
            const queryEID = electionId
              ? `?electionId=${encodeURIComponent(electionId)}`
              : '';
            await axios.post(
              `${BACKEND_RESULT}/api/v1/attestations${queryEID}`,
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
                  'x-api-key': apiKey
                },
                timeout: 30000,
              },
            );
          }
        } catch { }

        try {
          await removePersistedImage(imageUri);
        } catch { }
        try {
          await requestPushPermissionExplicit();
        } catch { }

        const { explorer, nftExplorer, attestationNft } =
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
              apiKey,
            );
          } catch (err) {
            captureError(err, {
              flow: 'offline_queue',
              step: 'certificate_upload_attestation',
              critical: false,
              tableCode: normalizedAdditional?.tableCode,
            });
          }
        }

        try {
          await displayLocalActaPublished({
            ipfsData: { jsonUrl, imageUrl: existingBallot?.image || null },
            nftData: nftResult,
            tableData,
            certificateData,
          });
        } catch { }

        return {
          success: true,
          ipfsData: { jsonUrl },
          nftData: nftResult,
          tableData,
          certificateData,
        };
      }
    } catch (err) {
      captureError(err, {
        flow: 'offline_queue',
        step: 'check_duplicate_ballot',
        critical: false,
        tableCode: tableCodeStrict,
      });
    }

    // 2) NO fue duplicado por votos → mirar si ya existe acta en la mesa
    const existingByTable = await fetchLatestBallotByTable(
      tableCodeStrict,
      electionId,
    );
    if (existingByTable) {
      // HAY record en la mesa PERO votos distintos:
      // SUBIR a IPFS y luego ATESTIGUAR con el JSON NUEVO (NO createAttestation)
      const imagePath = imageUri.startsWith('file://')
        ? imageUri.substring(7)
        : imageUri;

      const normalizedVoteSummary = (
        electoralData?.voteSummaryResults || []
      ).map(data => {
        if (data.id === 'validos') return { ...data, label: 'Votos Válidos' };
        if (data.id === 'nulos') return { ...data, label: 'Votos Nulos' };
        if (data.id === 'blancos') return { ...data, label: 'Votos en Blanco' };
        return data;
      });

      let ipfs;
      try {
        ipfs = await pinataService.uploadElectoralActComplete(
          imagePath,
          aiAnalysis || {},
          { ...electoralData, voteSummaryResults: normalizedVoteSummary },
          normalizedAdditional,
        );
        if (!ipfs.success) {
          captureError(new Error(ipfs.error || 'uploadElectoralActComplete failed'), {
            flow: 'offline_queue',
            step: 'ipfs_upload_attest_nuevo',
            critical: true,
            tableCode: tableCodeStrict,
          });
          throw new Error(ipfs.error || 'uploadElectoralActComplete failed');
        }
      } catch (err) {
        captureError(err, {
          flow: 'offline_queue',
          step: 'ipfs_upload_attest_nuevo',
          critical: true,
          tableCode: tableCodeStrict,
        });
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
            ...(electionId ? { electionId: String(electionId) } : {}),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            timeout: 30000,
          },
        );
      } catch (err) {
        captureError(err, {
          flow: 'offline_queue',
          step: 'backend_validation_attest_nuevo',
          critical: true,
          tableCode: tableCodeStrict,
        });
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
          addBlockchainBreadcrumb('oracle_register_failed', { chain: CHAIN });
          captureError(new Error('Oracle registration failed'), {
            flow: 'offline_queue',
            step: 'oracle_register_attest_nuevo',
            critical: true,
            tableCode: tableCodeStrict,
            chain: CHAIN,
          });
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
        const { data } = await axios.post(
          `${BACKEND_RESULT}/api/v1/ballots/from-ipfs`,
          {
            ipfsUri: String(ipfsData.jsonUrl),
            recordId: String(response.returnData.recordId.toString()),
            tableIdIpfs: 'String',
            ...observationPayload,
            ...(electionId ? { electionId: String(electionId) } : {}),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            timeout: 30000,
          },
        );
        backendBallot = data;
      } catch (err) {
        captureError(err, {
          flow: 'offline_queue',
          step: 'backend_from_ipfs_attest_nuevo',
          critical: true,
          tableCode: tableCodeStrict,
        });
      }

      try {
        if (backendBallot && backendBallot._id) {
          const isJury = await oracleReads.isUserJury(CHAIN, userData.account);
          const queryEID = electionId
            ? `?electionId=${encodeURIComponent(electionId)}`
            : '';
          await axios.post(
            `${BACKEND_RESULT}/api/v1/attestations${queryEID}`,
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
                'x-api-key': apiKey

              },
              timeout: 30000,
            },
          );
        }
      } catch (err) { }

      try {
        await removePersistedImage(imageUri);
      } catch (err) {
      }
      try {
        await requestPushPermissionExplicit();
      } catch (err) {
      }

      const { explorer, nftExplorer, attestationNft } = availableNetworks[CHAIN];
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
            apiKey
          );
        } catch (err) {
          captureError(err, {
            flow: 'offline_queue',
            step: 'certificate_upload_attest_nuevo',
            critical: false,
            tableCode: tableCodeStrict,
          });
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
        if (data.id === 'validos') return { ...data, label: 'Votos Válidos' };
        if (data.id === 'nulos') return { ...data, label: 'Votos Nulos' };
        if (data.id === 'blancos') return { ...data, label: 'Votos en Blanco' };
        return data;
      },
    );

    let ipfs;
    try {
      ipfs = await pinataService.uploadElectoralActComplete(
        imagePath,
        aiAnalysis || {},
        { ...electoralData, voteSummaryResults: normalizedVoteSummary },
        normalizedAdditional,
      );
      if (!ipfs.success) {
        captureError(new Error(ipfs.error || 'uploadElectoralActComplete failed'), {
          flow: 'offline_queue',
          step: 'ipfs_upload_create',
          critical: true,
          tableCode: tableCodeStrict,
        });
        throw new Error(ipfs.error || 'uploadElectoralActComplete failed');
      }
    } catch (err) {
      captureError(err, {
        flow: 'offline_queue',
        step: 'ipfs_upload_create',
        critical: true,
        tableCode: tableCodeStrict,
      });
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
          ...(electionId ? { electionId: String(electionId) } : {}),
        },
        {
          'Content-Type': 'application/json',
          headers: {
            'x-api-key': apiKey,
          },
          timeout: 30000,
        },
      );
    } catch (err) {
      captureError(err, {
        flow: 'offline_queue',
        step: 'backend_validation_create',
        critical: true,
        tableCode: tableCodeStrict,
      });
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
        addBlockchainBreadcrumb('oracle_register_failed', { chain: CHAIN });
        captureError(new Error('Oracle registration failed'), {
          flow: 'offline_queue',
          step: 'oracle_register_create',
          critical: true,
          tableCode: tableCodeStrict,
          chain: CHAIN,
        });
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
      addBlockchainBreadcrumb('createAttestation_error', { chain: CHAIN });
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
        captureError(e, {
          flow: 'offline_queue',
          step: 'create_attestation_unrecoverable',
          critical: true,
          tableCode: tableCodeStrict,
          chain: CHAIN,
        }); throw e;
      }
    }

    const { explorer, nftExplorer, attestationNft } = availableNetworks[CHAIN];
    const nftId = response.returnData.recordId.toString();
    const nftResult = {
      txHash: response.receipt.transactionHash,
      nftId,
      txUrl: explorer + 'tx/' + response.receipt.transactionHash,
      nftUrl: nftExplorer + '/' + attestationNft + '/' + nftId,
    };

    let backendBallot;
    try {
      const { data } = await axios.post(
        `${BACKEND_RESULT}/api/v1/ballots/from-ipfs`,
        {
          ipfsUri: String(ipfsData.jsonUrl),
          recordId: String(nftId),
          tableIdIpfs: 'String',
          ...observationPayload,
          ...(electionId ? { electionId: String(electionId) } : {}),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          timeout: 30000,
        },
      );
      backendBallot = data;
    } catch (err) {
      captureError(err, {
        flow: 'offline_queue',
        step: 'backend_from_ipfs_create',
        critical: true,
        tableCode: tableCodeStrict,
      });
    }

    try {
      if (backendBallot && backendBallot._id) {
        const isJury = await oracleReads.isUserJury(CHAIN, userData.account);
        const queryEID = electionId
          ? `?electionId=${encodeURIComponent(electionId)}`
          : '';
        await axios.post(
          `${BACKEND_RESULT}/api/v1/attestations${queryEID}`,
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
              'x-api-key': apiKey

            },
            timeout: 30000,
          },
        );
      }
    } catch (err) { }

    try {
      await removePersistedImage(imageUri);
    } catch (err) {

    }

    try {
      await requestPushPermissionExplicit();
    } catch (err) {
    }

    // Subir certificado y obtener enlace (si hay foto de certificado)
    if (certificateImageUri) {
      try {
        certificateData = await uploadCertificateAndNotifyBackend(
          certificateImageUri,
          normalizedAdditional,
          userData,
          apiKey
        );
      } catch (err) {
        captureError(err, {
          flow: 'offline_queue',
          step: 'certificate_upload_create',
          critical: false,
          tableCode: tableCodeStrict,
        });
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
    }

    return { success: true, ipfsData, nftData: nftResult, tableData };
  } catch (fatalErr) {
    captureError(fatalErr, {
      flow: 'offline_queue',
      step: 'publish_acta_fatal',
      critical: true,
      tableCode: item?.task?.payload?.tableData?.tableCode,
    }); throw fatalErr;
  }
};

// export const publishWorksheetHandler = async (item, userData) => {
//   const payload = item?.task?.payload || item?.payload || {};
//   const imageUri = payload?.imageUri;
//   const aiAnalysis = payload?.aiAnalysis || {};
//   const electoralData = payload?.electoralData || {};
//   const additionalData = payload?.additionalData || {};
//   const tableData = payload?.tableData || {};

//   const dniValue =
//     String(
//       additionalData?.dni ||
//       userData?.dni ||
//       userData?.vc?.credentialSubject?.governmentIdentifier ||
//       userData?.vc?.credentialSubject?.documentNumber ||
//       userData?.vc?.credentialSubject?.nationalIdNumber ||
//       '',
//     ).trim();

//   const electionId = String(
//     additionalData?.electionId || payload?.electionId || '',
//   ).trim();
//   const tableCode = String(
//     additionalData?.tableCode ||
//     tableData?.codigo ||
//     tableData?.tableCode ||
//     payload?.tableCode ||
//     '',
//   ).trim();
//   const tableNumber = String(
//     additionalData?.tableNumber ||
//     tableData?.tableNumber ||
//     tableData?.numero ||
//     tableData?.number ||
//     payload?.tableNumber ||
//     '',
//   ).trim();
//   const locationId = String(
//     additionalData?.locationId ||
//     additionalData?.idRecinto ||
//     payload?.locationId ||
//     tableData?.idRecinto ||
//     tableData?.locationId ||
//     '',
//   ).trim();

//   const worksheetIdentity = {
//     dni: dniValue,
//     electionId,
//     tableCode,
//   };

//   const retryPayload = {
//     ...payload,
//     additionalData: {
//       ...additionalData,
//       dni: dniValue,
//       electionId,
//       tableCode,
//       tableNumber,
//       locationId,
//     },
//     tableData: {
//       ...tableData,
//       codigo: tableCode,
//       tableCode,
//       tableNumber,
//       numero: tableNumber,
//       idRecinto: locationId,
//       locationId,
//     },
//   };

//   const updateWorksheetLocalStatus = async (status, extra = {}) => {
//     if (!dniValue || !electionId || !tableCode) return;
//     await upsertWorksheetLocalStatus(worksheetIdentity, {
//       status,
//       tableCode,
//       tableNumber,
//       electionId,
//       dni: dniValue,
//       ...extra,
//     });
//   };

//   if (!dniValue || !electionId || !tableCode || !tableNumber) {
//     const missingFieldError = new Error(
//       'Faltan datos obligatorios de hoja de trabajo (dni/electionId/tableCode/tableNumber).',
//     );
//     await updateWorksheetLocalStatus(WorksheetStatus.FAILED, {
//       errorMessage: missingFieldError.message,
//       retryPayload,
//     });
//     throw missingFieldError;
//   }

//   const latestBallot = await fetchLatestBallotByTable(tableCode, electionId);
//   if (latestBallot) {
//     const blockedByActaError = new Error(
//       'No se puede subir hoja de trabajo porque esta mesa ya tiene acta registrada.',
//     );
//     blockedByActaError.removeFromQueue = true;
//     await updateWorksheetLocalStatus(WorksheetStatus.FAILED, {
//       errorMessage: blockedByActaError.message,
//       retryPayload: null,
//     });
//     throw blockedByActaError;
//   }

//   let ipfsData = null;
//   let jsonUrl = String(payload?.ipfsUri || payload?.jsonUrl || '').trim();
//   let imageUrl = String(payload?.imageUrl || '').trim() || null;
//   const worksheetVotes = buildWorksheetVotesFromElectoralData(electoralData);

//   try {
//     const apiKey = await authenticateWithBackend(userData.did, userData.privKey);

//     if (!jsonUrl) {
//       if (!imageUri) {
//         throw new Error(
//           'No se encontro la imagen local de la hoja de trabajo para subir.',
//         );
//       }
//       const imagePath = imageUri.startsWith('file://')
//         ? imageUri.substring(7)
//         : imageUri;

//       const normalizedVoteSummary = (
//         electoralData?.voteSummaryResults || []
//       ).map(data => {
//         if (data.id === 'validos') return { ...data, label: 'Votos Válidos' };
//         if (data.id === 'nulos') return { ...data, label: 'Votos Nulos' };
//         if (data.id === 'blancos') return { ...data, label: 'Votos en Blanco' };
//         return data;
//       });

//       const ipfs = await pinataService.uploadElectoralActComplete(
//         imagePath,
//         aiAnalysis || {},
//         { ...electoralData, voteSummaryResults: normalizedVoteSummary },
//         {
//           ...additionalData,
//           idRecinto: locationId,
//           locationId,
//           tableCode,
//           tableNumber,
//           role: 'worksheet',
//         },
//       );

//       if (!ipfs?.success) {
//         throw new Error(ipfs?.error || 'No se pudo subir la hoja a IPFS');
//       }

//       ipfsData = ipfs.data;
//       jsonUrl = String(ipfsData?.jsonUrl || '').trim();
//       imageUrl = String(ipfsData?.imageUrl || '').trim() || imageUrl;
//     }

//     if (!jsonUrl) {
//       throw new Error('No se obtuvo JSON de IPFS para la hoja de trabajo.');
//     }

//     const nftLink = String(
//       payload?.nftLink || payload?.worksheetMeta?.nftLink || jsonUrl,
//     ).trim();

//     const body = {
//       dni: dniValue,
//       electionId,
//       ipfsUri: jsonUrl,
//       tableCode,
//       tableNumber,
//       locationId: locationId || undefined,
//       image: imageUrl || undefined,
//       votes: worksheetVotes,
//       recordId: String(payload?.recordId || ipfsData?.jsonCID || '').trim() || undefined,
//       tableIdIpfs:
//         String(payload?.tableIdIpfs || 'String').trim() || undefined,
//       nftLink: nftLink || undefined,
//     };

//     const { data } = await axios.post(
//       `${BACKEND_RESULT}/api/v1/worksheets/from-ipfs`,
//       body,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-api-key': apiKey,
//         },
//         timeout: 30000,
//       },
//     );

//     await updateWorksheetLocalStatus(WorksheetStatus.UPLOADED, {
//       ipfsUri: data?.ipfsUri || jsonUrl,
//       nftLink: data?.nftLink || nftLink || jsonUrl,
//       errorMessage: undefined,
//       retryPayload: null,
//     });

//     try {
//       await showLocalNotification({
//         title: 'Hoja de trabajo subida',
//         body: `Mesa ${tableNumber}: tu hoja ya esta disponible para comparacion.`,
//       });
//     } catch {}

//     if (imageUri) {
//       await removePersistedImage(imageUri).catch(() => { });
//     }

//     return {
//       success: true,
//       ipfsData: ipfsData || { jsonUrl, imageUrl },
//       worksheet: data,
//     };
//   } catch (error) {
//     const statusCode = error?.response?.status;
//     const backendMessage = extractErrorMessage(error);
//     const normalizedBackendMessage = backendMessage.toLowerCase();

//     if (statusCode === 409 && normalizedBackendMessage.includes('ya fue subida')) {
//       await updateWorksheetLocalStatus(WorksheetStatus.UPLOADED, {
//         ipfsUri: jsonUrl || undefined,
//         nftLink: payload?.nftLink || jsonUrl || undefined,
//         errorMessage: undefined,
//         retryPayload: null,
//       });
//       if (imageUri) {
//         await removePersistedImage(imageUri).catch(() => { });
//       }
//       return { success: true, alreadyUploaded: true };
//     }

//     if (statusCode === 409 && normalizedBackendMessage.includes('pendiente')) {
//       await updateWorksheetLocalStatus(WorksheetStatus.PENDING, {
//         ipfsUri: jsonUrl || undefined,
//         nftLink: payload?.nftLink || jsonUrl || undefined,
//         errorMessage: backendMessage,
//         retryPayload,
//       });
//       return { success: true, alreadyPending: true };
//     }

//     const shouldRemainPending = isRetriableNetworkError(error);
//     await updateWorksheetLocalStatus(
//       shouldRemainPending ? WorksheetStatus.PENDING : WorksheetStatus.FAILED,
//       {
//         ipfsUri: jsonUrl || undefined,
//         nftLink: payload?.nftLink || jsonUrl || undefined,
//         errorMessage: backendMessage,
//         retryPayload,
//       },
//     );

//     if (!shouldRemainPending && error && typeof error === 'object') {
//       // Let queue processor drop this item so UI can expose FAILED + manual retry.
//       error.removeFromQueue = true;
//     }

//     throw error;
//   }
// };

export const publishWorksheetHandler = async (item, userData) => {
  const payload = item?.task?.payload || item?.payload || {};
  const imageUri = payload?.imageUri;
  const aiAnalysis = payload?.aiAnalysis || {};
  const electoralData = payload?.electoralData || {};
  const additionalData = payload?.additionalData || {};
  const tableData = payload?.tableData || {};

  const dniValue = String(
    additionalData?.dni ||
      userData?.dni ||
      userData?.vc?.credentialSubject?.governmentIdentifier ||
      userData?.vc?.credentialSubject?.documentNumber ||
      userData?.vc?.credentialSubject?.nationalIdNumber ||
      '',
  ).trim();

  const electionId = String(
    additionalData?.electionId || payload?.electionId || '',
  ).trim();
  const tableCode = String(
    additionalData?.tableCode ||
      tableData?.codigo ||
      tableData?.tableCode ||
      payload?.tableCode ||
      '',
  ).trim();
  const tableNumber = String(
    additionalData?.tableNumber ||
      tableData?.tableNumber ||
      tableData?.numero ||
      tableData?.number ||
      payload?.tableNumber ||
      '',
  ).trim();
  const locationId = String(
    additionalData?.locationId ||
      additionalData?.idRecinto ||
      payload?.locationId ||
      tableData?.idRecinto ||
      tableData?.locationId ||
      '',
  ).trim();

  const worksheetIdentity = {
    dni: dniValue,
    electionId,
    tableCode,
  };

  const retryPayload = {
    ...payload,
    additionalData: {
      ...additionalData,
      dni: dniValue,
      electionId,
      tableCode,
      tableNumber,
      locationId,
    },
    tableData: {
      ...tableData,
      codigo: tableCode,
      tableCode,
      tableNumber,
      numero: tableNumber,
      idRecinto: locationId,
      locationId,
    },
  };

  const updateWorksheetLocalStatus = async (status, extra = {}) => {
    if (!dniValue || !electionId || !tableCode) return;
    await upsertWorksheetLocalStatus(worksheetIdentity, {
      status,
      tableCode,
      tableNumber,
      electionId,
      dni: dniValue,
      ...extra,
    });
  };

  if (!dniValue || !electionId || !tableCode || !tableNumber) {
    const missingFieldError = new Error(
      'Faltan datos obligatorios de hoja de trabajo (dni/electionId/tableCode/tableNumber).',
    );
    await updateWorksheetLocalStatus(WorksheetStatus.FAILED, {
      errorMessage: missingFieldError.message,
      retryPayload,
    });
    throw missingFieldError;
  }

  const latestBallot = await fetchLatestBallotByTable(tableCode, electionId);
  if (latestBallot) {
    const blockedByActaError = new Error(
      'No se puede subir hoja de trabajo porque esta mesa ya tiene acta registrada.',
    );
    blockedByActaError.removeFromQueue = true;
    await updateWorksheetLocalStatus(WorksheetStatus.FAILED, {
      errorMessage: blockedByActaError.message,
      retryPayload: null,
    });
    throw blockedByActaError;
  }

  let ipfsData = null;
  let jsonUrl = String(payload?.ipfsUri || payload?.jsonUrl || '').trim();
  let imageUrl = String(payload?.imageUrl || '').trim() || null;
  const worksheetVotes = buildWorksheetVotesFromElectoralData(electoralData);

  try {
    const apiKey = await authenticateWithBackend(userData.did, userData.privKey);

    if (!jsonUrl) {
      if (!imageUri) {
        throw new Error(
          'No se encontro la imagen local de la hoja de trabajo para subir.',
        );
      }
      const imagePath = imageUri.startsWith('file://')
        ? imageUri.substring(7)
        : imageUri;

      const normalizedVoteSummary = (electoralData?.voteSummaryResults || []).map(
        data => {
          if (data.id === 'validos') return { ...data, label: 'Votos Válidos' };
          if (data.id === 'nulos') return { ...data, label: 'Votos Nulos' };
          if (data.id === 'blancos') return { ...data, label: 'Votos en Blanco' };
          return data;
        },
      );

      const ipfs = await pinataService.uploadElectoralActComplete(
        imagePath,
        aiAnalysis || {},
        { ...electoralData, voteSummaryResults: normalizedVoteSummary },
        {
          ...additionalData,
          idRecinto: locationId,
          locationId,
          tableCode,
          tableNumber,
          role: 'worksheet',
        },
      );

      if (!ipfs?.success) {
        throw new Error(ipfs?.error || 'No se pudo subir la hoja a IPFS');
      }

      ipfsData = ipfs.data;
      jsonUrl = String(ipfsData?.jsonUrl || '').trim();
      imageUrl = String(ipfsData?.imageUrl || '').trim() || imageUrl;
    }

    if (!jsonUrl) {
      throw new Error('No se obtuvo JSON de IPFS para la hoja de trabajo.');
    }

    const nftLink = String(
      payload?.nftLink || payload?.worksheetMeta?.nftLink || jsonUrl,
    ).trim();

    const body = {
      dni: dniValue,
      electionId,
      ipfsUri: jsonUrl,
      tableCode,
      tableNumber,
      locationId: locationId || undefined,
      image: imageUrl || undefined,
      votes: worksheetVotes,
      recordId:
        String(payload?.recordId || ipfsData?.jsonCID || '').trim() || undefined,
      tableIdIpfs: String(payload?.tableIdIpfs || 'String').trim() || undefined,
      nftLink: nftLink || undefined,
    };

    const { data } = await axios.post(
      `${BACKEND_RESULT}/api/v1/worksheets/from-ipfs`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        timeout: 30000,
      },
    );

    await updateWorksheetLocalStatus(WorksheetStatus.UPLOADED, {
      ipfsUri: data?.ipfsUri || jsonUrl,
      nftLink: data?.nftLink || nftLink || jsonUrl,
      errorMessage: undefined,
      retryPayload: null,
    });

    try {
      await showLocalNotification({
        title: 'Hoja de trabajo subida',
        body: `Mesa ${tableNumber}: tu hoja ya esta disponible para comparacion.`,
      });
    } catch {}

    if (imageUri) {
      await removePersistedImage(imageUri).catch(() => {});
    }

    return {
      success: true,
      ipfsData: ipfsData || { jsonUrl, imageUrl },
      worksheet: data,
    };
  } catch (error) {
    const statusCode = error?.response?.status;
    const backendMessage = extractErrorMessage(error);
    const normalizedBackendMessage = backendMessage.toLowerCase();

    if (statusCode === 409 && normalizedBackendMessage.includes('ya fue subida')) {
      await updateWorksheetLocalStatus(WorksheetStatus.UPLOADED, {
        ipfsUri: jsonUrl || undefined,
        nftLink: payload?.nftLink || jsonUrl || undefined,
        errorMessage: undefined,
        retryPayload: null,
      });
      if (imageUri) {
        await removePersistedImage(imageUri).catch(() => {});
      }
      return { success: true, alreadyUploaded: true };
    }

    if (statusCode === 409 && normalizedBackendMessage.includes('pendiente')) {
      await updateWorksheetLocalStatus(WorksheetStatus.PENDING, {
        ipfsUri: jsonUrl || undefined,
        nftLink: payload?.nftLink || jsonUrl || undefined,
        errorMessage: backendMessage,
        retryPayload,
      });
      return { success: true, alreadyPending: true };
    }

    const shouldRemainPending = isRetriableNetworkError(error);
    await updateWorksheetLocalStatus(
      shouldRemainPending ? WorksheetStatus.PENDING : WorksheetStatus.FAILED,
      {
        ipfsUri: jsonUrl || undefined,
        nftLink: payload?.nftLink || jsonUrl || undefined,
        errorMessage: backendMessage,
        retryPayload,
      },
    );

    if (!shouldRemainPending && error && typeof error === 'object') {
      // Let queue processor drop this item so UI can expose FAILED + manual retry.
      error.removeFromQueue = true;
    }

    throw error;
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
