/**
 * Offline Queued Modal
 *
 * Modal que se muestra cuando el voto se guardó localmente (sin conexión).
 * Informa al usuario que se enviará cuando recupere conexión.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onDismiss
 */
const OfflineQueuedModal = ({ visible, onDismiss }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-done-outline" size={moderateScale(48)} color="#F59E0B" />
            </View>
          </View>

          {/* Título */}
          <CText type="B20" style={styles.title}>
            {UI_STRINGS.offlineTitle}
          </CText>

          {/* Mensaje */}
          <CText type="R14" style={styles.message}>
            {UI_STRINGS.offlineMessage}
          </CText>

          {/* Botón */}
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <CText type="B16" style={styles.buttonText}>
              {UI_STRINGS.offlineButton}
            </CText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingTop: moderateScale(32),
    paddingBottom: moderateScale(24),
    paddingHorizontal: moderateScale(24),
    width: screenWidth * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: moderateScale(20),
  },
  iconCircle: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#1F2937',
    fontSize: moderateScale(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  message: {
    color: '#6B7280',
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(24),
    paddingHorizontal: moderateScale(8),
  },
  button: {
    backgroundColor: '#F59E0B',
    width: '100%',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});

export default OfflineQueuedModal;
