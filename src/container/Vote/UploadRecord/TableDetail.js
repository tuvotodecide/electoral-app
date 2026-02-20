import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import I18nStrings from '../../../i18n/String';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CAlert from '../../../components/common/CAlert';
import { StackNav } from '../../../navigation/NavigationKey';
import { BACKEND_RESULT } from '@env';
import { authenticateWithBackend } from '../../../utils/offlineQueueHandler';
import { enqueue, getAll as getOfflineQueue } from '../../../utils/offlineQueue';
import {
  getWorksheetLocalStatus,
  upsertWorksheetLocalStatus,
  WorksheetStatus,
} from '../../../utils/worksheetLocalStatus';
import { getCache, isFresh, setCache } from '../../../utils/lookupCache';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const normalizeMesaNumber = value => {
  const raw = `${value ?? ''}`.trim();
  if (!raw) return '';
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? raw : `${parsed}`;
};

const normalizeCode = value =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const toInt = value => {
  const parsed = parseInt(String(value ?? '0'), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractIpfsCid = ipfsUri => {
  const raw = String(ipfsUri || '').trim();
  if (!raw) return '';
  if (raw.startsWith('ipfs://')) {
    return raw.replace('ipfs://', '').split('/')[0];
  }
  const match = raw.match(/\/ipfs\/([a-zA-Z0-9]+)/i);
  return match?.[1] || '';
};

const buildIpfsJsonUrls = ipfsUri => {
  const raw = String(ipfsUri || '').trim();
  if (!raw) return [];

  const cid = extractIpfsCid(raw);
  const urls = [raw];
  if (cid) {
    urls.push(`https://ipfs.io/ipfs/${cid}`);
    urls.push(`https://cloudflare-ipfs.com/ipfs/${cid}`);
    urls.push(`https://gateway.pinata.cloud/ipfs/${cid}`);
  }
  return [...new Set(urls.filter(Boolean))];
};

const mapWorksheetMetadataToExistingRecord = (metadata, worksheetStatus = {}) => {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  const data = meta?.data && typeof meta.data === 'object' ? meta.data : {};
  const votes = data?.votes && typeof data.votes === 'object' ? data.votes : {};
  const partiesVotes =
    votes?.parties && typeof votes.parties === 'object' ? votes.parties : {};
  const partyVotesRows = Array.isArray(partiesVotes?.partyVotes)
    ? partiesVotes.partyVotes
    : [];

  const partyResults = partyVotesRows.map((row, index) => {
    const partyId = String(row?.partyId || `party-${index + 1}`).trim();
    const normalizedId = partyId.toLowerCase();
    const votesValue = toInt(row?.votes);
    return {
      id: normalizedId || `party-${index + 1}`,
      partido: partyId ? partyId.toUpperCase() : `PARTIDO ${index + 1}`,
      presidente: String(votesValue),
      diputado: '0',
    };
  });

  const voteSummaryResults = [
    {
      id: 'validos',
      label: I18nStrings.validVotes || 'Votos Validos',
      value1: String(toInt(partiesVotes?.validVotes)),
      value2: '0',
    },
    {
      id: 'blancos',
      label: I18nStrings.blankVotes || 'Votos en Blanco',
      value1: String(toInt(partiesVotes?.blankVotes)),
      value2: '0',
    },
    {
      id: 'nulos',
      label: I18nStrings.nullVotes || 'Votos Nulos',
      value1: String(toInt(partiesVotes?.nullVotes)),
      value2: '0',
    },
  ];

  const imageUrl = String(
    meta?.image ||
      data?.image ||
      worksheetStatus?.image ||
      '',
  ).trim();

  return {
    partyResults,
    voteSummaryResults,
    actaImage: imageUrl || undefined,
    image: imageUrl || undefined,
    ipfsUri: String(worksheetStatus?.ipfsUri || '').trim() || undefined,
    nftLink: String(worksheetStatus?.nftLink || '').trim() || undefined,
    status: WorksheetStatus.UPLOADED,
  };
};

const mapWorksheetDetailToExistingRecord = detail => {
  const detailImage = String(detail?.image || '').trim();
  const detailIpfsUri = String(detail?.ipfsUri || '').trim();
  const detailNftLink = String(detail?.nftLink || '').trim();
  return mapWorksheetMetadataToExistingRecord(
    {
      image: detailImage,
      data: {
        image: detailImage,
        votes: detail?.votes || {},
      },
    },
    {
      image: detailImage,
      ipfsUri: detailIpfsUri,
      nftLink: detailNftLink,
    },
  );
};

const firstFulfilled = async promises => {
  const tasks = Array.isArray(promises) ? promises : [];
  if (!tasks.length) {
    throw new Error('No hay fuentes disponibles.');
  }
  return new Promise((resolve, reject) => {
    let rejected = 0;
    const errors = [];
    tasks.forEach((task, index) => {
      Promise.resolve(task)
        .then(resolve)
        .catch(error => {
          errors[index] = error;
          rejected += 1;
          if (rejected === tasks.length) {
            reject(
              errors.find(Boolean) ||
                new Error('No se pudo obtener la hoja de trabajo.'),
            );
          }
        });
    });
  });
};

const fetchWorksheetMetadataFromIpfs = async ipfsUri => {
  const candidateUrls = buildIpfsJsonUrls(ipfsUri);
  if (!candidateUrls.length) {
    throw new Error('No se encontro URL IPFS para la hoja de trabajo.');
  }
  const attempts = candidateUrls.map(url =>
    axios
      .get(url, {
        timeout: 7000,
        headers: { Accept: 'application/json' },
      })
      .then(({ data }) => {
        if (data && typeof data === 'object') {
          return data;
        }
        throw new Error('Respuesta invalida desde IPFS.');
      }),
  );
  return firstFulfilled(attempts);
};

const LOOKUP_CACHE_TTL = {
  tablesByLocationMs: 6 * 60 * 60 * 1000,
};
const WORKSHEET_STATUS_REFRESH_COOLDOWN_MS = 15000;
const TABLE_LOOKUP_TRACE_ENABLED = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
const logTableLookupTrace = (event, payload = {}) => {
  if (!TABLE_LOOKUP_TRACE_ENABLED) return;
  console.log(`[TABLE-DETAIL][LOOKUP] ${event}`, payload);
};

const fetchTablesByLocationId = async locationId => {
  const normalizedLocationId = String(locationId || '').trim();
  if (!normalizedLocationId) return [];

  const encodedLocationId = encodeURIComponent(normalizedLocationId);
  const cacheKey = `tables-by-location:${normalizedLocationId}`;
  const cachedEntry = await getCache(cacheKey);
  const cachedTables = Array.isArray(cachedEntry?.data) ? cachedEntry.data : [];
  logTableLookupTrace('tables:cache-state', {
    cacheKey,
    cachedCount: cachedTables.length,
  });
  const cacheIsFresh = await isFresh(cacheKey, LOOKUP_CACHE_TTL.tablesByLocationMs);
  if (cacheIsFresh && cachedTables.length > 0) {
    logTableLookupTrace('tables:cache-fresh-return', {
      cacheKey,
      cachedCount: cachedTables.length,
    });
    return cachedTables;
  }

  const tablesEndpoint = `${BACKEND_RESULT}/api/v1/geographic/electoral-tables?electoralLocationId=${encodedLocationId}&limit=500`;
  try {
    const { data } = await axios.get(tablesEndpoint, { timeout: 15000 });
    const list = data?.data || data?.tables || data?.data?.tables || [];
    if (Array.isArray(list)) {
      logTableLookupTrace('tables:backend-primary-success', {
        cacheKey,
        fetchedCount: list.length,
      });
      await setCache(cacheKey, list, { version: 'tables-v1' });
      return list;
    }
  } catch (error) {
    logTableLookupTrace('tables:backend-primary-error', {
      cacheKey,
      error: error?.message || 'unknown',
    });
    // fallback de compatibilidad
  }

  try {
    const { data } = await axios.get(
      `${BACKEND_RESULT}/api/v1/geographic/electoral-locations/${encodedLocationId}/tables`,
      { timeout: 15000 },
    );
    const list = data?.tables || data?.data?.tables || [];
    if (Array.isArray(list) && list.length > 0) {
      logTableLookupTrace('tables:backend-legacy-success', {
        cacheKey,
        fetchedCount: list.length,
      });
      await setCache(cacheKey, list, { version: 'tables-v1' });
      return list;
    }
    logTableLookupTrace('tables:legacy-empty-use-cache', {
      cacheKey,
      cachedCount: cachedTables.length,
    });
    return cachedTables;
  } catch (error) {
    logTableLookupTrace('tables:legacy-error-use-cache', {
      cacheKey,
      cachedCount: cachedTables.length,
      error: error?.message || 'unknown',
    });
    return cachedTables;
  }
};

const normalizeWorksheetStatus = value => {
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
  return WorksheetStatus.NOT_FOUND;
};

const getUserDni = userData => {
  const subject = userData?.vc?.credentialSubject || {};
  return String(
    userData?.dni ||
    subject?.governmentIdentifier ||
    subject?.documentNumber ||
    subject?.nationalIdNumber ||
    '',
  ).trim();
};


export default function TableDetail({ navigation, route }) {
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);
  const { electionId, electionType } = route.params || {};
  const rawMesa = route.params?.mesa || route.params?.tableData || {};
  const locationFromParams = route.params?.locationData || {};
  const availableTables = Array.isArray(locationFromParams?.tables)
    ? locationFromParams.tables
    : Array.isArray(route.params?.tables)
      ? route.params.tables
      : [];
  const hasMesaSelectedFromParams = Boolean(
    rawMesa.tableCode ||
    rawMesa.codigo ||
    rawMesa.code ||
    rawMesa.tableNumber ||
    rawMesa.numero ||
    rawMesa.number ||
    rawMesa._id ||
    rawMesa.id ||
    rawMesa.tableId,
  );
  const [mesaNumberInput, setMesaNumberInput] = useState('');
  const [mesaSearchError, setMesaSearchError] = useState('');
  const [isSearchingMesa, setIsSearchingMesa] = useState(false);
  const [tablesForSearch, setTablesForSearch] = useState(availableTables);
  const [selectedMesaRaw, setSelectedMesaRaw] = useState(null);
  const [selectedMesaRecords, setSelectedMesaRecords] = useState(null);
  const [selectedMesaTotalRecords, setSelectedMesaTotalRecords] = useState(null);
  const [resolvedOffline, setResolvedOffline] = useState(null);
  const [worksheetStatus, setWorksheetStatus] = useState({
    status: WorksheetStatus.NOT_FOUND,
  });
  const [hasPendingActaInQueue, setHasPendingActaInQueue] = useState(false);
  const [isWorksheetLoading, setIsWorksheetLoading] = useState(false);
  const [isWorksheetActionLoading, setIsWorksheetActionLoading] = useState(false);
  const [worksheetFeedback, setWorksheetFeedback] = useState('');
  const worksheetStatusSyncRef = useRef({
    lastSyncAt: 0,
  });
  const routeExistingRecords = route.params?.existingRecords || [];

  const normalizeMesaData = mesaSource => {
    const source = mesaSource || {};
    const sourceMesaId =
      source.tableId || source.id || source._id || route.params?.tableId;

    return {
      id: sourceMesaId,
      tableId: sourceMesaId,
      idRecinto:
        source.idRecinto ||
        source.locationId ||
        route.params?.locationId ||
        locationFromParams?._id,
      numero:
        source.tableNumber ||
        source.numero ||
        source.number ||
        sourceMesaId ||
        'N/A',
      tableNumber:
        source.tableNumber ||
        source.numero ||
        source.number ||
        sourceMesaId ||
        'N/A',
      number:
        source.number ||
        source.tableNumber ||
        source.numero ||
        sourceMesaId ||
        'N/A',
      codigo: source.tableCode || source.codigo || source.code || 'N/A',
      colegio:
        source.name ||
        source.recinto ||
        source.colegio ||
        source.escuela ||
        source.location?.name ||
        locationFromParams?.name ||
        'N/A',
      recinto:
        source.recinto ||
        source.name ||
        source.colegio ||
        source.escuela ||
        source.location?.name ||
        locationFromParams?.name ||
        'N/A',
      direccion:
        source.address ||
        source.direccion ||
        source.location?.address ||
        locationFromParams?.address ||
        'N/A',
      provincia:
        source.electoralSeatId?.municipalityId?.provinceId?.name ||
        source.provincia ||
        source.province ||
        locationFromParams?.electoralSeat?.municipality?.province?.name ||
        'N/A',
      zone:
        source.zone ||
        source.district ||
        source.zona ||
        source.electoralZone ||
        source.location?.zone ||
        locationFromParams?.zone ||
        locationFromParams?.district ||
        'Zona no especificada',
    };
  };

  // Normalize mesa data structure
  const mesa = normalizeMesaData(selectedMesaRaw || rawMesa);
  const hasMesaSelected =
    Boolean(selectedMesaRaw) || hasMesaSelectedFromParams;
  const existingRecords = selectedMesaRecords ?? routeExistingRecords;
  const totalRecords =
    selectedMesaTotalRecords ??
    route.params?.totalRecords ??
    (Array.isArray(existingRecords) ? existingRecords.length : 0);
  const currentOffline = resolvedOffline ?? route.params?.offline;
  const shouldCenter = !(existingRecords && existingRecords.length > 0);
  const hasRecords =
    Array.isArray(existingRecords) && existingRecords.length > 0;
  const recordsCount = hasRecords ? existingRecords.length : 0;
  const recordsMsg = `La mesa ya tiene ${recordsCount} acta${recordsCount === 1 ? '' : 's'
    } publicada${recordsCount === 1 ? '' : 's'}`;
  const currentDni = getUserDni(userData);
  const tableCodeForWorksheet = String(
    mesa?.codigo || mesa?.tableCode || mesa?.code || '',
  ).trim();
  const tableNumberForWorksheet = String(
    mesa?.tableNumber || mesa?.numero || mesa?.number || '',
  ).trim();
  const worksheetIdentity = {
    dni: currentDni,
    electionId: String(electionId || ''),
    tableCode: tableCodeForWorksheet,
  };

  const buildFinalTableData = useCallback(() => {
    return {
      ...mesa,
      ubicacion: `${mesa.recinto}, ${mesa.provincia}`,
      tableNumber: mesa.tableNumber || mesa.numero || 'Debug-1234',
      numero: mesa.numero || mesa.tableNumber || 'Debug-1234',
      number: mesa.number || mesa.tableNumber || mesa.numero || 'Debug-1234',
    };
  }, [mesa]);

  const isWorksheetTaskForCurrentTable = useCallback(
    taskPayload => {
      const payload = taskPayload || {};
      const payloadDni = String(
        payload?.additionalData?.dni || payload?.dni || '',
      ).trim();
      const payloadElectionId = String(
        payload?.additionalData?.electionId || payload?.electionId || '',
      ).trim();
      const payloadTableCode = normalizeCode(
        payload?.additionalData?.tableCode ||
        payload?.tableCode ||
        payload?.tableData?.codigo ||
        payload?.tableData?.tableCode,
      );

      return (
        payloadDni &&
        payloadElectionId &&
        payloadTableCode &&
        payloadDni === currentDni &&
        payloadElectionId === String(electionId || '') &&
        payloadTableCode === normalizeCode(tableCodeForWorksheet)
      );
    },
    [currentDni, electionId, tableCodeForWorksheet],
  );

  const isActaTaskForCurrentTable = useCallback(
    taskPayload => {
      const payload = taskPayload || {};
      const payloadDni = String(
        payload?.additionalData?.dni || payload?.dni || '',
      ).trim();
      const payloadElectionId = String(
        payload?.additionalData?.electionId || payload?.electionId || '',
      ).trim();
      const payloadTableCode = normalizeCode(
        payload?.additionalData?.tableCode ||
        payload?.tableCode ||
        payload?.tableData?.codigo ||
        payload?.tableData?.tableCode,
      );

      return (
        payloadDni &&
        payloadElectionId &&
        payloadTableCode &&
        payloadDni === currentDni &&
        payloadElectionId === String(electionId || '') &&
        payloadTableCode === normalizeCode(tableCodeForWorksheet)
      );
    },
    [currentDni, electionId, tableCodeForWorksheet],
  );

  const fetchWorksheetStatus = useCallback(async ({ silent = false, force = false } = {}) => {
    if (!hasMesaSelected || !currentDni || !tableCodeForWorksheet || !electionId) {
      setHasPendingActaInQueue(false);
      setWorksheetStatus({ status: WorksheetStatus.NOT_FOUND });
      return;
    }

    const now = Date.now();
    const lastSyncAt = worksheetStatusSyncRef.current.lastSyncAt || 0;
    if (!force && now - lastSyncAt < WORKSHEET_STATUS_REFRESH_COOLDOWN_MS) {
      return;
    }
    worksheetStatusSyncRef.current.lastSyncAt = now;

    if (!silent) {
      setIsWorksheetLoading(true);
      setWorksheetFeedback('');
    }
    try {
      const identity = {
        dni: currentDni,
        electionId: String(electionId || ''),
        tableCode: tableCodeForWorksheet,
      };

      let resolvedStatus = await getWorksheetLocalStatus(identity);
      if (resolvedStatus?.status) {
        resolvedStatus = {
          ...resolvedStatus,
          status: normalizeWorksheetStatus(resolvedStatus.status),
        };
      }

      const queuedItems = await getOfflineQueue();
      const pendingInQueue = (queuedItems || []).find(
        item =>
          item?.task?.type === 'publishWorksheet' &&
          isWorksheetTaskForCurrentTable(item?.task?.payload),
      );
      const pendingActaInQueue = (queuedItems || []).some(
        item =>
          (item?.task?.type === 'publishActa' ||
            item?.task?.type === 'syncActaBackend') &&
          isActaTaskForCurrentTable(item?.task?.payload),
      );
      setHasPendingActaInQueue(Boolean(pendingActaInQueue));

      if (pendingInQueue) {
        resolvedStatus = await upsertWorksheetLocalStatus(identity, {
          status: WorksheetStatus.PENDING,
          tableCode: tableCodeForWorksheet,
          tableNumber: tableNumberForWorksheet,
          retryPayload: pendingInQueue.task?.payload,
          errorMessage: undefined,
        });
      }

      const netState = await NetInfo.fetch();
      const isOnline =
        !!netState?.isConnected && netState?.isInternetReachable !== false;

      if (
        isOnline &&
        userData?.did &&
        userData?.privKey &&
        String(electionId || '').trim()
      ) {
        try {
          const apiKey = await authenticateWithBackend(
            userData.did,
            userData.privKey,
          );
          const { data } = await axios.get(
            `${BACKEND_RESULT}/api/v1/worksheets/${encodeURIComponent(
              currentDni,
            )}/by-table/${encodeURIComponent(tableCodeForWorksheet)}?electionId=${encodeURIComponent(
              String(electionId),
            )}`,
            {
              headers: {
                'x-api-key': apiKey,
              },
              timeout: 15000,
            },
          );

          const backendStatus = normalizeWorksheetStatus(data?.status);
          if (backendStatus !== WorksheetStatus.NOT_FOUND) {
            resolvedStatus = await upsertWorksheetLocalStatus(identity, {
              status: backendStatus,
              tableCode: data.tableCode || tableCodeForWorksheet,
              tableNumber: data.tableNumber || tableNumberForWorksheet,
              ipfsUri: data.ipfsUri,
              nftLink: data.nftLink,
              errorMessage: data.errorMessage,
            });
          }
        } catch {
          // Mantener fallback local si backend no responde.
        }
      }

      if (pendingInQueue && resolvedStatus?.status !== WorksheetStatus.UPLOADED) {
        resolvedStatus = {
          ...(resolvedStatus || {}),
          status: WorksheetStatus.PENDING,
        };
      }

      setWorksheetStatus(resolvedStatus || { status: WorksheetStatus.NOT_FOUND });
    } finally {
      if (!silent) {
        setIsWorksheetLoading(false);
      }
    }
  }, [
    hasMesaSelected,
    currentDni,
    tableCodeForWorksheet,
    electionId,
    isWorksheetTaskForCurrentTable,
    isActaTaskForCurrentTable,
    tableNumberForWorksheet,
    userData?.did,
    userData?.privKey,
  ]);

  // If an image comes from CameraScreen, use it
  const [capturedImage, setCapturedImage] = useState(
    route.params?.capturedImage || null,
  );
  const [modalVisible, setModalVisible] = useState(
    !!route.params?.capturedImage,
  );

  const fetchExistingRecordsByTable = async tableCode => {
    const electionQuery = electionId
      ? `?electionId=${encodeURIComponent(electionId)}`
      : '';
    const response = await axios.get(
      `${BACKEND_RESULT}/api/v1/ballots/by-table/${encodeURIComponent(tableCode)}${electionQuery}`,
      { timeout: 15000 },
    );

    let records = [];
    if (Array.isArray(response.data)) {
      records = response.data;
    } else if (response.data && Array.isArray(response.data.registros)) {
      records = response.data.registros;
    } else if (response.data) {
      records = [response.data];
    }

    return Array.isArray(records)
      ? records.map(record => {
        const cidFromImage = record.image?.startsWith('ipfs://')
          ? record.image.replace('ipfs://', '')
          : null;
        const actaImagePrimary = cidFromImage
          ? `https://ipfs.io/ipfs/${cidFromImage}`
          : record.ipfsCid
            ? `https://ipfs.io/ipfs/${record.ipfsCid}`
            : record.image && record.image.startsWith('http')
              ? record.image
              : record.ipfsUri || null;
        const presidentialParties = record.votes?.parties?.partyVotes || [];

        const partyResults = presidentialParties.map(presParty => ({
          partyId: global.String(presParty.partyId ?? '').trim().toLowerCase(),
          presidente: presParty.votes,
        }));

        const presVoteSummary = record.votes?.parties || {};

        return {
          ...record,
          actaImage: actaImagePrimary,
          partyResults,
          voteSummaryResults: {
            presValidVotes: presVoteSummary.validVotes || 0,
            presBlankVotes: presVoteSummary.blankVotes || 0,
            presNullVotes: presVoteSummary.nullVotes || 0,
            presTotalVotes: presVoteSummary.totalVotes || 0,
          },
        };
      })
      : [];
  };

  const handleMesaSearch = async () => {
    const normalizedInput = normalizeMesaNumber(mesaNumberInput);
    if (!normalizedInput) {
      setMesaSearchError('Escribe el numero de mesa.');
      return;
    }

    setMesaSearchError('');
    setIsSearchingMesa(true);

    try {
      const netState = await NetInfo.fetch();
      const isOnline = !!netState?.isConnected &&
        netState?.isInternetReachable !== false;
      let tablesPool = tablesForSearch;

      if (!Array.isArray(tablesPool) || tablesPool.length === 0) {
        const locationId =
          locationFromParams?._id ||
          locationFromParams?.locationId ||
          route.params?.locationId;
        if (locationId) {
          const fetched = await fetchTablesByLocationId(locationId);
          if (Array.isArray(fetched) && fetched.length > 0) {
            tablesPool = fetched;
            setTablesForSearch(fetched);
          }
        }
      }
      if (!Array.isArray(tablesPool) || tablesPool.length === 0) {
        setMesaSearchError(
          'No hay mesas disponibles en cache para este recinto. Conectate a internet para actualizar los datos.',
        );
        return;
      }

      const matchedTable = tablesPool.find(table => {
        const candidate = normalizeMesaNumber(
          table?.tableNumber || table?.numero || table?.number,
        );
        return candidate === normalizedInput;
      });

      if (!matchedTable) {
        setMesaSearchError(
          `La mesa ${normalizedInput} no existe en este recinto.`,
        );
        return;
      }

      const matchedMesa = normalizeMesaData(matchedTable);
      let records = [];

      if (isOnline) {
        try {
          records = await fetchExistingRecordsByTable(matchedMesa.codigo);
        } catch (error) {
          if (error?.response?.status !== 404) {
            records = [];
          }
        }
      }

      setSelectedMesaRaw(matchedMesa);
      setSelectedMesaRecords(records);
      setSelectedMesaTotalRecords(records.length);
      setResolvedOffline(!isOnline);
    } finally {
      setIsSearchingMesa(false);
    }
  };

  useEffect(() => {
    fetchWorksheetStatus({ force: true });
  }, [fetchWorksheetStatus, route.params?.worksheetRefreshTs]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchWorksheetStatus({ silent: true });
    });
    return unsubscribeFocus;
  }, [navigation, fetchWorksheetStatus]);


  const handleTakePhoto = () => {
    const finalTableData = buildFinalTableData();

    const count = Array.isArray(existingRecords) ? existingRecords.length : 0;


    if (count === 0) {
      try {
        navigation.navigate(StackNav.CameraScreen, {
          tableData: finalTableData,
          mesaData: finalTableData,
          mesa: finalTableData,
          electionId, electionType
        });
      } catch {
        navigation.navigate('CameraScreen', {
          tableData: finalTableData,
          mesaData: finalTableData,
          mesa: finalTableData,
          electionId, electionType
        });
      }
      return;
    }

    if (count === 1) {
      const record = existingRecords[0];
      try {
        navigation.navigate(StackNav.PhotoReviewScreen, {
          mesa: finalTableData,
          tableData: finalTableData,
          mesaData: finalTableData,
          existingRecord: record,
          isViewOnly: true,
          photoUri: record?.actaImage,
          mode: 'attest', electionId, electionType
        });

      } catch {
        navigation.navigate('PhotoReviewScreen', {
          mesa: finalTableData,
          tableData: finalTableData,
          mesaData: finalTableData,
          existingRecord: record,
          isViewOnly: true,
          photoUri: record?.actaImage,
          mode: 'attest',
          electionId, electionType
        });
      }
      return;
    }

    // >1 actas -> WhichIsCorrectScreen
    try {
      navigation.navigate(StackNav.WhichIsCorrectScreen, {
        mesa: finalTableData,
        tableData: finalTableData,
        mesaData: finalTableData,
        existingRecords,
        totalRecords,
        fromTableDetail: true,
        electionId, electionType
      });
    } catch {
      navigation.navigate('WhichIsCorrectScreen', {
        mesa: finalTableData,
        tableData: finalTableData,
        mesaData: finalTableData,
        existingRecords,
        totalRecords,
        fromTableDetail: true,
        electionId, electionType
      });
    }
  };

  const handleConfirmPhoto = () => {
    setModalVisible(false);
    navigation.navigate(StackNav.SuccessScreen, {
      title: I18nStrings.photoSentTitle,
      message: I18nStrings.photoSentMessage,
      returnRoute: 'Home', // o la ruta principal desde donde empezó el flujo
      electionId, electionType
    });
  };

  const handleRetakePhoto = () => {
    setModalVisible(false);
    setCapturedImage(null);

    const finalTableData = buildFinalTableData();

    // Navegar de vuelta a la cámara para tomar otra foto
    navigation.navigate(StackNav.CameraScreen, {
      tableData: finalTableData,
      mesaData: finalTableData,
      mesa: finalTableData,
      electionId, electionType
    });
  };

  const handleTakeWorksheetPhoto = () => {
    const blockedByBackendRule = String(
      worksheetStatus?.errorMessage || '',
    )
      .toLowerCase()
      .includes('ya tiene acta registrada');
    const worksheetBlockedMessage = recordsCount > 0
      ? 'La mesa ya tiene acta registrada. La hoja de trabajo solo puede subirse antes del acta.'
      : hasPendingActaInQueue
        ? 'Ya tienes un acta en cola para esta mesa. La hoja debe subirse antes del acta.'
        : blockedByBackendRule
          ? 'La hoja quedo bloqueada porque el backend detecto que ya existe un acta para esta mesa.'
        : '';
    if (worksheetBlockedMessage) {
      setWorksheetFeedback(worksheetBlockedMessage);
      return;
    }

    const finalTableData = buildFinalTableData();
    setWorksheetFeedback('');
    try {
      navigation.navigate(StackNav.CameraScreen, {
        tableData: finalTableData,
        mesaData: finalTableData,
        mesa: finalTableData,
        electionId,
        electionType,
        mode: 'worksheet',
      });
    } catch {
      navigation.navigate('CameraScreen', {
        tableData: finalTableData,
        mesaData: finalTableData,
        mesa: finalTableData,
        electionId,
        electionType,
        mode: 'worksheet',
      });
    }
  };

  const handleRetryWorksheet = async () => {
    const blockedByBackendRule = String(
      worksheetStatus?.errorMessage || '',
    )
      .toLowerCase()
      .includes('ya tiene acta registrada');
    const worksheetBlockedMessage = recordsCount > 0
      ? 'No se puede reintentar la hoja porque la mesa ya tiene acta registrada.'
      : hasPendingActaInQueue
        ? 'No se puede reintentar la hoja mientras existe un acta en cola para esta mesa.'
        : blockedByBackendRule
          ? 'No se puede reintentar la hoja porque la mesa ya tiene acta registrada.'
        : '';
    if (worksheetBlockedMessage) {
      setWorksheetFeedback(worksheetBlockedMessage);
      return;
    }

    if (!currentDni || !electionId || !tableCodeForWorksheet) {
      setWorksheetFeedback(
        'No se pudo preparar el reintento. Verifica mesa, elección y usuario.',
      );
      return;
    }

    setIsWorksheetActionLoading(true);
    setWorksheetFeedback('');
    try {
      const currentQueue = await getOfflineQueue();
      const alreadyQueued = (currentQueue || []).some(
        item =>
          item?.task?.type === 'publishWorksheet' &&
          isWorksheetTaskForCurrentTable(item?.task?.payload),
      );

      if (alreadyQueued) {
        await upsertWorksheetLocalStatus(worksheetIdentity, {
          status: WorksheetStatus.PENDING,
          errorMessage: undefined,
        });
        setWorksheetStatus(prev => ({
          ...(prev || {}),
          status: WorksheetStatus.PENDING,
        }));
        setWorksheetFeedback('La hoja ya está en cola para reintento automático.');
        return;
      }

      const localStatus = await getWorksheetLocalStatus(worksheetIdentity);
      const retryPayload = localStatus?.retryPayload;

      if (retryPayload) {
        await enqueue({
          type: 'publishWorksheet',
          payload: retryPayload,
        });
        await upsertWorksheetLocalStatus(worksheetIdentity, {
          status: WorksheetStatus.PENDING,
          errorMessage: undefined,
        });
        setWorksheetStatus(prev => ({
          ...(prev || {}),
          status: WorksheetStatus.PENDING,
        }));
        setWorksheetFeedback('Reintento encolado correctamente.');
        return;
      }

      const locationIdValue = String(mesa?.idRecinto || mesa?.locationId || '').trim();
      const fallbackRetryPayload = worksheetStatus?.ipfsUri
        ? {
          aiAnalysis: {},
          electoralData: {
            partyResults: [],
            voteSummaryResults: [],
          },
          additionalData: {
            idRecinto: locationIdValue,
            locationId: locationIdValue,
            tableNumber: String(tableNumberForWorksheet || ''),
            tableCode: String(tableCodeForWorksheet || ''),
            dni: String(currentDni || ''),
            electionId: String(electionId || ''),
          },
          tableData: {
            codigo: String(tableCodeForWorksheet || ''),
            tableCode: String(tableCodeForWorksheet || ''),
            idRecinto: locationIdValue,
            locationId: locationIdValue,
            tableNumber: String(tableNumberForWorksheet || ''),
            numero: String(tableNumberForWorksheet || ''),
          },
          tableCode: String(tableCodeForWorksheet || ''),
          tableNumber: String(tableNumberForWorksheet || ''),
          locationId: locationIdValue,
          createdAt: Date.now(),
          electionId: String(electionId || ''),
          electionType: electionType || undefined,
          mode: 'worksheet',
          ipfsUri: worksheetStatus.ipfsUri,
          nftLink: worksheetStatus?.nftLink,
        }
        : null;

      if (fallbackRetryPayload) {
        await enqueue({
          type: 'publishWorksheet',
          payload: fallbackRetryPayload,
        });
        await upsertWorksheetLocalStatus(worksheetIdentity, {
          status: WorksheetStatus.PENDING,
          errorMessage: undefined,
          retryPayload: fallbackRetryPayload,
        });
        setWorksheetStatus(prev => ({
          ...(prev || {}),
          status: WorksheetStatus.PENDING,
        }));
        setWorksheetFeedback('Reintento encolado correctamente.');
        return;
      }

      setWorksheetFeedback(
        'No hay datos locales para reintentar. Mantén conexión para sincronizar automáticamente.',
      );
    } catch (error) {
      setWorksheetFeedback(
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo reintentar la hoja de trabajo.',
      );
    } finally {
      setIsWorksheetActionLoading(false);
    }
  };

  const handleViewWorksheet = async () => {
    let resolvedIpfsUri = String(
      worksheetStatus?.ipfsUri || worksheetStatus?.nftLink || '',
    ).trim();
    const canFetchDetailFromBackend =
      !!userData?.did &&
      !!userData?.privKey &&
      !!currentDni &&
      !!tableCodeForWorksheet &&
      !!String(electionId || '').trim();

    const loadFromIpfs = async ipfsUriValue => {
      const metadata = await fetchWorksheetMetadataFromIpfs(ipfsUriValue);
      return {
        worksheetRecord: mapWorksheetMetadataToExistingRecord(metadata, {
          ...worksheetStatus,
          ipfsUri: ipfsUriValue,
        }),
        ipfsUri: ipfsUriValue,
      };
    };

    const loadFromBackend = async () => {
      const apiKey = await authenticateWithBackend(userData.did, userData.privKey);
      const baseEndpoint = `${BACKEND_RESULT}/api/v1/worksheets/${encodeURIComponent(
        currentDni,
      )}/by-table/${encodeURIComponent(tableCodeForWorksheet)}`;
      const headers = {
        'x-api-key': apiKey,
      };

      let data;
      try {
        const detailResponse = await axios.get(
          `${baseEndpoint}/detail?electionId=${encodeURIComponent(
            String(electionId),
          )}`,
          {
            headers,
            timeout: 8000,
          },
        );
        data = detailResponse?.data;
      } catch (detailError) {
        const summaryResponse = await axios.get(
          `${baseEndpoint}?electionId=${encodeURIComponent(String(electionId))}`,
          {
            headers,
            timeout: 8000,
          },
        );
        data = summaryResponse?.data;
        if (!data) throw detailError;
      }

      const backendStatus = String(data?.status || '').toUpperCase();
      if (backendStatus !== WorksheetStatus.UPLOADED) {
        throw new Error('La hoja de trabajo aun no esta subida.');
      }

      const backendIpfsUri = String(data?.ipfsUri || data?.nftLink || '').trim();
      const effectiveIpfsUri = backendIpfsUri || resolvedIpfsUri;
      if (data?.votes) {
        return {
          worksheetRecord: mapWorksheetDetailToExistingRecord(data),
          ipfsUri: effectiveIpfsUri,
        };
      }
      if (effectiveIpfsUri) {
        return loadFromIpfs(effectiveIpfsUri);
      }
      throw new Error('La hoja no tiene votos ni enlace IPFS disponible.');
    };

    setIsWorksheetActionLoading(true);
    setWorksheetFeedback('');
    try {
      if (!resolvedIpfsUri && !canFetchDetailFromBackend) {
        setWorksheetFeedback(
          'No se encontro el enlace IPFS de la hoja de trabajo para visualizar.',
        );
        return;
      }

      const attempts = [];
      if (resolvedIpfsUri) {
        attempts.push(loadFromIpfs(resolvedIpfsUri));
      }
      if (canFetchDetailFromBackend) {
        attempts.push(loadFromBackend());
      }

      const resolved = await firstFulfilled(attempts);
      const worksheetRecord = resolved?.worksheetRecord;
      const resolvedIpfs = String(resolved?.ipfsUri || '').trim();

      if (!worksheetRecord) {
        throw new Error('No se pudo cargar la hoja de trabajo subida.');
      }
      if (resolvedIpfs) {
        resolvedIpfsUri = resolvedIpfs;
      }

      const finalTableData = buildFinalTableData();
      navigation.navigate(StackNav.PhotoReviewScreen, {
        mesa: finalTableData,
        tableData: finalTableData,
        mesaData: finalTableData,
        existingRecord: worksheetRecord,
        isViewOnly: true,
        photoUri: worksheetRecord?.actaImage || worksheetRecord?.image,
        mode: 'worksheet',
        electionId,
        electionType,
      });
    } catch (error) {
      setWorksheetFeedback(
        error?.message ||
          'No se pudo cargar la hoja de trabajo subida. Intenta nuevamente.',
      );
    } finally {
      setIsWorksheetActionLoading(false);
    }
  };

  const renderWorksheetSection = () => {
    if (!hasMesaSelected) return null;
    const statusValue = normalizeWorksheetStatus(worksheetStatus?.status);
    const isUploaded = statusValue === WorksheetStatus.UPLOADED;
    const isFailed = statusValue === WorksheetStatus.FAILED;
    const isNotFound = statusValue === WorksheetStatus.NOT_FOUND;
    const blockedByBackendRule = String(
      worksheetStatus?.errorMessage || '',
    )
      .toLowerCase()
      .includes('ya tiene acta registrada');
    const isWorksheetBlockedByActa =
      recordsCount > 0 || hasPendingActaInQueue || blockedByBackendRule;
    const worksheetBlockedMessage = recordsCount > 0
      ? 'La mesa ya tiene acta. La hoja de trabajo solo se permite antes del acta.'
      : hasPendingActaInQueue
        ? 'Hay un acta en cola para esta mesa. La hoja debe subirse primero.'
        : blockedByBackendRule
          ? 'La hoja no puede subirse porque ya existe un acta en esta mesa.'
          : '';

    const canViewWorksheet =
      isUploaded && !!String(worksheetStatus?.ipfsUri || '').trim();
    const canRetryWorksheet = isFailed && !isWorksheetBlockedByActa;
    const canUploadWorksheet = isNotFound && !isWorksheetBlockedByActa;
    const buttonDisabled =
      isWorksheetActionLoading ||
      isWorksheetLoading ||
      (!canViewWorksheet && !canRetryWorksheet && !canUploadWorksheet);
    const buttonAction = canViewWorksheet
      ? handleViewWorksheet
      : canRetryWorksheet
        ? handleRetryWorksheet
        : handleTakeWorksheetPhoto;
    const buttonText = canViewWorksheet
      ? 'Ver hoja de trabajo'
      : 'Subir hoja de trabajo';
    const showWorksheetCheckingLoader =
      isWorksheetLoading && !isWorksheetActionLoading;
    const showViewWorksheetLoader = canViewWorksheet && isWorksheetActionLoading;
    const showWorksheetLoader = showWorksheetCheckingLoader || showViewWorksheetLoader;
    const worksheetLoaderText = showWorksheetCheckingLoader
      ? 'Espere, revisando hoja...'
      : 'Cargando hoja...';

    return (
      <View style={stylesx.worksheetContainer}>
        <TouchableOpacity
          style={[
            stylesx.worksheetActionButton,
            buttonDisabled
              ? stylesx.worksheetActionButtonDisabled
              : stylesx.worksheetActionButtonEnabled,
          ]}
          onPress={buttonAction}
          disabled={buttonDisabled}>
          {showWorksheetLoader ? (
            <View style={stylesx.worksheetActionContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <CText
                style={[
                  stylesx.worksheetActionText,
                  stylesx.worksheetActionTextWithMargin,
                ]}>
                {worksheetLoaderText}
              </CText>
            </View>
          ) : (
            <CText style={stylesx.worksheetActionText}>{buttonText}</CText>
          )}
        </TouchableOpacity>

        {isWorksheetBlockedByActa && (isNotFound || isFailed) ? (
          <CText style={stylesx.worksheetFeedbackText}>{worksheetBlockedMessage}</CText>
        ) : null}

        {worksheetFeedback ? (
          <CText style={stylesx.worksheetFeedbackText}>{worksheetFeedback}</CText>
        ) : null}
      </View>
    );
  };

  const canSearch =
    mesaNumberInput.trim().length > 0 &&
    !isSearchingMesa;

  return (
    <CSafeAreaView
      testID={hasMesaSelected ? 'tableDetailContainer' : 'tableDetailSearchContainer'}
      style={stylesx.container}
      addTabPadding={false}>
      {/* HEADER */}
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title={
          /*  mesa ? mesa.colegio : I18nStrings.tableInformation*/
          'Revisa'
        }
        showNotification={true}
      />

      <View
        style={[
          stylesx.searchContent,
          hasMesaSelected && stylesx.searchContentEmbedded,
        ]}>
        <View style={stylesx.searchLocationCard}>
          <CText style={stylesx.searchLocationTitle}>
            {locationFromParams?.name || 'Recinto seleccionado'}
          </CText>
        </View>

        <CText style={stylesx.searchInstructionText}>
          Escribe el numero de mesa
        </CText>

        <View style={stylesx.searchInputRow}>
          <TextInput
            value={mesaNumberInput}
            onChangeText={value => {
              setMesaNumberInput(value);
              if (mesaSearchError) setMesaSearchError('');
            }}
            keyboardType="number-pad"
            placeholder="Mesa"
            placeholderTextColor="#9CA3AF"
            style={[stylesx.mesaInput, stylesx.mesaInputInline]}
            testID="tableDetailMesaInput"
            maxLength={4}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (canSearch) handleMesaSearch();
            }}
          />

          <TouchableOpacity
            onPress={handleMesaSearch}
            disabled={!canSearch}
            testID="tableDetailSearchMesaButton"
            style={[
              stylesx.searchButtonInline,
              !canSearch && stylesx.searchButtonDisabled,
            ]}>
            {isSearchingMesa ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <CText style={stylesx.searchButtonText}>Buscar</CText>
            )}
          </TouchableOpacity>
        </View>

        {currentOffline && (
          <CText style={stylesx.searchHintText}>
            Sin internet: se validara en cola cuando vuelva la conexion.
          </CText>
        )}

        {mesaSearchError ? (
          <CText style={stylesx.searchErrorText}>{mesaSearchError}</CText>
        ) : null}
      </View>

      {/* SCROLLABLE CONTENT */}
      {hasMesaSelected && (
        <View
          style={[
            stylesx.scrollableContent,
            shouldCenter && stylesx.centerVertically,
          ]}>
          <View style={stylesx.detailSectionDivider} />
        {/* For tablet landscape, use two-column layout */}
        {isTablet && isLandscape ? (
          <View style={stylesx.tabletLandscapeContainer}>
            {/* Left Column: Instructions and Table Data */}
            <View style={stylesx.leftColumn}>
              <View
                style={[
                  stylesx.instructionContainer,
                  shouldCenter && { marginTop: 0 },
                ]}>
                {/* <CText style={[stylesx.bigBold, { color: 'black' }]}>
                  {I18nStrings.ensureAssignedTable}
                </CText> */}
                {/* <CText
                  style={[
                    stylesx.subtitle,
                    {color: colors.grayScale500 || '#8B9399'},
                  ]}>
                    {I18nStrings.verifyTableInformation}
                </CText> */}
              </View>

              <View style={stylesx.tableCard}>
                <View style={stylesx.tableCardHeader}>
                  <View style={stylesx.tableCardContent}>
                    <CText style={stylesx.tableCardTitle}>
                      Mesa {mesa.numero}
                    </CText>
                    <CText style={stylesx.tableCardDetail}>
                      Código de Mesa: {mesa.codigo}
                    </CText>
                  </View>
                  <MaterialIcons
                    name="how-to-vote"
                    size={getResponsiveSize(40, 48, 56)}
                    color="#000"
                    style={stylesx.downloadIcon}
                  />
                </View>
              </View>
            </View>

            {/* Right Column: AI Info and Photo Button OR Existing Records */}
            <View style={stylesx.rightColumn}>
              {recordsCount > 0 ? (
                <View style={stylesx.existingRecordsContainer}>
                  <CAlert status="success" message={recordsMsg} />

                  {existingRecords.map((record, index) => (
                    <TouchableOpacity
                      key={`${record.recordId}-${index}`}
                      testID={`tableDetailExistingRecord_${index}`}
                      style={stylesx.recordCard}
                      onPress={() => {
                        navigation.navigate(StackNav.PhotoReviewScreen, {
                          mesa: mesa,
                          existingRecord: record,
                          isViewOnly: true,
                          electionId, electionType
                        });
                      }}>
                      <View style={stylesx.recordHeader}>
                        <CText style={stylesx.recordTitle}>
                          Acta #{index + 1}
                        </CText>
                      </View>

                      {record.actaImage && (
                        <View style={stylesx.actaImageContainer}>
                          <Image
                            source={{ uri: record.actaImage }}
                            style={stylesx.actaImage}
                            resizeMode="cover"
                          />
                          <View style={stylesx.imageOverlay}>
                            <Ionicons name="eye" size={20} color="#fff" />
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={stylesx.addNewRecordBtn}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.addNewRecordText}>Atestiguar</CText>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* <View style={stylesx.infoAI}>
                    <Ionicons
                      name="sparkles"
                      size={getResponsiveSize(16, 19, 22)}
                      color={'#226678'}
                      style={stylesx.aiIcon}
                    />
                    <CText style={stylesx.iaText}>
                      {I18nStrings.aiWillSelectClearestPhoto}
                    </CText>
                  </View> */}

                  <TouchableOpacity
                    testID='tableDetailTakePhotoButton'
                    style={stylesx.takePhotoBtn}
                    activeOpacity={0.85}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.takePhotoBtnText}>
                      {I18nStrings.takePhoto}
                    </CText>
                  </TouchableOpacity>
                </>
              )}
              {renderWorksheetSection()}
            </View>
          </View>
        ) : (
          /* Regular Layout: Phones and Tablet Portrait */
          <>
            <View style={stylesx.middleWrap}>
              <View
                style={[
                  stylesx.instructionContainer,
                  shouldCenter && { marginTop: 0 },
                ]}>
                {/* <CText style={[stylesx.bigBold, { color: 'black' }]}>
                  {I18nStrings.ensureAssignedTable}
                </CText> */}
                {/* <CText
                style={[
                  stylesx.subtitle,
                  {color: colors.grayScale500 || '#8B9399'},
                ]}>
                {I18nStrings.verifyTableInformation}
              </CText> */}
              </View>

              <View style={stylesx.tableCard}>
                <View style={stylesx.tableCardHeader}>
                  <MaterialIcons
                    name="how-to-vote"
                    size={getResponsiveSize(40, 48, 56)}
                    color="#000"
                    style={stylesx.downloadIcon}
                  />
                  <View style={stylesx.tableCardContent}>
                    <CText style={stylesx.tableCardTitle}>
                      {I18nStrings.table} {mesa.numero}
                    </CText>
                    <CText style={stylesx.tableCardDetail}>
                      {I18nStrings.tableCode}
                      {':'} {mesa.codigo}
                    </CText>
                    {/* <CText style={stylesx.tableCardDetail}>
                      {I18nStrings.precinct}
                      {':'} {mesa.colegio}
                    </CText> */}
                  </View>
                </View>
              </View>

              {/* Show existing attestations if available */}
              {recordsCount > 0 && (
                <View style={stylesx.existingRecordsContainer}>
                  {/* <CText style={stylesx.existingRecordsSubtitle}>
                  Esta mesa ya tiene actas registradas en el sistema
                </CText> */}

                  <CAlert status="success" message={recordsMsg} />
                  <TouchableOpacity
                    style={stylesx.addNewRecordBtn}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.addNewRecordText}>Atestiguar</CText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Show photo taking section only if no existing records */}
              {(!existingRecords || existingRecords.length === 0) && (
                <>
                  {/* <View style={stylesx.infoAI}>
                    <Ionicons
                      name="sparkles"
                      size={getResponsiveSize(16, 19, 22)}
                      color={'#226678'}
                      style={stylesx.aiIcon}
                    />
                    <CText style={stylesx.iaText}>
                      {I18nStrings.aiWillSelectClearestPhoto}
                    </CText>
                  </View> */}

                  <TouchableOpacity
                    testID='tableDetailTakePhotoButton'
                    style={stylesx.takePhotoBtn}
                    activeOpacity={0.85}
                    onPress={handleTakePhoto}>
                    <CText style={stylesx.takePhotoBtnText}>
                      {I18nStrings.takePhoto}
                    </CText>
                  </TouchableOpacity>
                </>
              )}
              {renderWorksheetSection()}
            </View>
          </>
        )}
      </View>
      )}

      {/* MODAL DE PREVISUALIZACIÓN DE FOTO */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={stylesx.modalContainer}>
          <View style={stylesx.modalHeader}>
            <CText type={'B18'} color={colors.textColor || '#222'}>
              {I18nStrings.preview}
            </CText>
          </View>
          {capturedImage && (
            <View style={stylesx.imageContainer}>
              <Image
                source={{ uri: capturedImage.uri }}
                style={stylesx.previewImage}
                resizeMode="contain"
              />
            </View>
          )}
          <View style={stylesx.modalButtons}>
            <TouchableOpacity
              style={stylesx.retakeButton}
              onPress={handleRetakePhoto}>
              <CText type={'B14'} color={colors.grayScale600 || '#666'}>
                {I18nStrings.retakePhoto}
              </CText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                stylesx.confirmButton,
                { backgroundColor: colors.primary || '#4F9858' },
              ]}
              onPress={handleConfirmPhoto}>
              <CText type={'B14'} color={colors.white || '#fff'}>
                {I18nStrings.confirmAndSend}
              </CText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CSafeAreaView>
  );
}

