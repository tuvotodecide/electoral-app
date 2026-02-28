import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import BaseRecordReviewScreen from '../../../components/common/BaseRecordReviewScreen';
import {moderateScale} from '../../../common/constants';
import Strings from '../../../i18n/String';
import {validateBallotLocally} from '../../../utils/ballotValidation';
import InfoModal from '../../../components/modal/InfoModal';
import {StackNav, TabNav} from '../../../navigation/NavigationKey';
import {normalizeUri} from '../../../utils/normalizedUri';
import CText from '../../../components/common/CText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {BACKEND_RESULT} from '@env';
import {authenticateWithBackend} from '../../../utils/offlineQueueHandler';
import {getCredentialSubjectFromPayload} from '../../../utils/Cifrate';
import {enqueue, getAll as getOfflineQueue} from '../../../utils/offlineQueue';
import {persistLocalImage} from '../../../utils/persistLocalImage';
import {
  WorksheetStatus,
  upsertWorksheetLocalStatus,
} from '../../../utils/worksheetLocalStatus';

const normalizeComparableObservation = text =>
  String(text ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

const isObservationFromText = text => {
  const normalized = normalizeComparableObservation(text);
  if (!normalized) return false;
  return normalized !== 'correyvale';
};

const WorksheetCompareStatus = Object.freeze({
  MATCH: 'MATCH',
  MISMATCH: 'MISMATCH',
  NOT_FOUND: 'NOT_FOUND',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  SKIPPED_OFFLINE: 'SKIPPED_OFFLINE',
  ERROR: 'ERROR',
});

const normalizeCompareToken = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const resolvePartyIdForCompare = party => {
  const candidates = [
    party?.partido,
    party?.name,
    party?.sigla,
    party?.party,
    party?.partyId,
    party?.id,
  ];
  let fallback = '';
  for (const candidate of candidates) {
    const normalized = normalizeCompareToken(candidate);
    if (!normalized) continue;
    if (!fallback) fallback = normalized;
    if (normalized.includes('libre')) return 'libre';
    if (
      normalized === 'pdc' ||
      normalized.includes('partidodemocratacristiano') ||
      normalized.includes('democratacristiano') ||
      normalized.includes('democratacristiana')
    ) {
      return 'pdc';
    }
    if (!/^\d+$/.test(normalized)) return normalized;
  }
  return fallback;
};

const formatWorksheetDiffFieldLabel = rawField => {
  const field = String(rawField || '').trim();
  if (!field) return 'Campo';
  const normalized = normalizeCompareToken(field);
  if (normalized === 'partiesvalidvotes') return 'Votos Válidos';
  if (normalized === 'partiestotalvotes') return 'Votos Totales';
  if (normalized === 'partiesblankvotes') return 'Votos en Blanco';
  if (normalized === 'partiesnullvotes') return 'Votos Nulos';
  if (normalized.startsWith('partiespartyvotes')) {
    const partyRaw = field.split('.').pop() || '';
    const partyId = resolvePartyIdForCompare({
      partyId: partyRaw,
      partido: partyRaw,
      name: partyRaw,
      id: partyRaw,
    });
    return `Votos de ${String(partyId || partyRaw || 'partido').toUpperCase()}`;
  }
  return field;
};

const formatWorksheetDiffsForModal = differences => {
  const list = Array.isArray(differences) ? differences.slice(0, 5) : [];
  return list
    .map(diff => {
      const label = formatWorksheetDiffFieldLabel(diff?.field);
      const worksheetValue =
        diff?.worksheetValue === null || diff?.worksheetValue === undefined
          ? 'sin dato'
          : String(diff.worksheetValue);
      const ballotValue =
        diff?.ballotValue === null || diff?.ballotValue === undefined
          ? 'sin dato'
          : String(diff.ballotValue);
      return `${label}: hoja **${worksheetValue}**, acta **${ballotValue}**`;
    })
    .join('\n');
};

const buildWorksheetCompareVotesPayload = (
  normalizedPartyResults,
  normalizedVoteSummaryResults,
) => {
  const norm = s => normalizeCompareToken(s);
  const aliases = {
    validos: ['validos', 'votosvalidos', 'validvotes'],
    nulos: ['nulos', 'votosnulos', 'nullvotes'],
    blancos: ['blancos', 'votosenblanco', 'votosblancos', 'blankvotes'],
  };
  const pickRow = key =>
    (normalizedVoteSummaryResults || []).find(
      r => norm(r?.id) === norm(key) || aliases[key]?.includes(norm(r?.label)),
    );
  const toNumber = raw => {
    const n = parseInt(String(raw ?? '0'), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const validVotes = toNumber(pickRow('validos')?.value1);
  const nullVotes = toNumber(pickRow('nulos')?.value1);
  const blankVotes = toNumber(pickRow('blancos')?.value1);
  const partyVotesMap = (normalizedPartyResults || []).reduce((acc, party) => {
    const partyId = resolvePartyIdForCompare(party);
    if (!partyId) return acc;
    acc[partyId] = (acc[partyId] || 0) + toNumber(party?.presidente);
    return acc;
  }, {});
  return {
    parties: {
      validVotes,
      nullVotes,
      blankVotes,
      partyVotes: Object.keys(partyVotesMap).map(partyId => ({
        partyId,
        votes: partyVotesMap[partyId],
      })),
      totalVotes: validVotes + nullVotes + blankVotes,
    },
  };
};

const PhotoReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);
  const {
    photoUri,
    tableData,
    mesaData,
    aiAnalysis,
    mappedData,
    offline,
    existingRecord,
    isViewOnly,

    fromWhichIsCorrect,
    mode: incomingMode,
    actaCount,
    electionId,
    electionType,
  } = route.params || {};
  const mode =
    incomingMode ?? (isViewOnly && existingRecord ? 'attest' : 'upload');
  const isWorksheetMode = mode === 'worksheet';
  const initialObservationText = String(
    route.params?.observationText ??
      mappedData?.observationText ??
      aiAnalysis?.observations?.text ??
      existingRecord?.observationText ??
      '',
  ).trim();
  const initialObservationByText = isObservationFromText(initialObservationText);
  const initialHasObservation =
    typeof route.params?.hasObservation === 'boolean'
      ? route.params.hasObservation
      : typeof mappedData?.isObserved === 'boolean'
      ? mappedData.isObserved
      : typeof aiAnalysis?.observations?.is_observed === 'boolean'
      ? aiAnalysis.observations.is_observed
      : typeof existingRecord?.hasObservation === 'boolean'
      ? existingRecord.hasObservation
      : initialObservationByText;
  const effectivePhotoUri = useMemo(() => {
    const fromRecord =
      existingRecord?.actaImage ||
      existingRecord?.image ||
      existingRecord?.photo ||
      existingRecord?.imageUrl;
    return normalizeUri(photoUri || fromRecord);
  }, [photoUri, existingRecord]);
  // State for editable fields
  const isEditing = !isViewOnly;
  const [infoModalData, setInfoModalData] = useState({
    visible: false,
    title: '',
    message: '',
    buttonText: 'OK',
  });
  const [shouldGoHomeAfterInfoModal, setShouldGoHomeAfterInfoModal] =
    useState(false);
  const [pendingConfirmationParams, setPendingConfirmationParams] =
    useState(null);
  const [showWorksheetConfirmModal, setShowWorksheetConfirmModal] =
    useState(false);
  const [isWorksheetSubmitting, setIsWorksheetSubmitting] = useState(false);
  const [worksheetQueuePayload, setWorksheetQueuePayload] = useState(null);
  const closeInfoModal = () => {
    const pendingParams = pendingConfirmationParams;
    setInfoModalData({
      visible: false,
      title: '',
      message: '',
      buttonText: 'OK',
    });
    if (pendingParams) {
      setPendingConfirmationParams(null);
      navigation.navigate('PhotoConfirmationScreen', pendingParams);
      return;
    }
    if (shouldGoHomeAfterInfoModal) {
      setShouldGoHomeAfterInfoModal(false);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: StackNav.TabNavigation,
            params: {screen: TabNav.HomeScreen},
          },
        ],
      });
    }
  };

  // Datos iniciales - usar datos de IA si están disponibles, sino usar valores por defecto
  const getInitialPartyResults = () => {
    if (existingRecord?.partyResults) {
      return existingRecord.partyResults;
    }
    if (mappedData?.partyResults) {
      return mappedData.partyResults;
    }
    const seed = offline ? '' : '0';

    return [
      {id: 'pdc', partido: 'PDC', presidente: seed, diputado: seed},
      {id: 'libre', partido: 'LIBRE', presidente: seed, diputado: seed},
    ];
  };

  const getInitialVoteSummary = () => {
    const seed = offline ? '' : '0';
    const toArray = src => [
      {
        id: 'validos',
        label: Strings.validVotes,
        value1: String(src.presValidVotes ?? src.validVotes ?? seed),
        value2: '0',
      },
      {
        id: 'blancos',
        label: Strings.blankVotes,
        value1: String(src.presBlankVotes ?? src.blankVotes ?? seed),
        value2: '0',
      },
      {
        id: 'nulos',
        label: Strings.nullVotes,
        value1: String(src.presNullVotes ?? src.nullVotes ?? seed),
        value2: '0',
      },
    ];

    const fromExisting = existingRecord?.voteSummaryResults;
    if (Array.isArray(fromExisting)) return fromExisting;
    if (fromExisting && typeof fromExisting === 'object')
      return toArray(fromExisting);

    const fromMapped = mappedData?.voteSummaryResults;
    if (Array.isArray(fromMapped)) return fromMapped;
    if (fromMapped && typeof fromMapped === 'object')
      return toArray(fromMapped);

    return [
      {id: 'validos', label: Strings.validVotes, value1: seed, value2: '0'},
      {id: 'blancos', label: Strings.blankVotes, value1: seed, value2: '0'},
      {id: 'nulos', label: Strings.nullVotes, value1: seed, value2: '0'},
    ];
  };
  // State for the party results table
  const [partyResults, setPartyResults] = useState(getInitialPartyResults());

  // State for the vote summary table (Votos, Blancos, Nulos)
  const [voteSummaryResults, setVoteSummaryResults] = useState(
    getInitialVoteSummary(),
  );
  const [hasObservation, setHasObservation] = useState(initialHasObservation);
  const [observationText, setObservationText] = useState(initialObservationText);
  const [isComparingWorksheet, setIsComparingWorksheet] = useState(false);

  // Mostrar información de la mesa analizadas
  const getMesaInfo = () => {
    if (aiAnalysis) {
      return {
        number: aiAnalysis.table_number,
        code: aiAnalysis.table_code,
        time: aiAnalysis.time,
        ...tableData,
      };
    }
    return tableData;
  };

  const openWorksheetConfirmModal = ({
    mesaInfo,
    normalizedPartyResults,
    normalizedVoteSummaryResults,
  }) => {
    setWorksheetQueuePayload({
      mesaInfo,
      partyResults: normalizedPartyResults,
      voteSummaryResults: normalizedVoteSummaryResults.map(
        ({id, label, value1}) => ({
          id,
          label,
          value1,
        }),
      ),
      photoUri: effectivePhotoUri,
    });
    setShowWorksheetConfirmModal(true);
  };

  const confirmWorksheetQueue = async () => {
    if (isWorksheetSubmitting) return;
    const payload = worksheetQueuePayload;
    if (!payload) {
      setShowWorksheetConfirmModal(false);
      setInfoModalData({
        visible: true,
        title: 'Error',
        message: 'No se encontró la información de la hoja para encolar.',
      });
      return;
    }

    setIsWorksheetSubmitting(true);
    try {
      const local = validateBallotLocally(
        payload.partyResults || [],
        payload.voteSummaryResults || [],
      );
      if (!local.ok) {
        setInfoModalData({
          visible: true,
          title: 'Datos inconsistentes',
          message: local.errors.join('\n'),
        });
        setShowWorksheetConfirmModal(false);
        return;
      }

      if (!payload.photoUri) {
        setInfoModalData({
          visible: true,
          title: 'Error',
          message: 'No se encontró la foto de la hoja de trabajo.',
        });
        setShowWorksheetConfirmModal(false);
        return;
      }

      const subject = getCredentialSubjectFromPayload(userData) || {};
      const dniValue = String(
        subject?.nationalIdNumber ??
          subject?.documentNumber ??
          subject?.governmentIdentifier ??
          userData?.dni ??
          '',
      ).trim();
      const electionIdValue = String(electionId || '').trim();
      const mesaInfo = payload.mesaInfo || getMesaInfo() || {};
      const tableCode = String(
        mesaInfo?.tableCode || mesaInfo?.codigo || mesaInfo?.code || '',
      ).trim();
      const tableNumber = String(
        mesaInfo?.tableNumber ||
          mesaInfo?.numero ||
          mesaInfo?.number ||
          mesaInfo?.table ||
          '',
      ).trim();
      const locationId = String(
        route.params?.locationId ||
          mesaInfo?.location?._id ||
          mesaInfo?.idRecinto ||
          mesaInfo?.locationId ||
          tableData?.location?._id ||
          tableData?.idRecinto ||
          tableData?.locationId ||
          '',
      ).trim();

      const worksheetIdentity = {
        dni: dniValue,
        electionId: electionIdValue,
        tableCode,
      };

      if (!dniValue || !electionIdValue || !tableCode || !tableNumber) {
        setInfoModalData({
          visible: true,
          title: 'Error',
          message:
            'Faltan datos obligatorios de mesa o usuario para encolar la hoja.',
        });
        setShowWorksheetConfirmModal(false);
        return;
      }

      const queuedItems = await getOfflineQueue();
      const alreadyQueued = (queuedItems || []).some(item => {
        if (item?.task?.type !== 'publishWorksheet') return false;
        const queuedPayload = item?.task?.payload || {};
        const payloadDni = String(
          queuedPayload?.additionalData?.dni || queuedPayload?.dni || '',
        ).trim();
        const payloadElectionId = String(
          queuedPayload?.additionalData?.electionId ||
            queuedPayload?.electionId ||
            '',
        ).trim();
        const payloadTableCode = String(
          queuedPayload?.additionalData?.tableCode ||
            queuedPayload?.tableCode ||
            queuedPayload?.tableData?.codigo ||
            queuedPayload?.tableData?.tableCode ||
            '',
        )
          .trim()
          .toLowerCase();

        return (
          payloadDni === worksheetIdentity.dni &&
          payloadElectionId === worksheetIdentity.electionId &&
          payloadTableCode === worksheetIdentity.tableCode.toLowerCase()
        );
      });

      if (alreadyQueued) {
        await upsertWorksheetLocalStatus(worksheetIdentity, {
          status: WorksheetStatus.PENDING,
          errorMessage: undefined,
        });
        setShowWorksheetConfirmModal(false);
        setShouldGoHomeAfterInfoModal(true);
        setInfoModalData({
          visible: true,
          title: 'Hoja de trabajo',
          message: 'La hoja ya estaba en cola. Se subirá en segundo plano.',
          buttonText: 'Ir al Inicio',
        });
        return;
      }

      const persistedUri = await persistLocalImage(payload.photoUri);
      const worksheetTaskPayload = {
        imageUri: persistedUri,
        aiAnalysis: aiAnalysis || {},
        electoralData: {
          partyResults: payload.partyResults || [],
          voteSummaryResults: payload.voteSummaryResults || [],
        },
        additionalData: {
          idRecinto: locationId,
          locationId,
          tableNumber,
          tableCode,
          location: mesaInfo?.location || tableData?.location || 'Bolivia',
          userId: userData?.id || 'unknown',
          userName: String(subject?.fullName || '').trim() || 'Usuario',
          role: 'worksheet',
          dni: worksheetIdentity.dni,
          electionId: worksheetIdentity.electionId,
        },
        tableData: {
          codigo: tableCode,
          idRecinto: locationId,
          tableNumber,
          numero: tableNumber,
        },
        tableCode,
        tableNumber,
        locationId,
        createdAt: Date.now(),
        electionId: electionIdValue,
        electionType: route.params?.electionType || undefined,
        mode: 'worksheet',
      };

      await enqueue({
        type: 'publishWorksheet',
        payload: worksheetTaskPayload,
      });

      await upsertWorksheetLocalStatus(worksheetIdentity, {
        status: WorksheetStatus.PENDING,
        errorMessage: undefined,
        retryPayload: worksheetTaskPayload,
      });

      setShowWorksheetConfirmModal(false);
      setShouldGoHomeAfterInfoModal(true);
      setInfoModalData({
        visible: true,
        title: 'Hoja de trabajo',
        message: 'Hoja guardada. Se subirá en segundo plano.',
        buttonText: 'Ir al Inicio',
      });
    } catch (error) {
      setShowWorksheetConfirmModal(false);
      setInfoModalData({
        visible: true,
        title: 'Error',
        message: error?.message || 'No se pudo encolar la hoja de trabajo.',
      });
    } finally {
      setIsWorksheetSubmitting(false);
    }
  };

  // // Handler for editing votes
  // const handleEdit = () => {
  //   setIsEditing(true);
  // };

  // // Handler for saving changes
  // const handleSave = () => {
  //   setIsEditing(false);
  //   setInfoModalData({
  //     visible: true,
  //     title: Strings.saved,
  //     message: Strings.changesSavedSuccessfully,
  //   });
  // };

  // Handler for navigating to the next screen
  const handleNext = async () => {
    if (isComparingWorksheet) return;
    const mesaInfo = getMesaInfo();

    // 1) Asegurarnos de trabajar con arrays
    const partiesArray = Array.isArray(partyResults) ? partyResults : [];
    const summaryArray = Array.isArray(voteSummaryResults)
      ? voteSummaryResults
      : [];

    // 2) Validar que no haya campos vacíos antes de normalizar
    if (!isViewOnly) {
      const hasEmptyParty = partiesArray.some(p => (p.presidente ?? '') === '');
      const hasEmptySummary = summaryArray.some(v => (v.value1 ?? '') === '');

      if (hasEmptyParty || hasEmptySummary) {
        setInfoModalData({
          visible: true,
          title: 'Campos incompletos',
          message:
            'Completa todos los campos de votos de los partidos y del resumen antes de continuar.',
        });
        return; // NO avanzar
      }
    }

    const normalizedObservationText = String(observationText ?? '').trim();
    if (!isViewOnly && hasObservation && !normalizedObservationText) {
      setInfoModalData({
        visible: true,
        title: 'Observacion requerida',
        message:
          'Si marcas "Acta con observacion", debes escribir el texto de la observacion.',
      });
      return;
    }

    const normalizedPartyResults = partyResults.map(p => ({
      ...p,
      presidente: p.presidente === '' ? '0' : p.presidente,
    }));
    const cleanedPartyResults = normalizedPartyResults.map(p => ({
      id:
        p.id ??
        p.partyId ??
        (p.partido ? String(p.partido).trim().toLowerCase() : undefined),
      partido: p.partido ?? p.party ?? p.name ?? p.sigla ?? p.partyId ?? p.id,
      presidente: p.presidente,
    }));
    const normalizedVoteSummaryResults = voteSummaryResults.map(v => ({
      ...v,
      value1: v.value1 === '' ? '0' : v.value1,
    }));

    if (!isViewOnly) {
      const check = validateBallotLocally(
        normalizedPartyResults,
        normalizedVoteSummaryResults,
      );
      if (!check.ok) {
        setInfoModalData({
          visible: true,
          title: 'Datos inconsistentes',
          message: check.errors.join('\n'),
        });
        return; // NO avanzar
      }
    }

    if (isWorksheetMode) {
      openWorksheetConfirmModal({
        mesaInfo,
        normalizedPartyResults,
        normalizedVoteSummaryResults,
      });
      return;
    }

    let compareResult = null;
    if (!isWorksheetMode && !isViewOnly) {
      const subject = getCredentialSubjectFromPayload(userData) || {};
      const dniValue = String(
        subject?.nationalIdNumber ??
          subject?.documentNumber ??
          subject?.governmentIdentifier ??
          userData?.dni ??
          '',
      ).trim();
      const tableCode = String(
        mesaInfo?.tableCode || mesaInfo?.codigo || mesaInfo?.code || '',
      ).trim();
      const electionIdValue = String(electionId || '').trim();

      const buildResult = (status, message, extras = {}) => ({
        status,
        worksheetStatus: extras.worksheetStatus || null,
        differences: Array.isArray(extras.differences) ? extras.differences : [],
        message,
      });

      if (!dniValue || !tableCode || !electionIdValue) {
        compareResult = buildResult(
          WorksheetCompareStatus.NOT_FOUND,
          'No existe hoja de trabajo previa para esta mesa.',
        );
      } else {
        setIsComparingWorksheet(true);
        try {
          const net = await NetInfo.fetch();
          const isOnline =
            !!net?.isConnected && net?.isInternetReachable !== false;
          if (!isOnline) {
            compareResult = buildResult(
              WorksheetCompareStatus.SKIPPED_OFFLINE,
              'Sin conexión. No se pudo comparar con la hoja de trabajo.',
            );
          } else {
            const apiKey = await authenticateWithBackend(
              userData.did,
              userData.privKey,
            );
            const {data} = await axios.post(
              `${BACKEND_RESULT}/api/v1/worksheets/compare`,
              {
                dni: dniValue,
                electionId: electionIdValue,
                tableCode,
                votes: buildWorksheetCompareVotesPayload(
                  cleanedPartyResults,
                  normalizedVoteSummaryResults,
                ),
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                },
                timeout: 8000,
              },
            );

            const status = data?.status || WorksheetCompareStatus.NOT_FOUND;
            if (status === WorksheetCompareStatus.MATCH) {
              compareResult = buildResult(
                status,
                'Coincide con hoja de trabajo.',
                data,
              );
            } else if (status === WorksheetCompareStatus.MISMATCH) {
              compareResult = buildResult(
                status,
                'No coincide con hoja de trabajo.',
                data,
              );
            } else if (status === WorksheetCompareStatus.NOT_AVAILABLE) {
              compareResult = buildResult(
                status,
                `Hoja no disponible para comparar (${
                  data?.worksheetStatus || 'SIN_ESTADO'
                }).`,
                data,
              );
            } else {
              compareResult = buildResult(
                WorksheetCompareStatus.NOT_FOUND,
                'No existe hoja de trabajo previa para esta mesa.',
                data,
              );
            }
          }
        } catch {
          compareResult = buildResult(
            WorksheetCompareStatus.ERROR,
            'No se pudo comparar con hoja de trabajo por timeout o error de red.',
          );
        } finally {
          setIsComparingWorksheet(false);
        }
      }
    }

    const confirmationParams = {
      photoUri: effectivePhotoUri,
      tableData: mesaInfo,
      mesaData: mesaInfo,
      partyResults: cleanedPartyResults,
      voteSummaryResults: normalizedVoteSummaryResults.map(
        ({id, label, value1}) => ({
          id,
          label,
          value1,
        }),
      ),
      aiAnalysis,
      offline,
      existingRecord,
      mode,
      electionId,
      hasObservation,
      observationText: hasObservation ? normalizedObservationText : '',
      compareResult,
    };
    console.log('[ATTEST-FLOW][PhotoReview->PhotoConfirmation]', {
      mode: confirmationParams.mode,
      electionId: confirmationParams.electionId || null,
      tableCode:
        mesaInfo?.tableCode || mesaInfo?.codigo || tableData?.tableCode || null,
      existingRecordId:
        confirmationParams?.existingRecord?.recordId ||
        confirmationParams?.existingRecord?.rawData?.recordId ||
        confirmationParams?.existingRecord?.raw?.recordId ||
        null,
    });

    if (
      !isWorksheetMode &&
      !isViewOnly &&
      compareResult?.status === WorksheetCompareStatus.MISMATCH
    ) {
      const diffMessage = formatWorksheetDiffsForModal(compareResult?.differences);

      setPendingConfirmationParams({
        ...confirmationParams,
        shownCompareWarning: true,
      });
      setInfoModalData({
        visible: true,
        title: 'Hoja de trabajo no coincide',
        message: diffMessage
          ? `Se detectaron diferencias con la hoja de trabajo:\n${diffMessage}`
          : 'Se detectaron diferencias con la hoja de trabajo.',
        buttonText: 'Continuar',
        secondaryButtonText: 'Corregir',
        onSecondaryPress: () => {
          setPendingConfirmationParams(null);
          setInfoModalData({
            visible: false,
            title: '',
            message: '',
            buttonText: 'OK',
          });
        },
      });
      return;
    }

    navigation.navigate('PhotoConfirmationScreen', confirmationParams);
  };

  // Handler for going back
  const handleBack = () => {
    navigation.goBack();
  };

  // Function to update party results
  const updatePartyResult = (partyId, field, value) => {
    setPartyResults(prev =>
      prev.map(party =>
        party.id === partyId ? {...party, [field]: value} : party,
      ),
    );
  };

  // Function to update vote summary results
  const updateVoteSummaryResult = (id, field, value) => {
    setVoteSummaryResults(prev =>
      prev.map(item => (item.id === id ? {...item, [field]: value} : item)),
    );
  };

  // Action buttons for PhotoReviewScreen
  const goToCamera = () => {
    const mesaInfo = getMesaInfo();
    const resolvedElectionId = String(
      electionId ||
        mesaInfo?.electionId ||
        mesaInfo?.election_id ||
        tableData?.electionId ||
        tableData?.election_id ||
        '',
    ).trim();
    navigation.navigate(StackNav.CameraScreen, {
      tableData: mesaInfo,
      mesaData: mesaInfo,
      mesa: mesaInfo,
      electionId: resolvedElectionId || undefined,
      electionType: electionType || route.params?.electionType || undefined,
    });
  };

  const actionButtons = isViewOnly
    ? isWorksheetMode
      ? [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
            style: {backgroundColor: colors.primary},
            textStyle: {color: '#fff'},
          },
        ]
      : [
          {
            text: 'Están correctos',
            onPress: handleNext,
            style: {backgroundColor: colors.primary},
            textStyle: {color: '#fff'},
          },
          {
            text:
              fromWhichIsCorrect && (actaCount ?? 0) > 1
                ? 'Regresar'
                : 'Subir acta',
            onPress:
              fromWhichIsCorrect && (actaCount ?? 0) > 1
                ? () => navigation.goBack()
                : goToCamera,
            style: {backgroundColor: '#DC2626'}, // rojo
            textStyle: {color: '#fff'},
          },
        ]
    : [
        {
          text: isComparingWorksheet ? 'Comparando...' : Strings.next,
          onPress: handleNext,
          style: {
            backgroundColor: colors.primary,
            opacity: isComparingWorksheet ? 0.75 : 1,
          },
          textStyle: {
            color: '#fff',
          },
        },
      ];

  const observationSection = isViewOnly || isWorksheetMode ? null : (
    <View style={styles.observationContainer}>
      <CText style={styles.observationQuestionLabel}>¿Está el acta observada?</CText>
      <View style={styles.observationSwitchRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setHasObservation(false)}
          style={[
            styles.observationChoicePill,
            !hasObservation && {
              borderColor: colors.primary || '#459151',
              backgroundColor: '#EAF6EC',
            },
          ]}>
          <CText
            style={[
              styles.observationChoiceText,
              !hasObservation && {color: colors.primary || '#459151'},
            ]}>
            No
          </CText>
        </TouchableOpacity>
        {/* <Switch
          value={hasObservation}
          onValueChange={setHasObservation}
          trackColor={{false: '#D6D6D6', true: '#A5D6A7'}}
          thumbColor={hasObservation ? '#4CAF50' : '#f4f3f4'}
          style={styles.observationSwitch}
        /> */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setHasObservation(true)}
          style={[
            styles.observationChoicePill,
            hasObservation && {
              borderColor: colors.primary || '#459151',
              backgroundColor: '#EAF6EC',
            },
          ]}>
          <CText
            style={[
              styles.observationChoiceText,
              hasObservation && {color: colors.primary || '#459151'},
            ]}>
            Sí
          </CText>
        </TouchableOpacity>
      </View>

      {hasObservation ? (
        <TextInput
          value={observationText}
          onChangeText={setObservationText}
          placeholder="Escribe la observacion del acta"
          placeholderTextColor="#8A8A8A"
          multiline
          style={[
            styles.observationInput,
            {borderColor: colors.primary || '#459151'},
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <>
      <BaseRecordReviewScreen
        colors={colors}
        headerTitle={`${Strings.table} ${tableData?.numero || tableData?.tableNumber || tableData?.number || 'N/A'
          }`}
        instructionsText={
          isWorksheetMode
            ? 'Ingresa los resultados de tu hoja de trabajo.'
            : offline
            ? 'Completa los datos por favor'
            : aiAnalysis
            ? 'Revise los votos de la pizarra'
            : Strings.reviewPhotoPlease
        }
        instructionsStyle={{
          fontSize: moderateScale(20),
          fontWeight: '800',
          color: colors.text || '#000000',
        }}
        photoUri={effectivePhotoUri}
        partyResults={partyResults}
        voteSummaryResults={voteSummaryResults}
        isEditing={isEditing}
        onPartyUpdate={updatePartyResult}
        onVoteSummaryUpdate={updateVoteSummaryResult}
        actionButtons={actionButtons}
        onBack={handleBack}
        showTableInfo={true}
        tableData={getMesaInfo()}
        emptyDisplayWhenReadOnly={offline ? '' : '0'}
        showDeputy={false}
        twoColumns={false}
        highlightPhotoToggle={true}
        photoToggleLabelCollapsed={
          isWorksheetMode ? 'Ver foto de la hoja' : 'Ver foto del acta'
        }
        photoToggleLabelExpanded={
          isWorksheetMode ? 'Ocultar foto de la hoja' : 'Ocultar foto del acta'
        }
        extraContent={observationSection}
      />
      <Modal
        visible={showWorksheetConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isWorksheetSubmitting) {
            setShowWorksheetConfirmModal(false);
          }
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.iconCircleWarning}>
              <Ionicons name="alert-outline" size={48} color="#da2a2a" />
            </View>
            <CText style={styles.confirmTitle}>Subir Hoja de trabajo</CText>
            <CText style={styles.confirmBody}>
              Esta hoja se sube como respaldo y funciona para comparar
              resultados del acta.
            </CText>

            {isWorksheetSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#193b5e" />
                <CText style={styles.loadingText}>Encolando hoja...</CText>
              </View>
            ) : null}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowWorksheetConfirmModal(false)}
                disabled={isWorksheetSubmitting}>
                <CText style={styles.cancelButtonText}>Cancelar</CText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isWorksheetSubmitting && styles.buttonDisabled,
                ]}
                onPress={confirmWorksheetQueue}
                disabled={isWorksheetSubmitting}>
                <CText style={styles.confirmButtonText}>CONFIRMAR</CText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <InfoModal {...infoModalData} onClose={closeInfoModal} />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
  },
  modalContainer: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(18),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconCircleWarning: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#fdf4f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  confirmTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(10),
  },
  confirmBody: {
    fontSize: moderateScale(15),
    color: '#4F4F4F',
    textAlign: 'center',
    lineHeight: moderateScale(21),
    marginBottom: moderateScale(16),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  loadingText: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    minHeight: moderateScale(48),
    marginRight: moderateScale(6),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  confirmButton: {
    flex: 1,
    minHeight: moderateScale(48),
    marginLeft: moderateScale(6),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#459151',
  },
  confirmButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  observationContainer: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    backgroundColor: '#FFFFFF',
  },
  observationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  observationCheckbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7C7C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  observationToggleLabel: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  observationQuestionLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  observationSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(10),
  },
  observationChoicePill: {
    minWidth: moderateScale(54),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationChoiceText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#6A6A6A',
  },
  observationSwitch: {
    transform: [{scaleX: 1.05}, {scaleY: 1.05}],
  },
  observationInput: {
    marginTop: moderateScale(10),
    minHeight: moderateScale(72),
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    textAlignVertical: 'top',
    fontSize: moderateScale(13),
    color: '#1F1F1F',
    backgroundColor: '#FFFFFF',
  },
});

export default PhotoReviewScreen;
