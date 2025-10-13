import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import UniversalHeader from '../../../components/common/UniversalHeader';
import I18nStrings from '../../../i18n/String';
import pinataService from '../../../utils/pinataService';
import {executeOperation} from '../../../api/account';
import {BACKEND_RESULT, CHAIN, BACKEND_SECRET} from '@env';
import axios from 'axios';
import {oracleCalls, oracleReads} from '../../../api/oracle';
import {availableNetworks} from '../../../api/params';
import InfoModal from '../../../components/modal/InfoModal';
import NetInfo from '@react-native-community/netinfo';
import {enqueue} from '../../../utils/offlineQueue';
import {persistLocalImage} from '../../../utils/persistLocalImage';
import {validateBallotLocally} from '../../../utils/ballotValidation';
import { getCredentialSubjectFromPayload } from '../../../utils/Cifrate';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

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

const PhotoConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme); // Assuming colors are managed by Redux
  const {tableData, photoUri, partyResults, voteSummaryResults, aiAnalysis} =
    route.params || {}; // Destructure all needed data
  // Also try to get data from alternative parameter names
  //console.log('[TABLE-DATA]', tableData);

  const mesaData = route.params?.mesaData;
  const mesa = route.params?.mesa;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [ipfsData, setIpfsData] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateBallot, setDuplicateBallot] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [infoModalData, setInfoModalData] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const didAutoOpenRef = useRef(false);
  useEffect(() => {
    if (didAutoOpenRef.current) return;
    didAutoOpenRef.current = true;
    const t = setTimeout(() => {
      verifyAndUpload();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Obtener nombre real del usuario desde Redux
  const userData = useSelector(state => state.wallet.payload);


  const vc = userData?.vc;
  const subject = getCredentialSubjectFromPayload(userData) || {};
  const data = {name: subject?.fullName || '(sin nombre)'};
  const userFullName = data.name || '(sin nombre)';

  const handleBack = () => {
    navigation.goBack();
  };

  const verifyAndUpload = async () => {
    try {
/*       console.log('[PhotoConfirmation] verifyAndUpload start', {
        tableCode: tableData?.codigo,
        tableNumber: tableData?.tableNumber || tableData?.numero,
      }); */

      const net = await NetInfo.fetch();
      const online = !!(net.isConnected && (net.isInternetReachable ?? true));
      //console.log('[PhotoConfirmation] network status', {online, net});
      if (!online) {
        //console.log('[PhotoConfirmation] offline -> enqueue flow');
        handlePublishAndCertify();
        return;
      }

      const local = validateBallotLocally(
        partyResults || [],
        voteSummaryResults || [],
      );
      //console.log('[PhotoConfirmation] local validation result', local);
      if (!local.ok) {
        setInfoModalData({
          visible: true,
          title: I18nStrings.validationFailed,
          message: local.errors.join('\n'),
        });
        return;
      }
      // Construir datos para verificación
      const verificationData = {
        tableNumber: tableData?.codigo || 'N/A',
        votes: {
          parties: buildVoteData('presidente'),
          deputies: buildVoteData('diputado'),
        },
      };
/*       console.log('[PhotoConfirmation] verificationData prepared', {
        verificationDataPreview: {
          tableNumber: verificationData.tableNumber,
          partiesCount: verificationData.votes.parties.length,
          deputiesCount: verificationData.votes.deputies.length,
        },
      }); */
      // Verificar duplicados
      const duplicateCheck = await pinataService.checkDuplicateBallot(
        verificationData,
      );
      console.log('[PhotoConfirmation] duplicateCheck result', duplicateCheck?.exists ? {exists: true, ballotId: duplicateCheck?.ballot?._id} : {exists: false});

      if (duplicateCheck.exists) {
        setDuplicateBallot(duplicateCheck.ballot);
        setShowDuplicateModal(true);
      } else {
        // No existe duplicado, proceder con la publicación
        handlePublishAndCertify();
      }
    } catch (error) {
      //console.logerror('[PhotoConfirmation] verifyAndUpload error', error);
      setUploadError('Error verificando duplicados');
    }
  };

  // const buildVoteData = type => {
  //   const getValue = (label, defaultValue = 0) => {
  //     const item = (voteSummaryResults || []).find(s => s.label === label);
  //     if (!item) return defaultValue;

  //     const value = type === 'presidente' ? item.value1 : item.value2;
  //     return parseInt(value, 10) || defaultValue;
  //   };

  //   return {
  //     validVotes: getValue('Votos Válidos'),
  //     nullVotes: getValue('Votos Nulos'),
  //     blankVotes: getValue('Votos en Blanco'),
  //     partyVotes: partyResults.map(party => ({
  //       partyId: party.partido,
  //       votes:
  //         parseInt(
  //           type === 'presidente' ? party.presidente : party.diputado,
  //           10,
  //         ) || 0,
  //     })),
  //     totalVotes:
  //       getValue('Votos Válidos') +
  //       getValue('Votos Nulos') +
  //       getValue('Votos en Blanco'),
  //   };
  // };
  // const buildVoteData = type => {
  //   const getValue = (label, defaultValue = 0) => {
  //     const item = (voteSummaryResults || []).find(s => s.label === label);
  //     if (!item) return defaultValue;

  //     const value = type === 'presidente' ? item.value1 : item.value2;
  //     return parseInt(value, 10) || defaultValue;
  //   };

  //   return {
  //     validVotes: getValue('Votos Válidos'),
  //     nullVotes: getValue('Votos Nulos'),
  //     blankVotes: getValue('Votos en Blanco'),
  //     partyVotes: partyResults.map(party => ({
  //       partyId: party.partido,
  //       votes:
  //         parseInt(
  //           type === 'presidente' ? party.presidente : party.diputado,
  //           10,
  //         ) || 0,
  //     })),
  //     totalVotes:
  //       getValue('Votos Válidos') +
  //       getValue('Votos Nulos') +
  //       getValue('Votos en Blanco'),
  //   };
  // };
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
        partyId: party.partido,
        votes:
          parseInt(
            type === 'presidente' ? party.presidente : party.diputado,
            10,
          ) || 0,
      })),
      totalVotes: getValue('validos') + getValue('nulos') + getValue('blancos'),
    };
  };

  // Funcion para subir al Backend
  const uploadMetadataToBackend = async (jsonUrl, jsonCID, tableCode) => {
    try {
      const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/from-ipfs`;
      //console.log('[PhotoConfirmation] uploadMetadataToBackend start', {backendUrl, jsonUrl, jsonCID, tableCode});
      const payload = {
        ipfsUri: String(jsonUrl),
        recordId: String(jsonCID),
        tableIdIpfs: 'String',
      };

      const response = await axios.post(backendUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': BACKEND_SECRET,
        },
        timeout: 30000, // 30 segundos timeout
      });

/*       console.log('[PhotoConfirmation] uploadMetadataToBackend response', {
        status: response.status,
        dataPreview: response.data && typeof response.data === 'object' ? { has_id: !!response.data._id } : typeof response.data,
      }); */
      return response.data;
    } catch (error) {
      console.error('[PhotoConfirmation] uploadMetadataToBackend error', {
        message: error?.message,
        response: error?.response ? {status: error.response.status, dataPreview: error.response.data ? (error.response.data._id ? { _id: error.response.data._id } : null) : null} : null,
      });
      throw error;
    }
  };

  // Función para subir el atestiguamiento al backend
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

      //console.log('[PhotoConfirmation] uploadAttestation start', { url, ballotId, isJury });

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': BACKEND_SECRET,
        },
        timeout: 30000, // 30 segundos timeout
      });

      //console.log('[PhotoConfirmation] uploadAttestation response', { status: response.status, dataPreview: response.data ? (response.data._id ? { _id: response.data._id } : null) : null });

      return true;
    } catch (error) {
      //console.error('[PhotoConfirmation] uploadAttestation error', error?.message || error);
      return false;
    }
  };

  const validateWithBackend = async ipfsJsonUrl => {
    try {
      const backendUrl = `${BACKEND_RESULT}/api/v1/ballots/validate-ballot-data`;
      const payload = {
        ipfsUri: ipfsJsonUrl,
        recordId: 'String',
        tableIdIpfs: 'String',
      };
      //console.log('[PhotoConfirmation] validateWithBackend start', { backendUrl, ipfsJsonUrl });

      const response = await axios.post(backendUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': BACKEND_SECRET,
        },
        timeout: 30000,
      });

      //console.log('[PhotoConfirmation] validateWithBackend response', { status: response.status, dataPreview: response.data && typeof response.data === 'object' ? { success: !!response.data.success } : response.data });

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

        //console.error('[PhotoConfirmation] validateWithBackend server error', { status, serverMessage });

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
        idRecinto: tableData?.idRecinto || tableData.locationId,
        tableNumber: tableData?.tableNumber || tableData?.numero || 'N/A',
        tableCode: tableData?.codigo || 'N/A',
        location: tableData?.location || 'Bolivia',
        time: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        // userId: 'current-user-id', // Obtener del estado global
        // userName: 'Usuario Actual', // Obtener del estado global
        time: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        // userId: 'current-user-id', // Obtener del estado global
        // userName: 'Usuario Actual', // Obtener del estado global
        userId: userData?.id || 'unknown',
        userName: userFullName,
        role: 'witness',
      };

      // Preparar datos electorales
      const electoralData = {
        partyResults: partyResults || [],
        voteSummaryResults: voteSummaryResults || [],
      };

      const normalizedVoteSummary = (
        electoralData.voteSummaryResults || []
      ).map(r => {
        if (r.id === 'validos') return {...r, label: 'Votos Válidos'};
        if (r.id === 'nulos') return {...r, label: 'Votos Nulos'};
        if (r.id === 'blancos') return {...r, label: 'Votos en Blanco'};
        return r;
      });

      // Convertir URI a path
      const imagePath = photoUri.startsWith('file://')
        ? photoUri.substring(7)
        : photoUri;

/*       console.log('[PhotoConfirmation] uploadToIPFS start', {
        imagePathPreview: imagePath?.slice(-64),
        additionalDataPreview: { idRecinto: additionalData.idRecinto, tableCode: additionalData.tableCode, tableNumber: additionalData.tableNumber, userId: additionalData.userId },
        electoralDataPreview: { partyResults: (electoralData.partyResults || []).length, voteSummaryResults: (electoralData.voteSummaryResults || []).length },
      }); */

      // Subir imagen y crear metadata completa
      const startIpfs = Date.now();
      const result = await pinataService.uploadElectoralActComplete(
        imagePath,
        aiAnalysis || {},
        {...electoralData, voteSummaryResults: normalizedVoteSummary},
        additionalData,
      );
      const ipfsDuration = Date.now() - startIpfs;

      //console.log('[PhotoConfirmation] uploadToIPFS result', { success: !!result.success, ipfsDuration });

      if (result.success) {
        //console.log('[PhotoConfirmation] uploadToIPFS returning data preview', { jsonUrl: result.data?.jsonUrl, imageUrl: result.data?.imageUrl });
        return result.data;
      } else {
        console.error('[PhotoConfirmation] uploadToIPFS failed result:', result);
        throw new Error(result.error || 'uploadToIPFS failed');
      }
    } catch (error) {
      console.error('[PhotoConfirmation] uploadToIPFS error', error);
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
    const net = await NetInfo.fetch();
    const online = !!(net.isConnected && (net.isInternetReachable ?? true));
    if (!online) {
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

      const persistedUri = await persistLocalImage(photoUri);
      const additionalData = {
        idRecinto: String(locationId ?? ''),
        locationId: String(locationId ?? ''),
        tableNumber: String(tableNumber),
        tableCode: String(tableCode),
        location: tableData?.location || 'Bolivia',
        
        userId: userData?.id || 'unknown',
        userName: userFullName,
        role: 'witness',
      };
      const electoralData = {
        partyResults: partyResults || [],
        voteSummaryResults: voteSummaryResults || [],
      };
      //console.log(tableData);

      //console.log('[TABLE-DATA]');

      //console.log(locationId);
      //console.log(tableNumber);
      //console.log(electoralData);
      //console.log(additionalData);

      await enqueue({
        type: 'publishActa',
        payload: {
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
        },
      });
      setShowConfirmModal(false);
      setStep(0);
      navigation.replace('OfflinePendingScreen');
      return;
    }
    setStep(1);

    try {
      // 1. Subir a IPFS
      const ipfsResult = await uploadToIPFS();
      setIpfsData(ipfsResult);

      // 2. Validar con el nuevo endpoint
      await validateWithBackend(ipfsResult.jsonUrl);

      // 3. Obtener datos necesarios para blockchain
      const privateKey = userData?.privKey;

      // 4. Crear NFT en blockchain
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
          oracleCalls.requestRegister(CHAIN, ipfsResult.imageUrl),
        );

        isRegistered = await oracleReads.isRegistered(
          CHAIN,
          userData.account,
          20,
        );

        if (!isRegistered) {
          throw Error('Failed to register user on oracle');
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
            tableData.codigo,
            ipfsResult.jsonUrl,
          ),
          oracleReads.waitForOracleEvent,
          'AttestationCreated',
        );
      } catch (error) {
        const message = error.message;
        //check if attestation is already created
        if (message.indexOf('416c72656164792063726561746564') >= 0) {
          response = await executeOperation(
            privateKey,
            userData.account,
            CHAIN,
            oracleCalls.attest(
              CHAIN,
              tableData.codigo,
              BigInt(0),
              ipfsResult.jsonUrl,
            ),
            oracleReads.waitForOracleEvent,
            'Attested',
          );
        } else {
          throw error;
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

      // 5. Subir Metadata al backend
      const uploadedBackendData = await uploadMetadataToBackend(
        ipfsResult.jsonUrl,
        nftResult.nftId,
        String(tableData.idRecinto),
      );

      if (uploadedBackendData._id) {
        const attestationSuccess = await uploadAttestation(
          uploadedBackendData._id,
        );

        if (!attestationSuccess) {
        }
      } else {
      }

      // 6. Navegar a pantalla de éxito con datos de IPFS
      navigation.navigate('SuccessScreen', {
        ipfsData: ipfsResult,
        nftData: nftResult,
        tableData: tableData,
      });
    } catch (error) {
      console.error('[PhotoConfirmation] confirmPublishAndCertify error', error);
      let message = error.message;
      if (message.includes('Validation Error')) {
        message = I18nStrings.validationError;
      } else if (message.includes('Invalid data')) {
        message = I18nStrings.invalidActaData;
      } else if (
        error.message.indexOf('616c7265616479206174746573746564') >= 0
      ) {
        message = I18nStrings.alreadyAttested;
      } else if (error.message.indexOf('416c72656164792063726561746564') >= 0) {
        message = I18nStrings.alreadyCreated;
      }
      setInfoModalData({
        visible: true,
        title: I18nStrings.genericError,
        message,
      });
    } finally {
      setShowConfirmModal(false);
      setStep(0);
    }

    //try {
    //  // Simular procesamiento
    //  setTimeout(() => {
    //    setShowConfirmModal(false);
    //    setStep(0);
    //    // Navegar directamente a SuccessScreen en lugar de mostrar modal
    //    navigation.navigate('SuccessScreen');
    //  }, 2000);
    //} catch (error) {
    //  // Navegar a SuccessScreen incluso en caso de error
    //  setTimeout(() => {
    //    setShowConfirmModal(false);
    //    setStep(0);
    //    navigation.navigate('SuccessScreen');
    //  }, 1000);
    //}

    //try {
    //  // Simular procesamiento
    //  setTimeout(() => {
    //    setShowConfirmModal(false);
    //    setStep(0);
    //    // Navegar directamente a SuccessScreen en lugar de mostrar modal
    //    navigation.navigate('SuccessScreen');
    //  }, 2000);
    //} catch (error) {
    //  // Navegar a SuccessScreen incluso en caso de error
    //  setTimeout(() => {
    //    setShowConfirmModal(false);
    //    setStep(0);
    //    navigation.navigate('SuccessScreen');
    //  }, 1000);
    //}
  };

  const closeModal = (goBack = false) => {
    setShowConfirmModal(false);
    setStep(0);
    if (goBack) navigation.goBack();
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
        title={`Mesa ${
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
          'DEBUG-EMPTY' // Changed to make it clear data is missing
        }`}
        showNotification={true}
        onNotificationPress={() => {
          // Handle notification press
        }}
      />

      {/* Information Ready to Load Text */}
      <View testID="photoConfirmationInfoContainer" style={styles.infoContainer}>
        <CText testID="photoConfirmationInfoText" style={styles.infoText}>{I18nStrings.infoReadyToLoad}</CText>
      </View>

      {/* Main Content */}
      <View testID="photoConfirmationContent" style={styles.content}>
        {!showConfirmModal && !showDuplicateModal && (
          <>
            <CText testID="photoConfirmationMainText" style={styles.mainText}>
              {I18nStrings.i}
              <CText testID="photoConfirmationUserName" style={styles.mainTextBold}> {userFullName}</CText>
            </CText>

            <TouchableOpacity
              testID="photoConfirmationPublishButton"
              style={styles.publishButton}
              onPress={verifyAndUpload}>
              <CText testID="photoConfirmationPublishButtonText" style={styles.publishButtonText}>
                {I18nStrings.publishAndCertify}
              </CText>
            </TouchableOpacity>
          </>
        )}
        <CText testID="photoConfirmationText" style={styles.confirmationText}>
          {I18nStrings.actaCorrectConfirmation
            .replace(
              '{tableNumber}',
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
                'DEBUG-EMPTY', // Changed to make it clear data is missing
            )
            .replace(
              '{location}',
              tableData?.recinto ||
                tableData?.ubicacion ||
                tableData?.location ||
                tableData?.venue ||
                mesaData?.recinto ||
                mesaData?.ubicacion ||
                mesa?.recinto ||
                mesa?.ubicacion ||
                I18nStrings.locationNotAvailable,
            )}
        </CText>
      </View>

      <Modal
        testID="photoConfirmationModal"
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => closeModal(true)}>
        <View testID="photoConfirmationModalOverlay" style={modalStyles.modalOverlay}>
          <View testID="photoConfirmationModalContainer" style={modalStyles.modalContainer}>
            {step === 0 && (
              <>
                <View testID="photoConfirmationModalWarningIcon" style={modalStyles.iconCircleWarning}>
                  <Ionicons
                    name="alert-outline"
                    size={getResponsiveSize(36, 48, 60)}
                    color="#da2a2a"
                  />
                </View>

                <CText testID="photoConfirmationModalBody" style={modalStyles.confirmBody}>
                  <CText testID="photoConfirmationModalUserName" style={modalStyles.boldText}>Yo {userFullName}</CText>
                  {'\n'}
                  Certifico que los datos que ingreso coinciden con la foto del
                  acta de la mesa y declaro que no he{' '}
                  <CText style={modalStyles.boldText}>
                    inventado ni modificado
                  </CText>{' '}
                  información.
                </CText>
                <View testID="photoConfirmationModalButtonContainer" style={modalStyles.buttonContainer}>
                  <TouchableOpacity
                    testID="photoConfirmationModalCancelButton"
                    style={modalStyles.cancelButton}
                    onPress={() => closeModal(true)}>
                    <CText testID="photoConfirmationModalCancelText" style={modalStyles.cancelButtonText}>
                      {I18nStrings.cancel}
                    </CText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="photoConfirmationModalConfirmButton"
                    style={modalStyles.confirmButton}
                    onPress={confirmPublishAndCertify}>
                    <CText testID="photoConfirmationModalConfirmText" style={modalStyles.confirmButtonText}>
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
                <CText testID="photoConfirmationModalLoadingTitle" style={modalStyles.loadingTitle}>
                  {I18nStrings.pleaseWait}
                </CText>
                <CText testID="photoConfirmationModalLoadingSubtext" style={modalStyles.loadingSubtext}>
                  {I18nStrings.savingToBlockchain}
                </CText>
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
        <View testID="photoConfirmationDuplicateModalOverlay" style={modalStyles.modalOverlay}>
          <View testID="photoConfirmationDuplicateModalContainer" style={modalStyles.modalContainer}>
            <View testID="photoConfirmationDuplicateModalWarningIcon" style={modalStyles.iconCircleWarning}>
              <Ionicons
                name="warning-outline"
                size={getResponsiveSize(36, 48, 60)}
                color="#FFA000"
              />
            </View>
            <View style={modalStyles.spacer} />
            <CText testID="photoConfirmationDuplicateModalTitle" style={modalStyles.confirmTitle}>
              {I18nStrings.duplicateBallotTitle}
            </CText>

            <CText testID="photoConfirmationDuplicateModalMessage" style={modalStyles.duplicateMessage}>
              {I18nStrings.duplicateBallotMessage}
            </CText>

            <View testID="photoConfirmationDuplicateModalButtonContainer" style={modalStyles.buttonContainer}>
              <TouchableOpacity
                testID="photoConfirmationDuplicateModalGoBackButton"
                style={[modalStyles.cancelButton, {flex: 1}]}
                onPress={() => setShowDuplicateModal(false)}>
                <CText testID="photoConfirmationDuplicateModalGoBackText" style={modalStyles.cancelButtonText}>
                  {I18nStrings.goBack}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <InfoModal testID="photoConfirmationInfoModal" {...infoModalData} onClose={closeInfoModal} />
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
    shadowOffset: {width: 0, height: 4},
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
    transform: [{scale: getResponsiveSize(0.8, 1, 1.2)}],
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for the entire screen
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveSize(12, 16, 24),
    paddingBottom: getResponsiveSize(8, 12, 16),
    marginTop: 0,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  infoText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#868686',
    fontWeight: '500',
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
    shadowOffset: {width: 0, height: 2},
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
