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

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ActaCertificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme);
  const {mesaData} = route.params || {};

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

  const handleCertifico = () => {
    console.log('ActaCertificationScreen - handleCertifico called');
    setStep(0);
    setShowConfirmModal(true);
  };

  const confirmCertification = () => {
    console.log('ActaCertificationScreen - confirmCertification called');
    setStep(1);
    // Simulate loading time
    setTimeout(() => {
      console.log('ActaCertificationScreen - navigating to SuccessScreen');
      console.log('StackNav.SuccessScreen value:', StackNav.SuccessScreen);
      console.log('Navigation object:', navigation);
      console.log('Params to send:', {
        successType: 'certify',
        mesaData: mesaData,
        autoNavigateDelay: 5000,
        showAutoNavigation: true,
      });
      setShowConfirmModal(false);
      setStep(0);
      // Navigate to success screen
      try {
        navigation.navigate(StackNav.SuccessScreen, {
          successType: 'certify',
          mesaData: mesaData,
          autoNavigateDelay: 3000, // 3 segundos antes de auto-navegar
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
        title={`${String.table} ${mesaData?.numero || 'N/A'}`}
        showNotification={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Certification Message */}
        <View style={styles.certificationContainer}>
          <CText style={styles.certificationTitle}>
            {String.actaCertification}
          </CText>
          <CText style={styles.certificationText}>
            {String.certificationText
              .replace('{userName}', currentUser.name)
              .replace('{userRole}', currentUser.role)
              .replace('{tableNumber}', mesaData?.numero || 'N/A')}
          </CText>
        </View>

        {/* Certification Button */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.certifyButton}
            onPress={handleCertifico}>
            <CText style={styles.certifyButtonText}>{String.certify}</CText>
          </TouchableOpacity>
        </View>
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
                  <Ionicons name="alert-outline" size={48} color="#da2a2a" />
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
    paddingHorizontal: moderateScale(16),
  },
  certificationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    marginTop: moderateScale(8),
  },
  certificationTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  certificationText: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    lineHeight: moderateScale(24),
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: '700',
    color: '#459151',
  },
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: moderateScale(200),
    borderRadius: moderateScale(4),
  },
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderColor: '#2F2F2F',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  partyTableContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowColor: '#000',
  },
  partyTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0F2F7',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  partyTableHeaderLeft: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'left',
  },
  partyTableHeaderCenter: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
  },
  partyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  partyNameText: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  partyVoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyVoteText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  voteSummaryTableContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(24),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: moderateScale(12),
  },
  voteSummaryTableTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  voteSummaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  voteSummaryLabel: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#2F2F2F',
  },
  voteSummaryValueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteSummaryValue: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    width: '100%',
  },
  actionButtons: {
    marginBottom: moderateScale(32),
  },
  certifyButton: {
    backgroundColor: '#459151',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  certifyButtonText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    marginHorizontal: moderateScale(32),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(24),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#2F2F2F',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#459151',
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
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
    width: SCREEN_WIDTH > 400 ? 340 : SCREEN_WIDTH - 40,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircleWarning: {
    width: 60,
    height: 60,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#da2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmTitle: {
    fontSize: 18,
    color: '#2F2F2F',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 0,
  },
  spacer: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  loading: {
    marginBottom: 18,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBCBCB',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#2F2F2F',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#459151',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  loadingTitle: {
    fontSize: 17,
    color: '#2F2F2F',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 15,
    color: '#868686',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ActaCertificationScreen;
