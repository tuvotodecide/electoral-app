import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
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
import String from '../../../i18n/String';

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
  const {tableData} = route.params || {};

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);

  // Simulated user data - in real app this would come from authentication
  const currentUser = {
    name: 'Juan Pérez',
    role: 'Testigo Electoral',
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCertify = () => {
    console.log('RecordCertificationScreen - handleCertify called');
    setStep(0);
    setShowConfirmModal(true);
  };

  const confirmCertification = () => {
    console.log('RecordCertificationScreen - confirmCertification called');
    setStep(1);
    // Simulate loading time
    setTimeout(() => {
      console.log('RecordCertificationScreen - navigating to SuccessScreen');
      console.log('StackNav.SuccessScreen value:', StackNav.SuccessScreen);
      console.log('Navigation object:', navigation);
      console.log('Params to send:', {
        successType: 'certify',
        tableData: tableData,
        autoNavigateDelay: 5000,
        showAutoNavigation: true,
      });
      setShowConfirmModal(false);
      setStep(0);
      // Navigate to success screen
      try {
        navigation.navigate(StackNav.SuccessScreen, {
          successType: 'certify',
          tableData: tableData,
          autoNavigateDelay: 3000, // 3 seconds before auto-navigation
          showAutoNavigation: true,
        });
      } catch (error) {
        console.error('Error navigating to SuccessScreen:', error);
        // Fallback navigation
        navigation.navigate('WitnessRecord');
      }
    }, 2000);
  };

  const closeModal = () => {
    setShowConfirmModal(false);
    setStep(0);
  };

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <UniversalHeader
        colors={colors}
        onBack={handleBack}
        title={`${String.table || 'Mesa'} ${tableData?.numero || 'N/A'}`}
        showNotification={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* For tablet landscape, use a more optimized layout */}
        {isTablet && isLandscape ? (
          <View style={styles.tabletLandscapeContainer}>
            {/* Left side: Certification message */}
            <View style={styles.leftColumn}>
              <View style={styles.certificationContainer}>
                <CText style={styles.certificationTitle}>
                  {String.actaCertification}
                </CText>
                <CText style={styles.certificationText}>
                  {(String.certificationText || '')
                    .replace('{userName}', currentUser.name || '')
                    .replace('{userRole}', currentUser.role || '')
                    .replace('{tableNumber}', tableData?.numero)}
                </CText>
              </View>
            </View>

            {/* Right side: Action button */}
            <View style={styles.rightColumn}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.certifyButton}
                  onPress={handleCertify}>
                  <CText style={styles.certifyButtonText}>
                    {String.certify}
                  </CText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Regular Layout: Phones and Tablet Portrait */
          <>
            <View style={styles.certificationContainer}>
              <CText style={styles.certificationTitle}>
                {String.actaCertification}
              </CText>
              <CText style={styles.certificationText}>
                {(String.certificationText || '')
                  .replace('{userName}', currentUser.name || '')
                  .replace('{userRole}', currentUser.role || '')
                  .replace('{tableNumber}', tableData?.numero)}
              </CText>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.certifyButton}
                onPress={handleCertify}>
                <CText style={styles.certifyButtonText}>{String.certify}</CText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

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
                    size={getResponsiveSize(40, 48, 56)}
                    color="#da2a2a"
                  />
                </View>
                <View style={modalStyles.spacer} />
                <CText style={modalStyles.confirmTitle}>
                  {String.certifyInfoConfirmation}
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
                    onPress={confirmCertification}>
                    <CText style={modalStyles.confirmButtonText}>
                      {String.certify}
                    </CText>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {step === 1 && (
              <>
                <ActivityIndicator
                  size={isTablet ? 'large' : 'large'}
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

export default RecordCertificationScreen;
