import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import UniversalHeader from '../../../components/common/UniversalHeader';
import I18nStrings from '../../../i18n/String';
import InfoModal from '../../../components/modal/InfoModal';
import { enqueue, getAll as getOfflineQueue } from '../../../utils/offlineQueue';
import { persistLocalImage } from '../../../utils/persistLocalImage';
import { validateBallotLocally } from '../../../utils/ballotValidation';
import { getCredentialSubjectFromPayload } from '../../../utils/Cifrate';
import nftImage from '../../../assets/images/nft-medal.png';
import { captureRef } from 'react-native-view-shot';
import { StackNav, TabNav } from '../../../navigation/NavigationKey';
import { captureError } from '../../../config/sentry';
import {
  WorksheetStatus,
  upsertWorksheetLocalStatus,
} from '../../../utils/worksheetLocalStatus';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

// const fetchUserAttestations = async (dniValue, electionId) => {
//   if (!dniValue) return [];
//   const queryId = electionId
//     ? `?electionId=${encodeURIComponent(electionId)}`
//     : '';
//   const url = `${BACKEND_RESULT}/api/v1/attestations/by-user/${dniValue}${queryId}`;
//   const {data} = await axios.get(url, {
//     headers: {'x-api-key': BACKEND_SECRET},
//     timeout: 15000,
//   });
//   return data?.data || [];
// };


const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) {
    return small;
  }
  if (isTablet) {
    return large;
  }
  return medium;
};

const getResponsiveModalWidth = () => {
  if (isTablet) {
    return screenWidth * 0.6; // Tablets: 60% width
  }
  if (isSmallPhone) {
    return screenWidth * 0.9; // Small phones: 90% width
  }
  return screenWidth * 0.85; // Regular phones: 85% width
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
    return `Votos de ${String(partyRaw || 'partido').toUpperCase()}`;
  }
  return field;
};

