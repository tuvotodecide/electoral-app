import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Text,
  ActivityIndicator,
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

const {width: screenWidth} = Dimensions.get('window');

const PhotoConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const colors = useSelector(state => state.theme.theme); // Assuming colors are managed by Redux
  const {mesaData} = route.params || {}; // Destructure mesaData from route params
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [step, setStep] = useState(0);

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePublishAndCertify = () => {
    setStep(0);
    setShowConfirmModal(true);
  };

  const confirmPublishAndCertify = () => {
    setStep(1);
    // Simulate loading time
    setTimeout(() => {
      setStep(2);
      setTimeout(() => {
        setShowConfirmModal(false);
        setStep(0);
        // Navigate back to the main screen
        navigation.navigate(StackNav.TabNavigation, {
          screen: 'HomeScreen',
        });
      }, 2000);
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
        title={`Mesa ${mesaData?.numero || 'N/A'}`}
        showNotification={true}
        onNotificationPress={() => {
          // Handle notification press
        }}
      />

      {/* Information Ready to Load Text */}
      <View style={styles.infoContainer}>
        <CText style={styles.infoText}>Información lista para cargar</CText>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <CText style={styles.mainText}>
          Yo Juan Perez Cuellar.... texto mas amplio
        </CText>
        <CText style={styles.subText}>Yo Juan Perez Cuellar</CText>

        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublishAndCertify}>
          <CText style={styles.publishButtonText}>Publico y Certifico</CText>
        </TouchableOpacity>

        <CText style={styles.confirmationText}>
          que es la ACTA CORRECTA de la mesa {mesaData?.numero || 'N/A'}
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
                  <Ionicons name="alert-outline" size={48} color="#da2a2a" />
                </View>
                <View style={modalStyles.spacer} />
                <Text style={modalStyles.confirmTitle}>
                  ¿Estás seguro de que deseas publicar y certificar la
                  información?
                </Text>
                <View style={modalStyles.buttonContainer}>
                  <TouchableOpacity
                    style={modalStyles.cancelButton}
                    onPress={closeModal}>
                    <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={modalStyles.confirmButton}
                    onPress={confirmPublishAndCertify}>
                    <Text style={modalStyles.confirmButtonText}>
                      Publicar y Certificar
                    </Text>
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
                <Text style={modalStyles.loadingTitle}>
                  Por favor, espere.....
                </Text>
                <Text style={modalStyles.loadingSubtext}>
                  La información se está guardando en la Blockchain
                </Text>
              </>
            )}
            {step === 2 && (
              <>
                <View style={modalStyles.iconCircleSuccess}>
                  <Ionicons name="checkmark" size={48} color="#459151" />
                </View>
                <Text style={modalStyles.successTitle}>
                  ¡Acta Publicada y Certificada Exitosamente!
                </Text>
                <View style={modalStyles.logoContainer}></View>
                <Text style={modalStyles.initiativeText}>
                  Iniciativa voluntaria de:
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </CSafeAreaView>
  );
};

const modalStyles = StyleSheet.create({
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
    width: screenWidth * 0.85,
  },
  iconCircleWarning: {
    backgroundColor: '#fdf4f4',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  iconCircleSuccess: {
    backgroundColor: '#e8f5e9',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  spacer: {
    height: moderateScale(10),
  },
  confirmTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(24),
    lineHeight: moderateScale(24),
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
    width: '100%',
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
  loading: {
    marginBottom: moderateScale(16),
  },
  loadingTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#193b5e',
    marginBottom: moderateScale(8),
  },
  loadingSubtext: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    textAlign: 'center',
  },
  successTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#459151',
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  logoImg: {
    width: 50,
    height: 50,
  },
  initiativeText: {
    fontSize: moderateScale(14),
    color: '#868686',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for the entire screen
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(12),
    marginTop: moderateScale(0),
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#868686',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32), // Increased horizontal padding for content
  },
  mainText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(10),
  },
  subText: {
    fontSize: moderateScale(16),
    fontWeight: 'normal',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  publishButton: {
    backgroundColor: '#4CAF50', // Green color
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(24),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  publishButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
  confirmationText: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    textAlign: 'center',
    lineHeight: moderateScale(24),
  },
});

export default PhotoConfirmationScreen;