// ESTILOS RESPONSIVOS
const stylesx = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  middleWrap: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: getResponsiveSize(12, 16, 20),
  },
  scrollableContent: {
    flex: 1,
    paddingBottom: getResponsiveSize(15, 25, 30),
  },
  detailSectionDivider: {
    height: 1,
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(2, 4, 6),
    marginBottom: getResponsiveSize(8, 12, 16),
    backgroundColor: '#E5E7EB',
  },
  // Tablet Landscape Layout
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(20, 24, 32),
    paddingVertical: getResponsiveSize(20, 24, 32),
  },
  leftColumn: {
    flex: 0.6,
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  rightColumn: {
    flex: 0.4,
    paddingLeft: getResponsiveSize(16, 20, 24),
    justifyContent: 'flex-start',
  },
  instructionContainer: {
    marginTop: getResponsiveSize(15, 25, 35),
    marginBottom: 0,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  bigBold: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: 'bold',
    marginBottom: getResponsiveSize(6, 8, 10),
    color: '#222',
    textAlign: 'center',
    lineHeight: getResponsiveSize(24, 26, 30),
  },
  subtitle: {
    fontSize: getResponsiveSize(14, 15, 18),
    color: '#8B9399',
    marginTop: getResponsiveSize(6, 10, 12),
    lineHeight: getResponsiveSize(18, 20, 24),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(10, 12, 14),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(18, 20, 25),
    padding: getResponsiveSize(16, 18, 22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: getResponsiveSize(18, 20, 25),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTextContainer: {
    flex: 1,
    marginRight: getResponsiveSize(12, 16, 20),
  },
  cardIcon: {
    marginTop: getResponsiveSize(8, 12, 15),
    alignSelf: 'flex-start',
  },
  mesaTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  label: {
    fontSize: getResponsiveSize(13, 14, 16),
    color: '#222',
    marginBottom: getResponsiveSize(2, 3, 4),
    lineHeight: getResponsiveSize(16, 18, 22),
  },
  infoAI: {
    backgroundColor: '#DDF4FA',
    borderRadius: getResponsiveSize(8, 10, 12),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 16),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(15, 20, 25),
  },
  aiIcon: {
    marginRight: getResponsiveSize(6, 8, 10),
  },
  iaText: {
    fontSize: getResponsiveSize(13, 14, 17),
    color: '#226678',
    fontWeight: '500',
    flex: 1,
    lineHeight: getResponsiveSize(18, 20, 24),
  },
  takePhotoBtn: {
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(4, 8, 12),
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(10, 12, 14),
    justifyContent: 'center',
    alignItems: 'center',
    height: getResponsiveSize(48, 52, 58),
    marginBottom: getResponsiveSize(10, 15, 20),
  },
  takePhotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getResponsiveSize(16, 17, 19),
    letterSpacing: 0.2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: getResponsiveSize(20, 25, 30),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  imageContainer: {
    flex: 1,
    padding: getResponsiveSize(20, 25, 30),
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: getResponsiveSize(20, 25, 30),
    gap: getResponsiveSize(12, 16, 20),
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
    padding: getResponsiveSize(14, 16, 20),
  },
  confirmButton: {
    flex: 1,
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
    padding: getResponsiveSize(14, 16, 20),
  },
  // Table card styles - identical to SearchTableComponents
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    padding: getResponsiveSize(12, 16, 18),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(14, 16, 20),
    marginBottom: getResponsiveSize(8, 12, 14),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  tableCardContent: {
    flex: 1,
    paddingRight: getResponsiveSize(12, 16, 20),
  },
  tableCardTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: '700',
    color: '#000',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  tableCardDetail: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#868686',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  tableCardZone: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '500',
    color: '#000',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  downloadIcon: {
    alignSelf: 'center',
  },
  // Existing records styles
  existingRecordsContainer: {
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(15, 20, 25),
    marginBottom: getResponsiveSize(15, 20, 25),
  },
  existingRecordsTitle: {
    fontSize: getResponsiveSize(18, 20, 22),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  existingRecordsSubtitle: {
    fontSize: getResponsiveSize(14, 15, 16),
    color: '#666',
    marginBottom: getResponsiveSize(12, 16, 20),
    lineHeight: getResponsiveSize(18, 20, 22),
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: getResponsiveSize(12, 16, 18),
    marginBottom: getResponsiveSize(12, 15, 18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  recordTitle: {
    fontSize: getResponsiveSize(16, 17, 18),
    fontWeight: '600',
    color: '#222',
  },
  recordId: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#666',
    fontFamily: 'monospace',
  },
  actaImageContainer: {
    position: 'relative',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  actaImage: {
    width: '100%',
    height: getResponsiveSize(120, 140, 160),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: '#F5F5F5',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: getResponsiveSize(6, 8, 10),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  viewImageText: {
    color: '#fff',
    fontSize: getResponsiveSize(14, 15, 16),
    fontWeight: '500',
    marginLeft: getResponsiveSize(4, 6, 8),
  },
  recordSummary: {
    paddingTop: getResponsiveSize(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  recordSummaryText: {
    fontSize: getResponsiveSize(13, 14, 15),
    color: '#666',
    fontStyle: 'italic',
  },
  addNewRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 16, 18),
    marginTop: getResponsiveSize(8, 10, 12),
  },
  addIcon: {
    marginRight: getResponsiveSize(6, 8, 10),
  },
  addNewRecordText: {
    fontSize: getResponsiveSize(15, 16, 17),
    fontWeight: '600',
    color: '#fff',
  },
  searchContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(20, 24, 28),
  },
  searchContentEmbedded: {
    flex: 0,
    paddingBottom: getResponsiveSize(10, 12, 14),
  },
  searchLocationCard: {
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  searchLocationTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '600',
    color: '#111827',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  searchLocationText: {
    fontSize: getResponsiveSize(12, 13, 15),
    color: '#4B5563',
  },
  searchInstructionText: {
    fontSize: getResponsiveSize(12, 13, 15),
    color: '#374151',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mesaInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 14, 18),
    paddingVertical: getResponsiveSize(10, 12, 14),
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#111827',
    backgroundColor: '#fff',
  },
  mesaInputInline: {
    flex: 1,
    marginRight: getResponsiveSize(8, 10, 12),
  },
  searchButtonInline: {
    backgroundColor: '#4F9858',
    borderRadius: getResponsiveSize(10, 12, 14),
    alignItems: 'center',
    justifyContent: 'center',
    height: getResponsiveSize(48, 52, 58),
    minWidth: getResponsiveSize(92, 104, 116),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
  },
  searchButtonDisabled: {
    opacity: 0.55,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: getResponsiveSize(15, 16, 18),
    fontWeight: '700',
  },
  searchErrorText: {
    marginTop: getResponsiveSize(8, 10, 12),
    color: '#B42318',
    fontSize: getResponsiveSize(13, 14, 16),
  },
  searchHintText: {
    marginTop: getResponsiveSize(8, 10, 12),
    color: '#475467',
    fontSize: getResponsiveSize(12, 13, 15),
    lineHeight: getResponsiveSize(17, 18, 21),
  },
  worksheetContainer: {
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(10, 12, 16),
    marginBottom: getResponsiveSize(10, 12, 16),
  },
  worksheetTitle: {
    fontSize: getResponsiveSize(15, 16, 18),
    fontWeight: '700',
    color: '#111827',
  },
  worksheetDescription: {
    marginTop: getResponsiveSize(6, 8, 10),
    fontSize: getResponsiveSize(12, 13, 14),
    lineHeight: getResponsiveSize(16, 18, 20),
    color: '#4B5563',
  },
  worksheetBadge: {
    marginTop: getResponsiveSize(10, 12, 14),
    borderRadius: 999,
    paddingVertical: getResponsiveSize(6, 7, 8),
    paddingHorizontal: getResponsiveSize(10, 12, 14),
    alignSelf: 'flex-start',
  },
  worksheetBadgeNeutral: {
    backgroundColor: '#F3F4F6',
  },
  worksheetBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  worksheetBadgeError: {
    backgroundColor: '#FEE2E2',
  },
  worksheetBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  worksheetBadgeText: {
    fontSize: getResponsiveSize(11, 12, 13),
    fontWeight: '600',
    color: '#374151',
  },
  worksheetLoader: {
    marginTop: getResponsiveSize(10, 12, 14),
    alignSelf: 'flex-start',
  },
  worksheetActionButton: {
    marginTop: getResponsiveSize(2, 4, 6),
    borderRadius: getResponsiveSize(10, 12, 14),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(52, 56, 62),
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(10, 12, 14),
  },
  worksheetActionButtonEnabled: {
    backgroundColor: '#14532D',
    borderWidth: 1,
    borderColor: '#0B3B1E',
  },
  worksheetActionButtonDisabled: {
    backgroundColor: '#98A2B3',
  },
  worksheetRetryButton: {
    backgroundColor: '#B42318',
  },
  worksheetActionText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(14, 15, 17),
    fontWeight: '700',
    textAlign: 'center',
  },
  worksheetActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  worksheetActionTextWithMargin: {
    marginLeft: getResponsiveSize(8, 10, 12),
  },
  worksheetFeedbackText: {
    marginTop: getResponsiveSize(8, 10, 12),
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#475467',
  },
  centerVertically: {
    justifyContent: 'flex-start',
    paddingTop: getResponsiveSize(10, 14, 18),
  },
});

