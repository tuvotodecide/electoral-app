/**
 * Camera Scanner Modal
 *
 * Modal reusable para mostrar la vista de camara (expo-camera)
 * y escanear codigos QR dentro del flujo de votacion.
 */

import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CameraView } from 'expo-camera';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import I18nStrings from '../../../i18n/String';
import { useSelector } from 'react-redux';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onClose
 * @param {(result: Object) => void} [props.onBarcodeScanned]
 * @param {boolean} [props.hasPermission]
 * @param {() => void} [props.onRequestPermission]
 * @param {string[]} [props.barcodeTypes]
 * @param {string} [props.title]
 * @param {string} [props.permissionTitle]
 * @param {string} [props.permissionDescription]
 */
const CameraScannerModal = ({
  visible,
  onClose,
  onBarcodeScanned,
  hasPermission,
  onRequestPermission,
  barcodeTypes = ['qr'],
  title = I18nStrings.scanQrTitle,
  permissionTitle = I18nStrings.scanQrPermissionTitle,
  permissionDescription = I18nStrings.scanQrPermissionMessage,
}) => {
  const colors = useSelector(state => state.theme.theme);
  const shouldShowPermissionView = !hasPermission;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={{...styles.modalContainer, borderColor: colors.background}}>
          <View style={{...styles.header, backgroundColor: colors.background}}>
            <CText type="B16" style={styles.title}>
              {title}
            </CText>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.85}
              testID="cameraModalCloseButton"
            >
              <Ionicons name="close" size={moderateScale(20)} color={colors.text} />
            </TouchableOpacity>
          </View>

          {shouldShowPermissionView ? (
            <View style={{...styles.permissionContainer, backgroundColor: colors.background}}>
              <Ionicons
                name="camera-outline"
                size={moderateScale(36)}
                color="#6B7280"
                style={styles.permissionIcon}
              />
              <CText type="B16" style={styles.permissionTitle}>
                {permissionTitle}
              </CText>
              <CText type="R14" style={styles.permissionDescription}>
                {permissionDescription}
              </CText>

              {!!onRequestPermission && (
                <TouchableOpacity
                  onPress={onRequestPermission}
                  style={{...styles.permissionButton, backgroundColor: colors.primary}}
                  activeOpacity={0.85}
                  testID="cameraModalPermissionButton"
                >
                  <CText type="B14" style={styles.permissionButtonText} color={colors.white}>
                    Conceder permiso
                  </CText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes }}
                onBarcodeScanned={onBarcodeScanned}
              />

              <View pointerEvents="none" style={styles.scanGuideContainer}>
                <View style={{...styles.scanGuide, borderColor: colors.primary}} />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: moderateScale(16),
  },
  modalContainer: {
    width: screenWidth * 0.92,
    maxWidth: moderateScale(420),
    overflow: 'hidden',
  },
  header: {
    minHeight: moderateScale(56),
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  closeButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: moderateScale(12),
  },
  cameraContainer: {
    height: screenHeight * 0.5,
  },
  camera: {
    height: screenHeight * 0.5,
  },
  scanGuideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanGuide: {
    width: moderateScale(220),
    height: moderateScale(220),
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(3),
  },
  permissionContainer: {
    minHeight: moderateScale(260),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIcon: {
    marginBottom: moderateScale(10),
  },
  permissionTitle: {
    // color: '#111827',
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: moderateScale(8),
  },
  permissionDescription: {
    // color: '#4B5563',
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  permissionButton: {
    // backgroundColor: '#10B981',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
  },
  permissionButtonText: {
    // color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});

export default CameraScannerModal;