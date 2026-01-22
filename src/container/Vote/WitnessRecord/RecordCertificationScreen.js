import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import UniversalHeader from '../../../components/common/UniversalHeader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';
import i18nString from '../../../i18n/String';
import nftImage from '../../../assets/images/nft-medal.png';
import {executeOperation} from '../../../api/account';
import {CHAIN, BACKEND_RESULT, BACKEND_SECRET} from '@env';
import {oracleCalls, oracleReads} from '../../../api/oracle';
import InfoModal from '../../../components/modal/InfoModal';
import {availableNetworks} from '../../../api/params';
import axios from 'axios';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Responsive helper functions
const isTablet = SCREEN_WIDTH >= 768;
const isSmallPhone = SCREEN_WIDTH < 375;
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const RecordCertificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {recordId, tableData, mesaInfo} = route.params || {};

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);
  const [showNFTCertificate, setShowNFTCertificate] = useState(false);
  const [infoModalData, setInfoModalData] = useState({
    visible: false,
    title: '',
    message: '',
  });

  // Obtener nombre real del usuario desde Redux
  const userData = useSelector(state => state.wallet.payload);
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || {};
  const data = {
    name: subject.fullName || '(sin nombre)',
  };
  const currentUser = {
    name: data.name || '(sin nombre)',
    role: 'Testigo Electoral',
  };

  const handleBack = () => {
    navigation.goBack();
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
       
        },
        timeout: 30000, // 30 segundos timeout
      });

      return true;
    } catch (error) {


      return false;
    }
  };

  const handleCertify = () => {
    setStep(0);
    setShowConfirmModal(true);
  };

  const confirmCertification = async () => {
    setStep(1);

    try {
      const isRegistered = await oracleReads.isRegistered(
        CHAIN,
        userData.account,
        1,
      );

      if (!isRegistered) {
        await executeOperation(
          userData.privKey,
          userData.account,
          CHAIN,
          oracleCalls.requestRegister(CHAIN, ''),
        );

        const isRegistered = await oracleReads.isRegistered(
          CHAIN,
          userData.account,
          20,
        );

        if (!isRegistered) {
          throw Error(i18nString.oracleRegisterFail);
        }
      }
      const response = await executeOperation(
        userData.privKey,
        userData.account,
        CHAIN,
        oracleCalls.attest(CHAIN, tableData.codigo, recordId),
        oracleReads.waitForOracleEvent,
        'Attested',
      );

      if (mesaInfo._id) {
        const uploadSuccess = await uploadAttestation(mesaInfo._id);
        if (!uploadSuccess) {
          setInfoModalData({
            visible: true,
            title: 'Advertencia',
            message:
              'Certificación completada en blockchain pero no se pudo registrar los datos',
          });
        }
      } else {
      }

      setShowConfirmModal(false);
      setStep(0);
      // Show NFT modal directly instead of navigating to SuccessScreen
      setShowNFTCertificate(true);
    } catch (error) {
      setShowConfirmModal(false);
      let message = error.message;
      if (error.message.indexOf('616c7265616479206174746573746564') >= 0) {
        message = i18nString.alreadyAttested;
      }
      setInfoModalData({
        visible: true,
        title: i18nString.error,
        message,
      });
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
    <CSafeAreaView testID="recordCertificationContainer" style={styles.container}>
      {/* Header */}
      <UniversalHeader
        testID="recordCertificationHeader"
        colors={colors}
        onBack={handleBack}
        title={`${i18nString.table || 'Mesa'} ${
          tableData?.tableNumber ||
          tableData?.numero ||
          tableData?.number ||
          'N/A'
        }`}
        showNotification={true}
      />

      <ScrollView testID="recordCertificationScrollView" style={styles.content} showsVerticalScrollIndicator={false}>
        {/* For tablet landscape, use a more optimized layout */}
        {isTablet && isLandscape ? (
          <View testID="tabletLandscapeContainer" style={styles.tabletLandscapeContainer}>
            {/* Left side: Certification message */}
            <View testID="tabletLeftColumn" style={styles.leftColumn}>
              <View testID="tabletCertificationContainer" style={styles.certificationContainer}>
                <CText testID="tabletCertificationTitle" style={styles.certificationTitle}>
                  {i18nString.actaCertification}
                </CText>
                <CText testID="tabletCertificationText" style={styles.certificationText}>
                  {(i18nString.certificationText || '')
                    .replace('{userName}', currentUser.name || '')
                    .replace('{userRole}', currentUser.role || '')
                    .replace(
                      '{tableNumber}',
                      tableData?.tableNumber ||
                        tableData?.numero ||
                        tableData?.number ||
                        'N/A',
                    )}
                </CText>
              </View>
            </View>

            {/* Right side: Action button */}
            <View testID="tabletRightColumn" style={styles.rightColumn}>
              <View testID="tabletActionButtons" style={styles.actionButtons}>
                <TouchableOpacity
                  testID="tabletCertifyButton"
                  style={styles.certifyButton}
                  onPress={handleCertify}>
                  <CText testID="tabletCertifyButtonText" style={styles.certifyButtonText}>
                    {i18nString.certify}
                  </CText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Regular Layout: Phones and Tablet Portrait */
          <>
            <View testID="certificationContainer" style={styles.certificationContainer}>
              <CText testID="certificationTitle" style={styles.certificationTitle}>
                {i18nString.actaCertification}
              </CText>
              <CText testID="certificationText" style={styles.certificationText}>
                {(i18nString.certificationText || '')
                  .replace('{userName}', currentUser.name || '')
                  .replace('{userRole}', currentUser.role || '')
                  .replace(
                    '{tableNumber}',
                    tableData?.tableNumber ||
                      tableData?.numero ||
                      tableData?.number ||
                      'N/A',
                  )
                  .replace('{recinto}', tableData?.recinto || '')}
              </CText>
            </View>

            <View testID="actionButtons" style={styles.actionButtons}>
              <TouchableOpacity
                testID="certifyButton"
                style={styles.certifyButton}
                onPress={handleCertify}>
                <CText testID="certifyButtonText" style={styles.certifyButtonText}>
                  {i18nString.certify}
                </CText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        testID="confirmModal"
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View testID="confirmModalOverlay" style={modalStyles.modalOverlay}>
          <View testID="confirmModalContainer" style={modalStyles.modalContainer}>
            {step === 0 && (
              <>
                <View testID="warningIconContainer" style={modalStyles.iconCircleWarning}>
                  <Ionicons
                    testID="warningIcon"
                    name="alert-outline"
                    size={getResponsiveSize(40, 48, 56)}
                    color="#da2a2a"
                  />
                </View>
                <View testID="modalSpacer" style={modalStyles.spacer} />
                <CText testID="confirmCertificationTitle" style={modalStyles.confirmTitle}>
                  {i18nString.certifyInfoConfirmation}
                </CText>
                <View testID="modalButtonContainer" style={modalStyles.buttonContainer}>
                  <TouchableOpacity
                    testID="cancelCertificationButton"
                    style={modalStyles.cancelButton}
                    onPress={closeModal}>
                    <CText testID="cancelCertificationButtonText" style={modalStyles.cancelButtonText}>
                      {i18nString.cancel}
                    </CText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="confirmCertificationButton"
                    style={modalStyles.confirmButton}
                    onPress={confirmCertification}>
                    <CText testID="confirmCertificationButtonText" style={modalStyles.confirmButtonText}>
                      {i18nString.certify}
                    </CText>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 1 && (
              <>
                <ActivityIndicator
                  testID="certificationLoadingIndicator"
                  size={isTablet ? 'large' : 'large'}
                  color="#193b5e"
                  style={modalStyles.loading}
                />
                <CText testID="loadingTitle" style={modalStyles.loadingTitle}>
                  {i18nString.pleaseWait}
                </CText>
                <CText testID="loadingSubtext" style={modalStyles.loadingSubtext}>
                  {i18nString.savingToBlockchain}
                </CText>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal NFT Certificate */}
      {showNFTCertificate && (
        <View testID="nftModalOverlay" style={nftModalStyles.nftModalOverlay}>
          <View testID="nftCertificate" style={nftModalStyles.nftCertificate}>
            {/* Borde decorativo */}
            <View testID="nftCertificateBorder" style={nftModalStyles.certificateBorder}>
              {/* Medallón NFT */}
              <View testID="nftMedalContainer" style={nftModalStyles.medalContainer}>
                <Image
                  testID="nftMedalImage"
                  source={nftImage}
                  style={nftModalStyles.medalImage}
                  resizeMode="contain"
                />
                <CText testID="nftMedalText" style={nftModalStyles.nftMedalText}>NFT</CText>
              </View>
              {/* Datos del certificado */}
              <CText testID="nftUserName" style={nftModalStyles.nftName}>{currentUser.name}</CText>
              <CText testID="nftCertTitle1" style={nftModalStyles.nftCertTitle}>CERTIFICADO DE</CText>
              <CText testID="nftCertTitle2" style={nftModalStyles.nftCertTitle}>
                PARTICIPACIÓN ELECTORAL
              </CText>
              <CText testID="nftCertDetail1" style={nftModalStyles.nftCertDetail}>
                ELECCIONES GENERALES
              </CText>
              <CText testID="nftCertDetail2" style={nftModalStyles.nftCertDetail}>BOLIVIA 2025</CText>
            </View>
            {/* Cerrar */}
            <TouchableOpacity
              testID="closeNFTModalButton"
              onPress={closeNFTModal}
              style={nftModalStyles.closeModalBtn}>
              <CText testID="closeNFTModalText" style={nftModalStyles.closeModalText}>Cerrar</CText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <InfoModal testID="recordCertificationInfoModal" {...infoModalData} onClose={closeInfoModal} />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  // Tablet Landscape Layout
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: getResponsiveSize(20, 24, 32),
  },
  leftColumn: {
    flex: 0.65,
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  rightColumn: {
    flex: 0.35,
    paddingLeft: getResponsiveSize(16, 20, 24),
    justifyContent: 'center',
  },
  certificationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: getResponsiveSize(10, 12, 14),
    padding: getResponsiveSize(16, 18, 22),
    marginBottom: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(8, 12, 16),
  },
  certificationTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: getResponsiveSize(10, 12, 16),
    textAlign: 'center',
  },
  certificationText: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#2F2F2F',
    lineHeight: getResponsiveSize(20, 24, 28),
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: '700',
    color: '#459151',
  },
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    padding: getResponsiveSize(6, 8, 10),
    marginBottom: getResponsiveSize(14, 16, 18),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: getResponsiveSize(160, 200, 240),
    borderRadius: getResponsiveSize(3, 4, 5),
  },
  cornerBorder: {
    position: 'absolute',
    width: getResponsiveSize(16, 20, 24),
    height: getResponsiveSize(16, 20, 24),
    borderColor: '#2F2F2F',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: getResponsiveSize(6, 8, 10),
    left: getResponsiveSize(6, 8, 10),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: getResponsiveSize(6, 8, 10),
    right: getResponsiveSize(6, 8, 10),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: getResponsiveSize(6, 8, 10),
    left: getResponsiveSize(6, 8, 10),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: getResponsiveSize(6, 8, 10),
    right: getResponsiveSize(6, 8, 10),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  partyTableContainer: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    marginBottom: getResponsiveSize(14, 16, 18),
    elevation: 2,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000',
  },
  partyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0F2F7',
    paddingHorizontal: getResponsiveSize(14, 16, 18),
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderTopLeftRadius: getResponsiveSize(6, 8, 10),
    borderTopRightRadius: getResponsiveSize(6, 8, 10),
  },
  partyTableHeaderLeft: {
    flex: 1,
    fontSize: getResponsiveSize(12, 14, 16),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'left',
  },
  partyTableHeaderCenter: {
    flex: 1,
    fontSize: getResponsiveSize(12, 14, 16),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
  },
  partyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(14, 16, 18),
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  partyNameText: {
    flex: 1,
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  partyVoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyVoteText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  voteSummaryTableContainer: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(6, 8, 10),
    marginBottom: getResponsiveSize(20, 24, 28),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: getResponsiveSize(10, 12, 14),
  },
  voteSummaryTableTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(14, 16, 18),
  },
  voteSummaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(14, 16, 18),
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  voteSummaryLabel: {
    flex: 1,
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  voteSummaryValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteSummaryValue: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  actionButtons: {
    marginBottom: getResponsiveSize(24, 32, 40),
  },
  certifyButton: {
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(14, 16, 20),
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
  },
  certifyButtonText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#fff',
  },
  // These modal styles are deprecated - using modalStyles export instead
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(24, 28, 32),
    marginHorizontal: getResponsiveSize(32, 40, 48),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  modalTitle: {
    fontSize: getResponsiveSize(20, 22, 26),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: getResponsiveSize(12, 16, 20),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#2F2F2F',
    textAlign: 'center',
    lineHeight: getResponsiveSize(22, 26, 30),
    marginBottom: getResponsiveSize(24, 28, 32),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 16, 20),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '600',
    color: '#fff',
  },
});
export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: getResponsiveSize(
      SCREEN_WIDTH - 40,
      SCREEN_WIDTH > 400 ? 340 : SCREEN_WIDTH - 40,
      SCREEN_WIDTH > 600 ? 400 : SCREEN_WIDTH - 80,
    ),
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(18, 22, 26),
    paddingVertical: getResponsiveSize(24, 32, 40),
    paddingHorizontal: getResponsiveSize(20, 24, 30),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircleWarning: {
    width: getResponsiveSize(50, 60, 70),
    height: getResponsiveSize(50, 60, 70),
    borderRadius: getResponsiveSize(25, 30, 35),
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#da2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  confirmTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#2F2F2F',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 0,
  },
  spacer: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 16, 20),
    marginTop: getResponsiveSize(20, 24, 28),
  },
  loading: {
    marginBottom: getResponsiveSize(14, 18, 22),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBCBCB',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(7, 9, 11),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#2F2F2F',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#459151',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(7, 9, 11),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#fff',
    fontWeight: '600',
  },
  loadingTitle: {
    fontSize: getResponsiveSize(15, 17, 19),
    color: '#2F2F2F',
    marginBottom: getResponsiveSize(4, 6, 8),
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#868686',
    textAlign: 'center',
    marginTop: getResponsiveSize(2, 4, 6),
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

export default RecordCertificationScreen;
