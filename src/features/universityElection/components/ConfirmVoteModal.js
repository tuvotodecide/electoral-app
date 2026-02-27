/**
 * Confirm Vote Modal
 *
 * Modal de confirmación de voto.
 * Usa CButton y sigue el estilo del CustomModal existente.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {string} props.presidentName - Nombre del candidato para mostrar
 * @param {string} props.partyName - Nombre del partido
 * @param {string} props.partyColor - Color del partido
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {boolean} [props.isLoading]
 */
const ConfirmVoteModal = ({
  visible,
  presidentName,
  partyName,
  partyColor = '#2563EB',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header con color del partido */}
          <View style={[styles.partyHeader, { backgroundColor: partyColor }]}>
            <CText type="B14" style={styles.partyName}>
              {partyName}
            </CText>
          </View>

          {/* Loading State */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#41A44D" />
              <CText type="M16" style={styles.loadingText}>
                {UI_STRINGS.processing}
              </CText>
              <CText type="R14" style={styles.loadingSubtext}>
                Registrando tu voto de forma segura...
              </CText>
            </View>
          ) : (
            <>
              {/* Icono de check */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark-circle" size={moderateScale(56)} color="#41A44D" />
                </View>
              </View>

              {/* Título */}
              <CText type="B18" style={styles.title}>
                {UI_STRINGS.confirmVoteTitle} {presidentName}?
              </CText>

              {/* Subtexto NFT */}
              <View style={styles.nftBadge}>
                <CText type="R14" style={styles.nftText}>
                  {UI_STRINGS.nftSubtext}
                </CText>
              </View>

              {/* Botones usando CButton */}
              <View style={styles.buttonsContainer}>
                <CButton
                  title={UI_STRINGS.confirmButton}
                  type="B16"
                  onPress={onConfirm}
                  containerStyle={styles.confirmButton}
                  sinMargen
                  testID="confirmVoteButton"
                />

                <CButton
                  title={UI_STRINGS.cancelButton}
                  type="M16"
                  variant="outlined"
                  onPress={onCancel}
                  containerStyle={styles.cancelButton}
                  sinMargen
                  testID="cancelVoteButton"
                />
              </View>
            </>
          )}
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
    overflow: 'hidden',
    width: screenWidth * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  partyHeader: {
    paddingVertical: moderateScale(14),
    alignItems: 'center',
  },
  partyName: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: moderateScale(24),
    marginBottom: moderateScale(16),
  },
  iconCircle: {
    width: moderateScale(88),
    height: moderateScale(88),
    borderRadius: moderateScale(44),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#1F2937',
    fontSize: moderateScale(18),
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: moderateScale(24),
    marginBottom: moderateScale(12),
  },
  nftBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    marginHorizontal: moderateScale(32),
    marginBottom: moderateScale(24),
  },
  nftText: {
    color: '#6B7280',
    fontSize: moderateScale(13),
    textAlign: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(24),
  },
  confirmButton: {
    height: getHeight(52),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  cancelButton: {
    height: getHeight(52),
    borderRadius: moderateScale(12),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
    paddingHorizontal: moderateScale(24),
  },
  loadingText: {
    color: '#1F2937',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginTop: moderateScale(16),
  },
  loadingSubtext: {
    color: '#6B7280',
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginTop: moderateScale(8),
  },
});

export default ConfirmVoteModal;
