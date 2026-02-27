/**
 * Election Card Component
 *
 * Card principal que se muestra en Home cuando ENABLE_UNIVERSITY_ELECTION = true
 * Reutiliza estilos existentes del repo.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS, MOCK_ELECTION } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helpers (matching HomeScreen pattern)
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

/**
 * @param {Object} props
 * @param {boolean} props.hasVoted - Si el usuario ya votó
 * @param {boolean} props.voteSynced - Si el voto ya fue sincronizado
 * @param {() => void} props.onVotePress - Handler para botón "Votar ahora"
 * @param {() => void} props.onDetailsPress - Handler para botón "Ver detalles"
 * @param {Object} [props.election] - Datos de la elección (opcional, usa mock si no se provee)
 */
const ElectionCard = ({
  hasVoted = false,
  voteSynced = false,
  onVotePress,
  onDetailsPress,
  election = MOCK_ELECTION,
}) => {
  const colors = useSelector((state) => state.theme.theme);

  const getButtonConfig = () => {
    if (!hasVoted) {
      return {
        title: UI_STRINGS.voteNow,
        disabled: false,
        onPress: onVotePress,
      };
    }

    if (!voteSynced) {
      return {
        title: UI_STRINGS.inProgress,
        disabled: true,
        onPress: () => {},
      };
    }

    return {
      title: UI_STRINGS.viewDetails,
      disabled: false,
      onPress: onDetailsPress,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <View style={styles.container}>
      {/* Header: Título + Badge */}
      <View style={styles.header}>
        <CText type="B18" style={styles.title}>
          {election.title}
        </CText>
        <View style={styles.badge}>
          <CText type="B12" style={styles.badgeText}>
            {election.status}
          </CText>
        </View>
      </View>

      {/* Aviso de cierre o mensaje post-voto */}
      {hasVoted ? (
        <View style={styles.votedMessageContainer}>
          <View style={styles.greenDot} />
          <CText type="M14" style={styles.votedMessage}>
            {UI_STRINGS.alreadyVoted}
          </CText>
        </View>
      ) : (
        <View style={styles.closesContainer}>
          <View style={styles.redDot} />
          <CText type="S14" style={styles.closesText}>
            {election.closesInLabel}
          </CText>
        </View>
      )}

      {/* Nombre del instituto */}
      {!hasVoted && (
        <CText type="R14" style={styles.instituteName}>
          {election.instituteName}
        </CText>
      )}

      {/* Botón de acción */}
      <CButton
        title={buttonConfig.title}
        type="B16"
        disabled={buttonConfig.disabled}
        onPress={buttonConfig.onPress}
        containerStyle={[
          styles.button,
          hasVoted && voteSynced && styles.buttonVoted,
        ]}
        sinMargen
        testID="electionCardButton"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: getResponsiveSize(16, 20, 24),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Badge a la derecha
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  title: {
    color: '#232323',
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(4), // Menos borderRadius
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderWidth: 1,
    borderColor: '#41A44D',
  },
  badgeText: {
    color: '#41A44D',
    fontSize: getResponsiveSize(10, 11, 12),
    fontWeight: '700',
  },
  closesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE', // Fondo rojo claro
    borderRadius: moderateScale(20),
    paddingVertical: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(6, 8, 10),
    alignSelf: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E72F2F',
    marginRight: 6,
  },
  closesText: {
    color: '#E72F2F',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '600',
  },
  votedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9', // Fondo verde claro
    borderRadius: moderateScale(20),
    paddingVertical: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(12, 14, 16),
    alignSelf: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#41A44D', // Verde
    marginRight: 6,
  },
  votedMessage: {
    color: '#41A44D', // Verde
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  instituteName: {
    color: '#9CA3AF', // Más plomo/gris
    fontSize: getResponsiveSize(13, 14, 15),
    textAlign: 'center',
    marginBottom: getResponsiveSize(14, 16, 18),
  },
  button: {
    marginTop: getResponsiveSize(4, 6, 8),
    height: getHeight(48),
    borderRadius: moderateScale(10),
  },
  buttonVoted: {
    opacity: 0.9,
  },
});

export default ElectionCard;
