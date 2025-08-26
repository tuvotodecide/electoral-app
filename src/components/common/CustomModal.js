import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import CText from './CText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../common/constants';

const { width: screenWidth } = Dimensions.get('window');

const CustomModal = ({
  visible,
  onClose,
  title,
  message,
  type = 'info', // 'success', 'error', 'info', 'warning'
  buttonText = 'Aceptar',
  onButtonPress,
  secondaryButtonText,   // Nueva prop para el botón secundario
  onSecondaryPress       // Nueva prop para la acción secundaria
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle',
          color: '#4F9858',
          backgroundColor: '#E8F5E8',
        };
      case 'error':
        return {
          name: 'close-circle',
          color: '#D32F2F',
          backgroundColor: '#FFEBEE',
        };
      case 'warning':
        return {
          name: 'warning',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
        };
      case 'settings':
        return {
          name: 'settings',
          color: '#4F9858',
          backgroundColor: '#E8F5E9',
        };
      default: // info
        return {
          name: 'information-circle',
          color: '#2196F3',
          backgroundColor: '#E3F2FD',
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconConfig.backgroundColor },
            ]}>
            <Ionicons
              name={iconConfig.name}
              size={moderateScale(48)}
              color={iconConfig.color}
            />
          </View>

          {/* Title */}
          {title && <CText style={styles.title}>{title}</CText>}

          {/* Message */}
          <CText style={styles.message}>{message}</CText>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            {/* Botón secundario (si existe) */}
            {secondaryButtonText && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  { borderColor: iconConfig.color }
                ]}
                onPress={onSecondaryPress || onClose}
                activeOpacity={0.8}
                testID="customModalSecondaryButton">
                <CText
                  style={[
                    styles.buttonText,
                    styles.secondaryButtonText,
                    { color: iconConfig.color }
                  ]}>
                  {secondaryButtonText}
                </CText>
              </TouchableOpacity>
            )}

            {/* Botón primario */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: iconConfig.color },
                // Ajustar márgenes si hay botón secundario
                secondaryButtonText && styles.buttonWithSecondary
              ]}
              onPress={onButtonPress || onClose}
              activeOpacity={0.8}
              testID="customModalPrimaryButton">
              <CText style={styles.buttonText}>{buttonText}</CText>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    maxWidth: screenWidth * 0.9,
    minWidth: screenWidth * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#333', // Color para el texto del botón secundario
  },
  buttonWithSecondary: {
    marginTop: 0, // Eliminar margen adicional si hay botón secundario
  }
});

export default CustomModal;