const PhotoConfirmationScreen = ({ route }) => {
  const { electionId, electionType } = route.params || {};
  const navigation = useNavigation();
  const navigateHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: { screen: TabNav.HomeScreen },
        },
      ],
    });
  }, [navigation]);
  const colors = useSelector(state => state.theme.theme);
  const {
    tableData,
    photoUri,
    partyResults,
    voteSummaryResults,
    aiAnalysis,
    hasObservation = false,
    observationText = '',
  } = route.params || {};

  const flowMode = route.params?.mode || 'upload';
  const isWorksheetMode = flowMode === 'worksheet';
  const mesaData = route.params?.mesaData;
  const mesa = route.params?.mesa;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isNameVisible, setIsNameVisible] = useState(true);
  const [certificateUri, setCertificateUri] = useState(null);
  const [finalStepMessage, setFinalStepMessage] = useState(
    'Acta guardada. Se subirá en segundo plano.',
  );
  const [compareResult] = useState(() => {
    const fromRoute = route.params?.compareResult;
    if (fromRoute && typeof fromRoute === 'object') {
      return {
        status: fromRoute.status || null,
        worksheetStatus: fromRoute.worksheetStatus || null,
        differences: Array.isArray(fromRoute.differences)
          ? fromRoute.differences
          : [],
        message: String(fromRoute.message || ''),
      };
    }
    return {
      status: null,
      worksheetStatus: null,
      differences: [],
      message: '',
    };
  });
  const compareStatus = String(compareResult?.status || '')
    .trim()
    .toUpperCase();
  const shownCompareWarning = route.params?.shownCompareWarning === true;
  const shouldShowWorksheetMismatchWarning =
    !isWorksheetMode &&
    compareStatus === WorksheetCompareStatus.MISMATCH &&
    !shownCompareWarning;
  const worksheetMismatchDetails = Array.isArray(compareResult?.differences)
    ? compareResult.differences
      .slice(0, 5)
      .map(diff => {
        const field = formatWorksheetDiffFieldLabel(diff?.field);
        const worksheetValue =
          diff?.worksheetValue === null || diff?.worksheetValue === undefined
            ? 'sin dato'
            : String(diff.worksheetValue);
        const ballotValue =
          diff?.ballotValue === null || diff?.ballotValue === undefined
            ? 'sin dato'
            : String(diff.ballotValue);
        return `- ${field}: hoja ${worksheetValue}, acta ${ballotValue}`;
      })
      .join('\n')
    : '';
  const certificateRef = useRef(null);
  const [infoModalData, setInfoModalData] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const tableNumberLabel =
    tableData?.tableNumber ||
    tableData?.numero ||
    tableData?.number ||
    tableData?.id ||
    tableData?.tableId ||
    mesaData?.tableNumber ||
    mesaData?.numero ||
    mesaData?.number ||
    mesa?.tableNumber ||
    mesa?.numero ||
    mesa?.number ||
    (typeof tableData?.numero === 'string'
      ? tableData.numero.replace('Mesa ', '')
      : '') ||
    'DEBUG-EMPTY';

  const tableLocationLabel =
    tableData?.recinto ||
    tableData?.ubicacion ||
    tableData?.location ||
    tableData?.venue ||
    mesaData?.recinto ||
    mesaData?.ubicacion ||
    mesa?.recinto ||
    mesa?.ubicacion ||
    I18nStrings.locationNotAvailable;
  // Obtener nombre real del usuario desde Redux
  const userData = useSelector(state => state.wallet.payload);

  const subject = getCredentialSubjectFromPayload(userData) || {};
  const dni =
    subject?.nationalIdNumber ??
    subject?.documentNumber ??
    subject?.governmentIdentifier ??
    userData?.dni ??
    null;
  const data = { name: subject?.fullName || '(sin nombre)' };
  const userFullName = data.name || '(sin nombre)';
  const tableCode = String(
    tableData?.tableCode ||
    tableData?.codigo ||
    mesaData?.tableCode ||
    mesaData?.codigo ||
    mesa?.tableCode ||
    mesa?.codigo ||
    '',
  ).trim();
  const tableNumber = String(
    tableData?.tableNumber ||
    tableData?.numero ||
    tableData?.number ||
    mesaData?.tableNumber ||
    mesaData?.numero ||
    mesaData?.number ||
    mesa?.tableNumber ||
    mesa?.numero ||
    mesa?.number ||
    aiAnalysis?.table_number ||
    '',
  ).trim();
  const locationId = String(
    route.params?.locationId ||
    tableData?.location?._id ||
    tableData?.idRecinto ||
    tableData?.locationId ||
    mesaData?.idRecinto ||
    mesa?.idRecinto ||
    '',
  ).trim();

  const handleBack = () => {
    navigation.goBack();
  };

  const verifyAndUpload = async () => {
    if (!isWorksheetMode) {
      try {
        if (certificateRef.current) {
          const capturedCertificateUri = await captureRef(
            certificateRef.current,
            {
              format: 'png',
              quality: 0.9,
            },
          );
          setCertificateUri(capturedCertificateUri);
        }
      } catch { }
    }

    try {
      const normalizedObservationText = String(observationText || '').trim();
      if (!isWorksheetMode && hasObservation && !normalizedObservationText) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.validationFailed,
          message:
            'Debes escribir la observacion del acta antes de continuar.',
        });
        return;
      }

      const local = validateBallotLocally(
        partyResults || [],
        voteSummaryResults || [],
      );
      if (!local.ok) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.validationFailed,
          message: local.errors.join('\n'),
        });
        return;
      }

      if (isWorksheetMode) {
        setFinalStepMessage('');
        setStep(0);
        setShowConfirmModal(true);
        return;
      }

      handlePublishAndCertify();
    } catch {
      setInfoModalData({
        visible: true,
        title: I18nStrings.genericError,
        message: 'Error en validación local.',
      });
    }
  };

  const handlePublishAndCertify = () => {
    setStep(0);
    setShowConfirmModal(true);
  };

  const confirmWorksheetUpload = async () => {
    setStep(1);
    const eid = electionId || undefined;
    try {
      const local = validateBallotLocally(
        partyResults || [],
        voteSummaryResults || [],
      );
      if (!local.ok) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.validationFailed,
          message: local.errors.join('\n'),
        });
        setStep(0);
        return;
      }

      if (!photoUri) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.genericError,
          message: 'No se encontró la foto de la hoja de trabajo.',
        });
        setStep(0);
        return;
      }

      const worksheetIdentity = {
        dni: String(dni ?? ''),
        electionId: String(eid || ''),
        tableCode: String(tableCode || ''),
      };

      if (
        !worksheetIdentity.dni ||
        !worksheetIdentity.electionId ||
        !worksheetIdentity.tableCode ||
        !String(tableNumber || '').trim()
      ) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.genericError,
          message:
            'Faltan datos obligatorios de mesa o usuario para encolar la hoja.',
        });
        setStep(0);
        return;
      }

      const queuedItems = await getOfflineQueue();
      const alreadyQueued = (queuedItems || []).some(item => {
        if (item?.task?.type !== 'publishWorksheet') return false;
        const payload = item?.task?.payload || {};
        const payloadDni = String(
          payload?.additionalData?.dni || payload?.dni || '',
        ).trim();
        const payloadElectionId = String(
          payload?.additionalData?.electionId || payload?.electionId || '',
        ).trim();
        const payloadTableCode = String(
          payload?.additionalData?.tableCode ||
          payload?.tableCode ||
          payload?.tableData?.codigo ||
          payload?.tableData?.tableCode ||
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
        setFinalStepMessage(
          'La hoja ya estaba en cola. Se subirá en segundo plano.',
        );
        setStep(2);
        return;
      }

      const persistedUri = await persistLocalImage(photoUri);
      const additionalData = {
        idRecinto: String(locationId ?? ''),
        locationId: String(locationId ?? ''),
        tableNumber: String(tableNumber),
        tableCode: String(tableCode),
        location: tableData?.location || 'Bolivia',
        userId: userData?.id || 'unknown',
        userName: userFullName,
        role: 'worksheet',
        dni: worksheetIdentity.dni,
        electionId: worksheetIdentity.electionId,
      };

      const electoralData = {
        partyResults: partyResults || [],
        voteSummaryResults: voteSummaryResults || [],
      };

      const worksheetTaskPayload = {
        imageUri: persistedUri,
        aiAnalysis: aiAnalysis || {},
        electoralData,
        additionalData,
        tableData: {
          codigo: String(tableCode),
          idRecinto: locationId,
          tableNumber: String(tableNumber),
          numero: String(tableNumber),
        },
        tableCode: String(tableCode),
        tableNumber: String(tableNumber),
        locationId: String(locationId ?? ''),
        createdAt: Date.now(),
        electionId: eid,
        electionType: electionType || undefined,
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
      setFinalStepMessage(
        'Hoja encolada correctamente. Se subirá en segundo plano.',
      );
      setStep(2);
    } catch (error) {
      setInfoModalData({
        visible: true,
        title: I18nStrings.genericError,
        message: error?.message || 'Error al registrar la hoja de trabajo.',
      });
      setShowConfirmModal(false);
      setStep(0);
    }
  };


  const confirmPublishAndCertify = async () => {
    setStep(1);
    const eid = electionId || undefined;
    try {
      const local = validateBallotLocally(
        partyResults || [],
        voteSummaryResults || [],
      );

      if (!local.ok) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.validationFailed,
          message: local.errors.join('\n'),
        });
        setStep(0);
        return;
      }

      const locationId =
        route.params?.locationId ||
        tableData?.location?._id ||
        tableData?.idRecinto ||
        tableData?.locationId ||
        mesaData?.idRecinto ||
        mesa?.idRecinto ||
        null;

      const tableCode = String(
        tableData?.tableCode ||
        tableData?.codigo ||
        mesaData?.tableCode ||
        mesaData?.codigo ||
        mesa?.tableCode ||
        mesa?.codigo ||
        '',
      );

      const tableNumber = String(
        tableData?.tableNumber ||
        tableData?.numero ||
        tableData?.number ||
        mesaData?.tableNumber ||
        mesaData?.numero ||
        mesaData?.number ||
        mesa?.tableNumber ||
        mesa?.numero ||
        mesa?.number ||
        aiAnalysis?.table_number ||
        '',
      );

      if (!photoUri) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.genericError,
          message: 'No se encontró la foto del acta. Vuelve a capturarla.',
        });
        setShowConfirmModal(false);
        setStep(0);
        return;
      }

      const persistedUri = await persistLocalImage(photoUri);

      let persistedCertificateUri = null;
      if (certificateUri) {
        try {
          persistedCertificateUri = await persistLocalImage(certificateUri);
        } catch {
          // Error no critico - solo persistencia de certificado

        }
      }

      const additionalData = {
        idRecinto: String(locationId ?? ''),
        locationId: String(locationId ?? ''),
        tableNumber: String(tableNumber),
        tableCode: String(tableCode),
        location: tableData?.location || 'Bolivia',
        userId: userData?.id || 'unknown',
        userName: userFullName,
        certificateDisplayName: isNameVisible ? userFullName : '*****',
        showNameOnCertificate: Boolean(isNameVisible),
        role: 'witness',
        dni: String(dni ?? ''),
        electionId: eid,
        hasObservation: Boolean(hasObservation),
        observationText: String(observationText || '').trim(),
      };

      const electoralData = {
        partyResults: partyResults || [],
        voteSummaryResults: voteSummaryResults || [],
        hasObservation: Boolean(hasObservation),
        observationText: String(observationText || '').trim(),
      };

      await enqueue({
        type: 'publishActa',
        payload: {
          imageUri: persistedUri,
          certificateImageUri: persistedCertificateUri,
          aiAnalysis: aiAnalysis || {},
          electoralData,
          additionalData,
          tableData: {
            codigo: String(tableCode),
            idRecinto: locationId,
            tableNumber: String(tableNumber),
            numero: String(tableNumber),
          },
          tableCode: String(tableCode),
          tableNumber: String(tableNumber),
          locationId: String(locationId ?? ''),
          createdAt: Date.now(),
          electionId: eid,
          electionType: electionType || undefined,

        },
      });
      setFinalStepMessage('Acta guardada. Se subirá en segundo plano.');
      setStep(2);
    } catch (error) {
      captureError(error, {
        flow: 'vote_upload',
        step: 'confirm_publish_certify',
        critical: true,
        tableCode: tableData?.tableCode || tableData?.codigo,
      });
      setInfoModalData({
        visible: true,
        title: I18nStrings.genericError,
        message: error?.message || 'Error al encolar el acta',
      });
      setShowConfirmModal(false);
      setStep(0);
    }
  };

  const closeModal = () => {
    setShowConfirmModal(false);
    setStep(0);
  };
  const closeInfoModal = () => {
    setInfoModalData({
      visible: false,
      title: '',
      message: '',
    });
  };

  const handleFinish = () => {
    setShowConfirmModal(false);
    setStep(0);
    navigateHome();
  };

  return (
    <CSafeAreaView testID="photoConfirmationContainer" style={styles.container}>
      {/* Header */}
      <UniversalHeader
        testID="photoConfirmationHeader"
        colors={colors}
        onBack={handleBack}
        title={``}
        showNotification={true}
        onNotificationPress={() => {
          // Handle notification press
        }}
      />

      {/* Information Ready to Load Text */}
      {!isWorksheetMode && (
        <View
          testID="photoConfirmationInfoContainer"
          style={styles.infoContainer}>
          <CText
            testID="photoConfirmationInfoTitle"
            type="B20"
            style={styles.infoTitle}>
            Este será tu certificado de participación
          </CText>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.infoSwitchCard}
            onPress={() => setIsNameVisible(prev => !prev)}>
            <View style={styles.infoSwitchRow}>
              <CText
                testID="photoConfirmationInfoText"
                type="S16"
                style={styles.infoText}>
                Mostrar mi nombre en el certificado
              </CText>
              <Switch
                value={isNameVisible}
                onValueChange={setIsNameVisible}
                style={styles.infoSwitch}
                trackColor={{ false: '#D6D6D6', true: '#A5D6A7' }}
                thumbColor={isNameVisible ? '#4CAF50' : '#f4f3f4'}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View testID="photoConfirmationContent" style={styles.content}>
        {shouldShowWorksheetMismatchWarning && (
          <View
            style={[
              styles.compareContainer,
              { borderColor: '#B42318', backgroundColor: '#FEF3F2' },
            ]}>
            <CText style={[styles.compareTitle, { color: '#B42318' }]}>
              Aviso: la hoja de trabajo no coincide
            </CText>
            <CText style={styles.compareText}>
              {compareResult?.message ||
                'Se detectaron diferencias entre la hoja de trabajo y el acta.'}
            </CText>
            {worksheetMismatchDetails ? (
              <CText style={styles.compareDiffs}>{worksheetMismatchDetails}</CText>
            ) : null}
          </View>
        )}
        {!showConfirmModal && !showDuplicateModal && (
          <>
            <View style={styles.nftCertificate} ref={certificateRef}>
              <View style={styles.certificateBorder}>
                {isWorksheetMode && (
                  <>
                    <CText style={styles.nftName}>Hoja de Trabajo</CText>
                    <CText style={styles.nftCertDetail}>
                      {(tableLocationLabel || '').toUpperCase()}
                    </CText>
                    <CText style={styles.nftCertDetail}>
                      {`MESA ${tableNumberLabel || ''}`.toUpperCase()}
                    </CText>
                    <CText style={styles.nftCertDetail}>
                      Referencia privada para comparar antes de certificar.
                    </CText>
                  </>
                )}
                {!isWorksheetMode && (
                  <>
                    <View style={styles.medalContainer}>
                      <Image
                        source={nftImage}
                        style={styles.medalImage}
                        resizeMode="contain"
                      />
                    </View>
                    <CText style={styles.nftName}>
                      {isNameVisible ? userFullName : '*****'}
                    </CText>
                    <CText style={styles.nftCertTitle}>CERTIFICADO DE</CText>
                    <CText style={styles.nftCertTitle}>
                      PARTICIPACIÓN ELECTORAL
                    </CText>
                    <CText style={styles.nftCertDetail}>
                      {(tableLocationLabel || '').toUpperCase()}
                    </CText>

                    <CText style={styles.nftCertDetail}>
                      {`MESA ${tableNumberLabel || ''}`.toUpperCase()}
                    </CText>
                  </>
                )}
              </View>
            </View>

            <TouchableOpacity
              testID="photoConfirmationPublishButton"
              style={styles.publishButton}
              onPress={verifyAndUpload}>
              <CText
                testID="photoConfirmationPublishButtonText"
                style={styles.publishButtonText}>
                {'Siguiente'}
              </CText>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal
        testID="photoConfirmationModal"
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View
          testID="photoConfirmationModalOverlay"
          style={modalStyles.modalOverlay}>
          <View
            testID="photoConfirmationModalContainer"
            style={modalStyles.modalContainer}>
            {step === 0 && (
              <>
                <View
                  testID="photoConfirmationModalWarningIcon"
                  style={modalStyles.iconCircleWarning}>
                  <Ionicons
                    name="alert-outline"
                    size={getResponsiveSize(36, 48, 60)}
                    color="#da2a2a"
                  />
                </View>


                <CText
                  testID="photoConfirmationModalBody"
                  style={modalStyles.confirmBody}>
                  <CText
                    testID="photoConfirmationModalUserName"
                    style={modalStyles.boldText}>
                    Yo {userFullName}
                  </CText>
                  {'\n'}
                  Certifico que los datos que ingreso coinciden con la foto del
                  acta de la mesa y declaro que no he{' '}
                  <CText style={modalStyles.boldText}>
                    inventado ni modificado
                  </CText>{' '}
                  información.
                </CText>

                <View
                  testID="photoConfirmationModalButtonContainer"
                  style={modalStyles.buttonContainer}>
                  <TouchableOpacity
                    testID="photoConfirmationModalCancelButton"
                    style={modalStyles.cancelButton}
                    onPress={closeModal}>
                    <CText
                      testID="photoConfirmationModalCancelText"
                      style={modalStyles.cancelButtonText}>
                      {I18nStrings.cancel}
                    </CText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="photoConfirmationModalConfirmButton"
                    style={modalStyles.confirmButton}
                    onPress={
                      isWorksheetMode
                        ? confirmWorksheetUpload
                        : confirmPublishAndCertify
                    }>
                    <CText
                      testID="photoConfirmationModalConfirmText"
                      style={modalStyles.confirmButtonText}>
                      {isWorksheetMode
                        ? 'Confirmar subida'
                        : I18nStrings.publishAndCertify}
                    </CText>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 1 && (
              <>
                <ActivityIndicator
                  testID="photoConfirmationModalLoading"
                  size="large"
                  color="#193b5e"
                  style={modalStyles.loading}
                />
                <CText
                  testID="photoConfirmationModalLoadingTitle"
                  style={modalStyles.loadingTitle}>
                  {I18nStrings.pleaseWait}
                </CText>
                <CText
                  testID="photoConfirmationModalLoadingSubtext"
                  style={modalStyles.loadingSubtext}>
                  {isWorksheetMode
                    ? 'Estamos registrando tu hoja de trabajo.'
                    : 'Estamos guardando tu acta para subirla.'}
                </CText>
              </>
            )}
            {step === 2 && (
              <>
                <View
                  testID="photoConfirmationModalWarningIcon"
                  style={modalStyles.iconCircleWarning}>
                  <Ionicons
                    name="alert-outline"
                    size={getResponsiveSize(36, 48, 60)}
                    color="#da2a2a"
                  />
                </View>
                <CText
                  testID="photoConfirmationModalFinishedTitle"
                  style={modalStyles.loadingTitle}></CText>
                <CText
                  testID="photoConfirmationModalFinishedSubtext"
                  style={modalStyles.loadingSubtext}>
                  {finalStepMessage}
                </CText>
                <View
                  testID="photoConfirmationModalFinishedButtons"
                  style={[
                    modalStyles.buttonContainer,
                    { marginTop: getResponsiveSize(12, 16, 20) },
                  ]}>
                  <TouchableOpacity
                    testID="photoConfirmationModalGoHomeButton"
                    style={modalStyles.confirmButton}
                    onPress={handleFinish}>
                    <CText
                      testID="photoConfirmationModalGoHomeText"
                      style={modalStyles.confirmButtonText}>
                      {'Ir al Inicio'}
                    </CText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        testID="photoConfirmationDuplicateModal"
        visible={showDuplicateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicateModal(false)}>
        <View
          testID="photoConfirmationDuplicateModalOverlay"
          style={modalStyles.modalOverlay}>
          <View
            testID="photoConfirmationDuplicateModalContainer"
            style={modalStyles.modalContainer}>
            <View
              testID="photoConfirmationDuplicateModalWarningIcon"
              style={modalStyles.iconCircleWarning}>
              <Ionicons
                name="warning-outline"
                size={getResponsiveSize(36, 48, 60)}
                color="#FFA000"
              />
            </View>
            <View style={modalStyles.spacer} />
            <CText
              testID="photoConfirmationDuplicateModalTitle"
              style={modalStyles.confirmTitle}>
              {I18nStrings.duplicateBallotTitle}
            </CText>

            <CText
              testID="photoConfirmationDuplicateModalMessage"
              style={modalStyles.duplicateMessage}>
              {I18nStrings.duplicateBallotMessage}
            </CText>

            <View
              testID="photoConfirmationDuplicateModalButtonContainer"
              style={modalStyles.buttonContainer}>
              <TouchableOpacity
                testID="photoConfirmationDuplicateModalGoBackButton"
                style={[modalStyles.cancelButton, { flex: 1 }]}
                onPress={() => setShowDuplicateModal(false)}>
                <CText
                  testID="photoConfirmationDuplicateModalGoBackText"
                  style={modalStyles.cancelButtonText}>
                  {I18nStrings.goBack}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <InfoModal
        testID="photoConfirmationInfoModal"
        {...infoModalData}
        onClose={closeInfoModal}
      />
    </CSafeAreaView>
  );
};

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 32),
  },
  confirmBody: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4F4F4F',
    textAlign: 'justify',
    lineHeight: getResponsiveSize(20, 24, 28),
    marginBottom: getResponsiveSize(14, 18, 22),
    paddingHorizontal: getResponsiveSize(8, 16, 24),
    alignSelf: 'stretch',
  },
  boldText: {
    fontWeight: '700',
    color: '#2F2F2F',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(12, 16, 20),
    padding: getResponsiveSize(16, 24, 32),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: getResponsiveModalWidth(),
    maxWidth: isTablet ? 500 : screenWidth * 0.95,
  },
  iconCircleWarning: {
    backgroundColor: '#fdf4f4',
    width: getResponsiveSize(60, 80, 100),
    height: getResponsiveSize(60, 80, 100),
    borderRadius: getResponsiveSize(30, 40, 50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  spacer: {
    height: getResponsiveSize(8, 10, 12),
  },
  confirmTitle: {
    fontSize: getResponsiveSize(16, 18, 22),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 24, 32),
    lineHeight: getResponsiveSize(20, 24, 28),
    paddingHorizontal: getResponsiveSize(8, 16, 24),
  },
  buttonContainer: {
    flexDirection: isTablet ? 'row' : isSmallPhone ? 'column' : 'row',
    gap: getResponsiveSize(8, 12, 16),
    width: '100%',
  },
  cancelButton: {
    flex: isSmallPhone ? 0 : 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: getResponsiveSize(10, 12, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    minHeight: getResponsiveSize(40, 48, 56),
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  confirmButton: {
    flex: isSmallPhone ? 0 : 1,
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(10, 12, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    minHeight: getResponsiveSize(40, 48, 56),
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#fff',
  },
  loading: {
    marginBottom: getResponsiveSize(12, 16, 20),
    transform: [{ scale: getResponsiveSize(0.8, 1, 1.2) }],
  },
  loadingTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: '700',
    color: '#193b5e',
    marginBottom: getResponsiveSize(6, 8, 12),
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#2F2F2F',
    textAlign: 'center',
    paddingHorizontal: getResponsiveSize(8, 16, 24),
    lineHeight: getResponsiveSize(18, 20, 24),
  },
  duplicateMessage: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4F4F4F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 24, 32),
    lineHeight: getResponsiveSize(20, 24, 28),
    paddingHorizontal: getResponsiveSize(8, 16, 24),
  },
  ipfsSubtext: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(8, 16, 24),
    lineHeight: getResponsiveSize(16, 18, 20),
  },
});

