import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import UniversalHeader from '../../../components/common/UniversalHeader';
import I18nStrings from '../../../i18n/String';
import pinataService from '../../../utils/pinataService';
import { executeOperation } from '../../../api/account';
import { BACKEND_RESULT, CHAIN, BACKEND_SECRET } from '@env';
import axios from 'axios';
import { oracleCalls, oracleReads } from '../../../api/oracle';
import { availableNetworks } from '../../../api/params';
import InfoModal from '../../../components/modal/InfoModal';
import NetInfo from '@react-native-community/netinfo';
import { enqueue } from '../../../utils/offlineQueue';
import { persistLocalImage } from '../../../utils/persistLocalImage';
import { validateBallotLocally } from '../../../utils/ballotValidation';
import { getCredentialSubjectFromPayload } from '../../../utils/Cifrate';
import nftImage from '../../../assets/images/nft-medal.png';
import { captureRef } from 'react-native-view-shot';
import { StackNav, TabNav } from '../../../navigation/NavigationKey';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ELECTION_ID } from '../../../common/constants';
import { captureError } from '../../../config/sentry';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const safeStr = v =>
  String(v ?? '')
    .trim()
    .toLowerCase();

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

  const existingRecord = route.params?.existingRecord || null;
  const flowMode = route.params?.mode || 'upload';
  const mesaData = route.params?.mesaData;
  const mesa = route.params?.mesa;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [ipfsData, setIpfsData] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isNameVisible, setIsNameVisible] = useState(true);
  const [duplicateBallot, setDuplicateBallot] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [certificateUri, setCertificateUri] = useState(null);
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
  const extractJsonUrlFromBallot = b =>
    b?.ipfsUri ||
    b?.jsonUrl ||
    b?.ipfsJSON ||
    b?.ipfs?.json ||
    b?.ipfs?.jsonUrl ||
    null;
  const didAutoOpenRef = useRef(false);
  // useEffect(() => {
  //   if (didAutoOpenRef.current) return;
  //   didAutoOpenRef.current = true;
  //   const t = setTimeout(() => {
  //     verifyAndUpload();
  //   }, 0);
  //   return () => clearTimeout(t);
  // }, []);

  // Obtener nombre real del usuario desde Redux
  const userData = useSelector(state => state.wallet.payload);

  const vc = userData?.vc;
  const subject = getCredentialSubjectFromPayload(userData) || {};
  const dni =
    subject?.nationalIdNumber ??
    subject?.documentNumber ??
    subject?.governmentIdentifier ??
    userData?.dni ??
    null;
  const data = { name: subject?.fullName || '(sin nombre)' };
  const userFullName = data.name || '(sin nombre)';

  const handleBack = () => {
    navigation.goBack();
  };

  const verifyAndUpload = async () => {
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
    } catch (err) { }

    try {
      const normalizedObservationText = String(observationText || '').trim();
      if (hasObservation && !normalizedObservationText) {
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

      handlePublishAndCertify();
    } catch (error) {
      setUploadError('Error en validación local');
    }
  };

  const buildVoteData = type => {
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
      (voteSummaryResults || []).find(
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
      partyVotes: partyResults.map(party => ({
        partyId: String(party.partido || '')
          .trim()
          .toLowerCase(),
        votes: parseInt(party.presidente, 10) || 0,
      })),
      totalVotes: getValue('validos') + getValue('nulos') + getValue('blancos'),
    };
  };

  const uploadMetadataToBackend = async (jsonUrl, jsonCID, tableCode) => {
    try {
      const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/from-ipfs`;

      const payload = {
        ipfsUri: String(jsonUrl),
        recordId: String(jsonCID),
        tableIdIpfs: 'String',
      };

      const response = await axios.post(backendUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      captureError(error, {
        flow: 'vote_upload',
        step: 'upload_metadata_backend',
        critical: true,
        tableCode: tableData?.tableCode || tableData?.codigo,
        http_status: error?.response?.status,
      });
      throw error;
    }
  };

  const uploadAttestation = async ballotId => {
    try {
      const url = `${BACKEND_RESULT}/api/v1/attestations`;
      const isJury = await oracleReads.isUserJury(CHAIN, userData.account);

      const payload = {
        attestations: [
          {
            ballotId,
            support: true,
            isJury,
            dni: String(userData.dni),
          },
        ],
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': BACKEND_SECRET
        },
        timeout: 30000,
      });

      return true;
    } catch (error) {
      captureError(error, {
        flow: 'vote_upload',
        step: 'upload_attestation',
        critical: false,
        tableCode: tableData?.tableCode || tableData?.codigo,
      });
      return false;
    }
  };

  const validateWithBackend = async (ipfsJsonUrl, electionId) => {
    try {
      const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/validate-ballot-data`;
      const payload = {
        ipfsUri: ipfsJsonUrl,
        recordId: 'String',
        tableIdIpfs: 'String',
        ...(electionId ? { electionId: String(electionId) } : {}),
      };

      const response = await axios.post(backendUrl, payload, {
        headers: {
          'Content-Type': 'application/json',

        },
        timeout: 30000,
      });

      // Manejar diferentes tipos de respuestas
      if (response.data === true) {
        return true;
      }

      if (typeof response.data === 'object' && response.data.success === true) {
        return true;
      }

      // Manejar respuestas con mensajes de error específicos
      const errorMessage =
        response.data?.message ||
        response.data?.error ||
        I18nStrings.validationFailed;

      throw new Error(errorMessage);
    } catch (error) {
      // Manejar diferentes tipos de errores de Axios
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        const status = error.response.status;
        let statusMessage = '';

        switch (status) {
          case 400:
            statusMessage = I18nStrings.validationError400;
            break;
          case 401:
            statusMessage = I18nStrings.validationError401;
            break;
          case 403:
            statusMessage = I18nStrings.validationError403;
            break;
          case 404:
            statusMessage = I18nStrings.validationError404;
            break;
          case 500:
            statusMessage = I18nStrings.validationError500;
            break;
          default:
            statusMessage = I18nStrings.validationErrorGeneric;
        }

        // Intentar obtener mensaje detallado del servidor
        const serverMessage =
          error.response.data?.message || error.response.data?.error || '';

        captureError(new Error(`Backend validation error: ${status}`), {
          flow: 'vote_upload',
          step: 'validate_backend',
          critical: true,
          tableCode: tableData?.tableCode || tableData?.codigo,
          http_status: status,
        });

        throw new Error(`${statusMessage} ${serverMessage}`.trim());
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        if (error.code === 'ECONNABORTED') {
          throw new Error(I18nStrings.validationTimeout);
        }
        throw new Error(I18nStrings.validationNoResponse);
      } else {
        // Error al configurar la solicitud
        throw new Error(error.message || I18nStrings.validationFailed);
      }
    }
  };

  // Función para subir a IPFS
  const uploadToIPFS = async () => {
    if (!photoUri) {
      return null;
    }

    setUploadingToIPFS(true);

    try {
      // Preparar datos adicionales
      const additionalData = {
        idRecinto: tableData?.idRecinto || tableData.locationId,
        tableNumber: tableData?.tableNumber || tableData?.numero || 'N/A',
        tableCode: tableData?.codigo || 'N/A',
        location: tableData?.location || 'Bolivia',
        time: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        userId: userData?.id || 'unknown',
        userName: userFullName,
        role: 'witness',
      };

      // Preparar datos electorales
      const electoralData = {
        partyResults: partyResults || [],
        voteSummaryResults: voteSummaryResults || [],
        hasObservation: Boolean(hasObservation),
        observationText: String(observationText || '').trim(),
      };

      const normalizedVoteSummary = (
        electoralData.voteSummaryResults || []
      ).map(r => {
        if (r.id === 'validos') return { ...r, label: 'Votos Válidos' };
        if (r.id === 'nulos') return { ...r, label: 'Votos Nulos' };
        if (r.id === 'blancos') return { ...r, label: 'Votos en Blanco' };
        return r;
      });

      // Convertir URI a path
      const imagePath = photoUri.startsWith('file://')
        ? photoUri.substring(7)
        : photoUri;

      // Subir imagen y crear metadata completa
      const startIpfs = Date.now();
      const result = await pinataService.uploadElectoralActComplete(
        imagePath,
        aiAnalysis || {},
        { ...electoralData, voteSummaryResults: normalizedVoteSummary },
        additionalData,
      );
      const ipfsDuration = Date.now() - startIpfs;

      if (result.success) {
        return result.data;
      } else {
        captureError(new Error(result.error || 'uploadToIPFS failed'), {
          flow: 'vote_upload',
          step: 'ipfs_upload',
          critical: true,
          tableCode: tableData?.tableCode || tableData?.codigo,
        });
        throw new Error(result.error || 'uploadToIPFS failed');
      }
    } catch (error) {
      captureError(error, {
        flow: 'vote_upload',
        step: 'ipfs_upload',
        critical: true,
        tableCode: tableData?.tableCode || tableData?.codigo,
      });
      throw error;
    } finally {
      setUploadingToIPFS(false);
    }
  };

  const handlePublishAndCertify = () => {
    setStep(0);
    setShowConfirmModal(true);
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
        } catch (e) {
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
      <View
        testID="photoConfirmationInfoContainer"
        style={styles.infoContainer}>
        <CText testID="photoConfirmationInfoText" style={styles.infoText}>
          Hacer nombre visible
        </CText>
        <Switch
          value={isNameVisible}
          onValueChange={setIsNameVisible}
          style={styles.infoSwitch}
          trackColor={{ false: '#D6D6D6', true: '#A5D6A7' }}
          thumbColor={isNameVisible ? '#4CAF50' : '#f4f3f4'}
        />
      </View>

      {/* Main Content */}
      <View testID="photoConfirmationContent" style={styles.content}>
        {!showConfirmModal && !showDuplicateModal && (
          <>
            <View style={styles.nftCertificate} ref={certificateRef}>
              <View style={styles.certificateBorder}>
                <View style={styles.medalContainer}>
                  <Image
                    source={nftImage}
                    style={styles.medalImage}
                    resizeMode="contain"
                  />
                </View>
                <CText style={styles.nftName}>
                  {isNameVisible ? userFullName : '••••••'}
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
                    onPress={confirmPublishAndCertify}>
                    <CText
                      testID="photoConfirmationModalConfirmText"
                      style={modalStyles.confirmButtonText}>
                      {I18nStrings.publishAndCertify}
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
                  Estamos guardando tu acta para subirla.
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
                  Acta guardada. Se subirá en segundo plano.
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
                    onPress={() => {
                      setShowConfirmModal(false);
                      setStep(0);
                      navigateHome();
                    }}>
                    <CText
                      testID="photoConfirmationModalGoHomeText"
                      style={modalStyles.confirmButtonText}>
                      Ir al Inicio
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
    marginTop: 0,
    marginHorizontal: 5,

    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: getResponsiveSize(15, 17, 19),
    color: '#868686',
    fontWeight: '500',
  },
  infoSwitch: {
    marginLeft: getResponsiveSize(8, 10, 12),
    transform: [{ scale: getResponsiveSize(1.1, 1.15, 1.2) }],
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
});

// NFT Modal Styles
const nftModalStyles = StyleSheet.create({
  nftModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  nftCertificate: {
    backgroundColor: '#f8fff8',
    borderRadius: 22,
    padding: 28,
    width: '88%',
    alignItems: 'center',
    elevation: 8,
  },
  certificateBorder: {
    borderWidth: 2.5,
    borderColor: '#a5deb5',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#edffe8',
    borderStyle: 'dashed',
  },
  medalContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: 96,
    height: 96,
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: '#ffe9b8',
    borderWidth: 4,
    borderColor: '#fff7e0',
    marginTop: -38,
  },
  medalImage: {
    width: 62,
    height: 62,
    position: 'absolute',
    left: 17,
    top: 17,
  },
  nftMedalText: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 30,
    color: '#CBA233',
    letterSpacing: 3,
  },
  nftName: {
    fontWeight: '700',
    fontSize: 22,
    marginVertical: 6,
    color: '#17694A',
    textAlign: 'center',
  },
  nftCertTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#17694A',
    textAlign: 'center',
  },
  nftCertDetail: {
    fontWeight: '400',
    fontSize: 15,
    color: '#17694A',
    textAlign: 'center',
  },
  closeModalBtn: {
    marginTop: 8,
    backgroundColor: '#17694A',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeModalText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  duplicateMessage: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4F4F4F',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 24, 32),
    lineHeight: getResponsiveSize(20, 24, 28),
    paddingHorizontal: getResponsiveSize(8, 16, 24),
  },
});

export default PhotoConfirmationScreen;
