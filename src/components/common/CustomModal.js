import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView, // <--- 1. Importamos ScrollView
} from 'react-native';
import CText from './CText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { moderateScale } from '../../common/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window'); // <--- 2. Obtenemos el alto de la pantalla

const CustomModal = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Aceptar',
  onButtonPress,
  secondaryButtonText,
  onSecondaryPress,
  secondaryVariant = 'outline',
  tertiaryButtonText,
  onTertiaryPress,
  tertiaryVariant = 'ghost',
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#4F9858', backgroundColor: '#E8F5E8' };
      case 'error':
        return { name: 'close-circle', color: '#D32F2F', backgroundColor: '#FFEBEE' };
      case 'warning':
        return { name: 'warning', color: '#FF9800', backgroundColor: '#FFF3E0' };
      case 'settings':
        return { name: 'settings', color: '#4F9858', backgroundColor: '#E8F5E9' };
      default:
        return { name: 'information-circle', color: '#2196F3', backgroundColor: '#E3F2FD' };
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
        {/* Agregamos maxHeight al contenedor para que no se salga de la pantalla */}
        <View style={[styles.modalContainer, { maxHeight: screenHeight * 0.85 }]}>
          
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

          {/* 3. Envolvemos el mensaje en un ScrollView.
             flexGrow: 0 permite que sea pequeño si hay poco texto, 
             pero haga scroll si hay mucho, sin ocupar espacio innecesario.
          */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true} // Opcional: mantiene la barra visible en Android
          >
            <CText style={styles.message}>{message}</CText>
          </ScrollView>

          {/* Botones - Estos se quedarán fijos abajo gracias al ScrollView de arriba */}
          <View style={styles.buttonsContainer}>
            {tertiaryButtonText && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.tertiaryButton,
                  tertiaryVariant === 'danger' && styles.dangerSolid,
                ]}
                onPress={onTertiaryPress || onClose}
                activeOpacity={0.8}
                testID="customModalTertiaryButton">
                <CText
                  style={[
                    styles.buttonText,
                    styles.tertiaryButtonText,
                    tertiaryVariant === 'danger' && styles.dangerSolidText,
                  ]}>
                  {tertiaryButtonText}
                </CText>
              </TouchableOpacity>
            )}
            
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

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: iconConfig.color },
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
    paddingTop: 30,    // Quitamos paddingBottom global para manejarlo en los botones
    paddingBottom: 24, 
    paddingHorizontal: 24,
    alignItems: 'center',
    maxWidth: screenWidth * 0.9,
    minWidth: screenWidth * 0.8,
    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    flexShrink: 0, // Evita que el icono se aplaste
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2F2F2F',
    textAlign: 'center',
    marginBottom: 12,
    flexShrink: 0, // Evita que el título se aplaste
  },
  // --- Nuevos estilos para el Scroll ---
  scrollView: {
    width: '100%',
    maxHeight: 200, // Altura máxima sugerida para el texto antes de hacer scroll (ajustable)
    marginBottom: 24,
    flexGrow: 0, 
  },
  scrollViewContent: {
    flexGrow: 0,
    alignItems: 'center', // Centra el texto horizontalmente
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    // marginBottom removido de aquí, manejado por el ScrollView
  },
  // -------------------------------------
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto', // Asegura que se mantenga al fondo si hay espacio sobrante
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
    color: '#333',
  },
  buttonWithSecondary: {
    marginTop: 0,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 12,
  },
  tertiaryButtonText: {
    color: '#444',
    fontWeight: '600',
  },
  dangerOutline: {
    borderColor: '#D32F2F',
  },
  dangerSolid: {
    backgroundColor: '#D32F2F',
  },
  dangerSolidText: {
    color: '#fff',
  },
});

export default CustomModal;