/**
 * Candidate Card Component
 *
 * Card seleccionable para mostrar candidato.
 * Incluye radio button a la derecha y borde verde + check cuando seleccionado.
 * Soporta candidatos normales y votos especiales (Blanco/Nulo).
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helpers
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

/**
 * @param {Object} props
 * @param {Object} props.candidate - Datos del candidato
 * @param {boolean} props.isSelected - Si está seleccionado
 * @param {() => void} props.onSelect - Handler de selección
 */
const CandidateCard = ({ candidate, isSelected = false, onSelect }) => {
  const colors = useSelector((state) => state.theme.theme);
  const isSpecial = candidate.isSpecial || false;

  // Render para votos especiales (Blanco/Nulo)
  if (isSpecial) {
    const iconName = candidate.specialType === 'blanco' ? 'checkbox-blank-outline' : 'close-box-outline';

    return (
      <TouchableOpacity
        style={[
          styles.containerSpecial,
          isSelected && styles.containerSelected,
          { borderLeftColor: candidate.partyColor },
        ]}
        onPress={onSelect}
        activeOpacity={0.8}
        testID={`candidateCard_${candidate.id}`}
      >
        <View style={styles.contentSpecial}>
          {/* Icono */}
          <View style={[styles.specialIconContainer, { backgroundColor: candidate.partyColor + '20' }]}>
            <MaterialCommunityIcons
              name={iconName}
              size={28}
              color={candidate.partyColor}
            />
          </View>

          {/* Nombre */}
          <CText type="B16" style={[styles.specialName, { color: candidate.partyColor }]}>
            {candidate.partyName}
          </CText>

          {/* Radio button / Check */}
          <View style={styles.radioContainer}>
            {isSelected ? (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              </View>
            ) : (
              <View style={styles.radioCircle} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Render para candidatos normales
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
      testID={`candidateCard_${candidate.id}`}
    >
      {/* Header con nombre del partido */}
      <View style={[styles.partyHeader, { backgroundColor: candidate.partyColor || '#2563EB' }]}>
        <CText type="B14" style={styles.partyName}>
          {candidate.partyName}
        </CText>
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        {/* Avatar / Foto */}
        <View style={styles.avatarContainer}>
          {candidate.avatarUrl ? (
            <Image
              source={{ uri: candidate.avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="#CBD5E1" />
            </View>
          )}
        </View>

        {/* Info del candidato */}
        <View style={styles.info}>
          <CText type="R12" style={styles.label}>
            {UI_STRINGS.president}
          </CText>
          <CText type="B16" style={styles.name}>
            {candidate.presidentName}
          </CText>
          {candidate.viceName ? (
            <>
              <CText type="R12" style={styles.label}>
                {UI_STRINGS.vicePresident}
              </CText>
              <CText type="M14" style={styles.viceName}>
                {candidate.viceName}
              </CText>
            </>
          ) : null}
        </View>

        {/* Radio button / Check */}
        <View style={styles.radioContainer}>
          {isSelected ? (
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.radioCircle} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: getResponsiveSize(12, 16, 20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerSpecial: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    marginBottom: getResponsiveSize(12, 16, 20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerSelected: {
    borderColor: '#41A44D',
    borderWidth: 2,
  },
  partyHeader: {
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(14, 16, 18),
    alignItems: 'center',
  },
  partyName: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(14, 16, 18),
  },
  contentSpecial: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(14, 16, 18),
  },
  specialIconContainer: {
    width: getResponsiveSize(48, 52, 56),
    height: getResponsiveSize(48, 52, 56),
    borderRadius: getResponsiveSize(24, 26, 28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(12, 14, 16),
  },
  specialName: {
    flex: 1,
    fontSize: getResponsiveSize(15, 16, 18),
    fontWeight: '700',
  },
  avatarContainer: {
    marginRight: getResponsiveSize(12, 14, 16),
  },
  avatar: {
    width: getResponsiveSize(56, 64, 72),
    height: getResponsiveSize(56, 64, 72),
    borderRadius: getResponsiveSize(28, 32, 36),
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: getResponsiveSize(56, 64, 72),
    height: getResponsiveSize(56, 64, 72),
    borderRadius: getResponsiveSize(28, 32, 36),
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  label: {
    color: '#64748B',
    fontSize: getResponsiveSize(11, 12, 13),
    marginBottom: 1,
  },
  name: {
    color: '#1F2937',
    fontSize: getResponsiveSize(15, 16, 18),
    fontWeight: '700',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  viceName: {
    color: '#374151',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  radioContainer: {
    marginLeft: getResponsiveSize(8, 10, 12),
  },
  radioCircle: {
    width: getResponsiveSize(24, 28, 32),
    height: getResponsiveSize(24, 28, 32),
    borderRadius: getResponsiveSize(12, 14, 16),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  checkCircle: {
    width: getResponsiveSize(24, 28, 32),
    height: getResponsiveSize(24, 28, 32),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: '#41A44D',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CandidateCard;
