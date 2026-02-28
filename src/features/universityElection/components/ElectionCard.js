/**
 * Election Card Component
 *
 * Card principal que se muestra en Home cuando ENABLE_UNIVERSITY_ELECTION = true
 * Soporta estados: activa, inhabilitado, inicia en, ya votó
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS, MOCK_ELECTION } from '../data/mockData';
import { useCountdown } from '../utils/useCountdown';
import { DEV_FLAGS } from '../../../config/featureFlags';

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
 * @param {boolean} [props.isEligible=true] - Si el usuario está habilitado para votar
 * @param {() => void} props.onVotePress - Handler para botón "Votar ahora"
 * @param {() => void} props.onDetailsPress - Handler para botón "Ver detalles"
 * @param {Object} [props.election] - Datos de la elección (opcional, usa mock si no se provee)
 */
const ElectionCard = ({
  hasVoted = false,
  voteSynced = false,
  isEligible = true,
  onVotePress,
  onDetailsPress,
  election = MOCK_ELECTION,
}) => {
  const colors = useSelector((state) => state.theme.theme);

  // DEV_FLAG: Forzar estado "no habilitado"
  const effectiveIsEligible = DEV_FLAGS.FORCE_NOT_ELIGIBLE ? false : isEligible;

  // Countdown dinámico
  const { countdownLabel, countdownTime, isStarting, isEnded } = useCountdown(election);

  // Determinar el texto del timer
  const getTimerDisplay = () => {
    if (!DEV_FLAGS.ENABLE_DYNAMIC_COUNTDOWN) {
      return { label: election.closesInLabel, time: '' };
    }

    if (isStarting && countdownTime) {
      return { label: countdownLabel, time: countdownTime };
    }

    return { label: countdownLabel, time: '' };
  };

  const timerDisplay = getTimerDisplay();

  const getButtonConfig = () => {
    // Si no está habilitado, no mostrar botón
    if (!effectiveIsEligible) {
      return null;
    }

    // Si la elección terminó
    if (isEnded && !hasVoted) {
      return {
        title: 'Votación cerrada',
        disabled: true,
        onPress: () => {},
      };
    }

    // Si la elección no ha empezado
    if (isStarting) {
      return {
        title: UI_STRINGS.viewDetails || 'Ver detalle',
        disabled: false,
        onPress: onDetailsPress,
      };
    }

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

  // Renderizar contenido según estado
  const renderStatusContent = () => {
    // Estado: Ya votó
    if (hasVoted) {
      return (
        <View style={styles.votedMessageContainer}>
          <View style={styles.greenDot} />
          <CText type="M14" style={styles.votedMessage}>
            {UI_STRINGS.alreadyVoted}
          </CText>
        </View>
      );
    }

    // Estado: No habilitado
    if (!effectiveIsEligible) {
      return (
        <View style={styles.notEligibleContainer}>
          <View style={styles.redDot} />
          <CText type="M14" style={styles.notEligibleText}>
            Usted no está habilitado{'\n'}para participar en esta{'\n'}votación
          </CText>
        </View>
      );
    }

    // Estado: Inicia en (con countdown HH:MM:SS)
    if (isStarting && timerDisplay.time) {
      return (
        <View style={styles.startsInContainer}>
          <View style={styles.redDot} />
          <CText type="S14" style={styles.startsInLabel}>
            {timerDisplay.label}
          </CText>
          <CText type="B16" style={styles.startsInTime}>
            {timerDisplay.time}
          </CText>
        </View>
      );
    }

    // Estado: Cierra en (normal)
    return (
      <View style={styles.closesContainer}>
        <View style={styles.redDot} />
        <CText type="S14" style={styles.closesText}>
          {timerDisplay.label}
        </CText>
      </View>
    );
  };

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

      {/* Status content (votó, inhabilitado, countdown) */}
      {renderStatusContent()}

      {/* Nombre del instituto - solo si no votó y está habilitado y no está en "inicia en" */}
      {!hasVoted && effectiveIsEligible && !isStarting && (
        <CText type="R14" style={styles.instituteName}>
          {election.instituteName}
        </CText>
      )}

      {/* Botón de acción - solo si está habilitado */}
      {buttonConfig && (
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
      )}
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
    justifyContent: 'space-between',
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
    borderRadius: moderateScale(4),
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
  // Estado: Cierra en
  closesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
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
  // Estado: Inicia en (con HH:MM:SS)
  startsInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  startsInLabel: {
    color: '#374151',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
    marginRight: 6,
  },
  startsInTime: {
    color: '#374151',
    fontSize: getResponsiveSize(15, 16, 18),
    fontWeight: '700',
  },
  // Estado: No habilitado
  notEligibleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: moderateScale(12),
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  notEligibleText: {
    color: '#E72F2F',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: getResponsiveSize(18, 20, 22),
  },
  // Estado: Ya votó
  votedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
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
    backgroundColor: '#41A44D',
    marginRight: 6,
  },
  votedMessage: {
    color: '#41A44D',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  instituteName: {
    color: '#9CA3AF',
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
