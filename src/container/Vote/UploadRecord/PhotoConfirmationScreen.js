import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import MaterialIcons
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import {moderateScale} from '../../../common/constants'; // Assuming this path is correct for your project
import {StackNav} from '../../../navigation/NavigationKey';
import UniversalHeader from '../../../components/common/UniversalHeader';
import String from '../../../i18n/String';
import pinataService from '../../../utils/pinataService';
import nftImage from '../../../assets/images/nft-medal.png';

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
  const mesaData = route.params?.mesaData;
  const mesa = route.params?.mesa;

  console.log('PhotoConfirmationScreen - Received data:', {
    tableData,
    photoUri,
    partyResults,
    voteSummaryResults,
    aiAnalysis,
  });
  console.log('PhotoConfirmationScreen - Alternative data sources:', {
    mesaData,
    mesa,
    allRouteParams: route.params,
  });
  console.log('PhotoConfirmationScreen - tableData debug:', {
    tableData,
    tableNumber: tableData?.tableNumber,
    numero: tableData?.numero,
    number: tableData?.number,
    allKeys: tableData ? Object.keys(tableData) : 'no tableData',
  });
  console.log(
    'PhotoConfirmationScreen - tableData is empty?',
    !tableData || Object.keys(tableData || {}).length === 0,
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);
  const [ipfsData, setIpfsData] = useState(null);
  const [showNFTCertificate, setShowNFTCertificate] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  // Función para subir a IPFS
  const uploadToIPFS = async () => {
    if (!photoUri) {
      console.log('No photo to upload');
      return null;
    }

    setUploadingToIPFS(true);

    try {
      console.log('🚀 Iniciando subida a IPFS...');

      // Preparar datos adicionales
      const additionalData = {
        tableNumber: tableData?.tableNumber || tableData?.numero || 'N/A',
        tableCode: tableData?.tableCode || tableData?.codigo || 'N/A',
        location: tableData?.location || 'Bolivia',
        time: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        userId: 'current-user-id', // Obtener del estado global
        userName: 'Usuario Actual', // Obtener del estado global
        role: 'witness',
      };

      // Preparar datos electorales
      const electoralData = {
        partyResults: partyResults || [],
        voteSummaryResults: voteSummaryResults || [],
      };

      // Convertir URI a path
      const imagePath = photoUri.replace('file://', '');

      // Subir imagen y crear metadata completa
      const result = await pinataService.uploadElectoralActComplete(
        imagePath,
        aiAnalysis || {},
        electoralData,
        additionalData,
      );

      if (result.success) {
        console.log('✅ Subida a IPFS exitosa:', result.data);
        setIpfsData(result.data);
        return result.data;
      } else {
        console.error('❌ Error en subida a IPFS:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error inesperado en subida a IPFS:', error);
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

    try {
      // Simular procesamiento
      setTimeout(() => {
        setShowConfirmModal(false);
        setStep(0);
        // Show NFT modal directly instead of navigating to SuccessScreen
        setShowNFTCertificate(true);
      }, 2000);
    } catch (error) {
      console.error('Error en confirmPublishAndCertify:', error);
      // Show NFT modal even in case of error
      setTimeout(() => {
        setShowConfirmModal(false);
        setStep(0);
        setShowNFTCertificate(true);
      }, 1000);
    }
  };

  const closeModal = () => {
    setShowConfirmModal(false);
    setStep(0);
  };

  const closeNFTModal = () => {
    setShowNFTCertificate(false);
    // Navigate back to home after closing NFT modal
    try {
      navigation.popToTop();
    } catch {
      navigation.navigate('TabNavigation');
    }
  };

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <UniversalHeader
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
      <View style={styles.infoContainer}>
        <CText style={styles.infoText}>{String.infoReadyToLoad}</CText>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <CText style={styles.mainText}>
          {String.i}
          <CText style={styles.mainTextBold}> Juan Perez Cuellar</CText>
        </CText>

        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublishAndCertify}>
          <CText style={styles.publishButtonText}>
            {String.publishAndCertify}
          </CText>
        </TouchableOpacity>

        <CText style={styles.confirmationText}>
          {String.actaCorrectConfirmation
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
                String.locationNotAvailable,
            )}
        </CText>
      </View>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            {step === 0 && (
              <>
                <View style={modalStyles.iconCircleWarning}>
                  <Ionicons
                    name="alert-outline"
                    size={getResponsiveSize(36, 48, 60)}
                    color="#da2a2a"
                  />
                </View>
                <View style={modalStyles.spacer} />
                <CText style={modalStyles.confirmTitle}>
                  {String.publishAndCertifyConfirmation}
                </CText>
                <View style={modalStyles.buttonContainer}>
                  <TouchableOpacity
                    style={modalStyles.cancelButton}
                    onPress={closeModal}>
                    <CText style={modalStyles.cancelButtonText}>
                      {String.cancel}
                    </CText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={modalStyles.confirmButton}
                    onPress={confirmPublishAndCertify}>
                    <CText style={modalStyles.confirmButtonText}>
                      {String.publishAndCertify}
                    </CText>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 1 && (
              <>
                <ActivityIndicator
                  size="large"
                  color="#193b5e"
                  style={modalStyles.loading}
                />
                <CText style={modalStyles.loadingTitle}>
                  {String.pleaseWait}
                </CText>
                <CText style={modalStyles.loadingSubtext}>
                  {String.savingToBlockchain}
                </CText>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal NFT Certificate */}
      {showNFTCertificate && (
        <View style={nftModalStyles.nftModalOverlay}>
          <View style={nftModalStyles.nftCertificate}>
            {/* Borde decorativo */}
            <View style={nftModalStyles.certificateBorder}>
              {/* Medallón NFT */}
              <View style={nftModalStyles.medalContainer}>
                <Image
                  source={nftImage}
                  style={nftModalStyles.medalImage}
                  resizeMode="contain"
                />
                <CText style={nftModalStyles.nftMedalText}>NFT</CText>
              </View>
              {/* Datos del certificado */}
              <CText style={nftModalStyles.nftName}>Usuario Actual</CText>
              <CText style={nftModalStyles.nftCertTitle}>CERTIFICADO DE</CText>
              <CText style={nftModalStyles.nftCertTitle}>
                PARTICIPACIÓN ELECTORAL
              </CText>
              <CText style={nftModalStyles.nftCertDetail}>
                ELECCIONES GENERALES
              </CText>
              <CText style={nftModalStyles.nftCertDetail}>BOLIVIA 2025</CText>
            </View>
            {/* Cerrar */}
            <TouchableOpacity
              onPress={closeNFTModal}
              style={nftModalStyles.closeModalBtn}>
              <CText style={nftModalStyles.closeModalText}>Cerrar</CText>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
});

export default PhotoConfirmationScreen;