const styles = StyleSheet.create({
  bigTitle: {
    fontSize: getResponsiveSize(22, 26, 30),
    fontWeight: '800',
    color: '#17694A',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 25, 30),
    lineHeight: getResponsiveSize(28, 32, 36),
  },
  nftCertificate: {
    backgroundColor: '#f8fff8',
    borderRadius: 18,
    padding: getResponsiveSize(20, 24, 28),
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  certificateBorder: {
    borderWidth: 2,
    borderColor: '#a5deb5',
    borderRadius: 15,
    padding: getResponsiveSize(18, 22, 26),
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#edffe8',
    borderStyle: 'dashed',
  },
  medalContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: getResponsiveSize(70, 80, 90),
    height: getResponsiveSize(70, 80, 90),
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: '#ffe9b8',
    borderWidth: 3,
    borderColor: '#fff7e0',
    marginTop: getResponsiveSize(-25, -30, -35),
  },
  medalImage: {
    width: getResponsiveSize(45, 55, 65),
    height: getResponsiveSize(45, 55, 65),
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: getResponsiveSize(-22, -27, -32),
    marginLeft: getResponsiveSize(-22, -27, -32),
  },
  nftMedalText: {
    position: 'absolute',
    bottom: getResponsiveSize(6, 8, 10),
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#CBA233',
    letterSpacing: 1,
  },
  nftName: {
    fontWeight: '700',
    fontSize: getResponsiveSize(18, 20, 22),
    marginVertical: getResponsiveSize(4, 6, 8),
    color: '#17694A',
    textAlign: 'center',
  },
  nftCertTitle: {
    fontWeight: '700',
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#17694A',
    textAlign: 'center',
    marginVertical: 1,
  },
  nftCertDetail: {
    fontWeight: '400',
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#17694A',
    textAlign: 'center',
    marginVertical: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for the entire screen
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveSize(16, 20, 28),
    paddingBottom: getResponsiveSize(10, 14, 18),
    paddingTop: getResponsiveSize(6, 8, 10),
    marginTop: 0,
    marginHorizontal: 5,

    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  infoTitle: {
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  infoSubtitle: {
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#5E5E5E',
    lineHeight: getResponsiveSize(18, 20, 24),
    marginBottom: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
  },
  infoSwitchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,

    marginTop: getResponsiveSize(10, 12, 14),
  },
  infoSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    color: '#2F2F2F',
    flex: 1,
    paddingRight: getResponsiveSize(8, 10, 12),
  },
  infoSwitch: {
    marginLeft: getResponsiveSize(8, 10, 12),
    transform: [{ scale: getResponsiveSize(1.1, 1.15, 1.2) }],
  },
  infoHelp: {
    fontSize: getResponsiveSize(12, 13, 15),
    color: '#7A7A7A',
    lineHeight: getResponsiveSize(16, 18, 20),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSize(16, 32, 64), // More responsive padding
    paddingVertical: getResponsiveSize(16, 24, 32),
    minHeight: isTablet ? 400 : 'auto', // Ensure proper height on tablets
  },
  mainText: {
    fontSize: getResponsiveSize(16, 18, 24),
    fontWeight: 'bold',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 10, 16),
    lineHeight: getResponsiveSize(20, 24, 32),
    maxWidth: isTablet ? 600 : '100%', // Limit width on tablets
  },
  mainTextBold: {
    fontWeight: 'bold',
  },
  subText: {
    fontSize: getResponsiveSize(14, 16, 20),
    fontWeight: 'normal',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
    lineHeight: getResponsiveSize(18, 20, 26),
    maxWidth: isTablet ? 600 : '100%',
  },
  publishButton: {
    backgroundColor: '#4CAF50', // Green color
    paddingVertical: getResponsiveSize(12, 14, 18),
    paddingHorizontal: getResponsiveSize(20, 24, 32),
    borderRadius: getResponsiveSize(6, 8, 12),
    marginBottom: getResponsiveSize(16, 20, 28),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minWidth: getResponsiveSize(200, 250, 300), // Minimum button width
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(44, 48, 56), // Minimum touch target
  },
  publishButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#2F2F2F',
    textAlign: 'center',
    lineHeight: getResponsiveSize(18, 24, 28),
    maxWidth: isTablet ? 500 : '100%', // Limit width on tablets
    paddingHorizontal: getResponsiveSize(8, 16, 24),
  },
  compareContainer: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: getResponsiveSize(10, 12, 14),
    paddingVertical: getResponsiveSize(8, 10, 12),
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  compareTitle: {
    fontSize: getResponsiveSize(13, 14, 16),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  compareText: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#374151',
    lineHeight: getResponsiveSize(16, 18, 20),
  },
  compareDiffs: {
    marginTop: 6,
    fontSize: getResponsiveSize(11, 12, 13),
    color: '#B42318',
    lineHeight: getResponsiveSize(15, 16, 18),
  },
});

export default PhotoConfirmationScreen;


