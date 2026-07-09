/**
 * Election Card Component
 *
 * Card principal que se muestra en Home cuando el flujo de votación está activo
 * Soporta estados: activa, inhabilitado, inicia en, ya votó
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
 * @param {boolean} [props.resultsAvailable=false] - Si los resultados publicados pueden abrirse
 * @param {() => void} props.onVotePress - Handler para botón "Votar ahora"
 * @param {() => void} props.onDetailsPress - Handler para botón "Ver detalles"
 * @param {Object} [props.election] - Datos de la elección (opcional, usa mock si no se provee)
 * @param {string|null} [props.loadMsg] - Mensaje de carga para mostrar en el botón (opcional)
 * @param {boolean} [props.allowIneligibleDetails=false] - Permite abrir detalle informativo aun sin habilitación
 */
const ElectionCard = ({
  hasVoted = false,
  voteSynced = false,
  isEligible = true,
  onVotePress,
  onDetailsPress,
  election = MOCK_ELECTION,
  loadMsg = null,
  allowIneligibleDetails = false,
  resultsAvailable = false,
}) => {
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
    if (!effectiveIsEligible) {
      if (allowIneligibleDetails) {
        return {
          title: UI_STRINGS.viewDetails || 'Ver detalle',
          disabled: false,
          onPress: onDetailsPress,
        };
      }
      return null;
    }

    // Si está cargando
    if (loadMsg) {
      return {
        title: loadMsg,
        disabled: true,
        onPress: () => {},
      };
    }

    if (!hasVoted && resultsAvailable) {
      return {
        title: 'Ver resultados',
        disabled: false,
        onPress: onDetailsPress,
      };
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
  const electionTitle = election?.title || UI_STRINGS.electionTitle;
  const electionStatus = election?.status || UI_STRINGS.statusActive;
  const instituteName = election?.instituteName || election?.organization || '';
  const timerValue = timerDisplay.time || timerDisplay.label || election?.closesInLabel || '';
  const timerLabel = isStarting ? 'INICIA EN' : 'CIERRA EN';

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

    // Estado: No habilitado sin detalle disponible
    if (!effectiveIsEligible && !allowIneligibleDetails) {
      return (
        <View style={styles.notEligibleContainer}>
          <View style={styles.redDot} />
          <CText type="M14" style={styles.notEligibleText}>
            {election.statusMessage ||
              'Usted no está habilitado\npara participar en esta\nvotación'}
          </CText>
        </View>
      );
    }

    // Estado: Inicia en / Cierra en
    if (timerValue) {
      return (
        <View style={styles.timerContainer}>
          <CText type="S12" style={styles.timerLabel}>
            {timerLabel}
          </CText>
          <View style={styles.timerValueRow}>
            <View style={styles.redDot} />
            <CText type="B14" style={styles.timerValue}>
              {timerValue}
            </CText>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <CText type="B12" style={styles.statusText}>
          {electionStatus}
        </CText>
        <View style={styles.electionIconBox}>
          <Ionicons name="business-outline" size={getResponsiveSize(16, 18, 20)} color="#459151" />
        </View>
      </View>

      <CText type="B18" style={styles.title}>
        {electionTitle}
      </CText>

      {!!instituteName && (
        <CText type="R14" style={styles.instituteName} numberOfLines={1}>
          {instituteName}
        </CText>
      )}

      {renderStatusContent()}

      {/* Botón de acción */}
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
          bgColor="#459151"
          icon={
            buttonConfig.title === UI_STRINGS.voteNow ? (
              <Ionicons
                name="arrow-forward"
                size={getResponsiveSize(16, 18, 20)}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
            ) : null
          }
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
    padding: getResponsiveSize(16, 18, 22),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(14, 18, 22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  statusText: {
    color: '#459151',
    fontSize: getResponsiveSize(10, 11, 12),
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  electionIconBox: {
    width: getResponsiveSize(28, 30, 34),
    height: getResponsiveSize(28, 30, 34),
    borderRadius: moderateScale(8),
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#232323',
    fontSize: getResponsiveSize(17, 18, 21),
    fontWeight: '800',
    marginBottom: getResponsiveSize(4, 5, 6),
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSize(10, 12, 14),
    marginBottom: getResponsiveSize(18, 20, 22),
  },
  timerLabel: {
    color: '#B8BEC4',
    fontSize: getResponsiveSize(9, 10, 11),
    fontWeight: '700',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  timerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E72F2F',
    marginRight: 6,
  },
  timerValue: {
    color: '#E72F2F',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '800',
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
    color: '#B8BEC4',
    fontSize: getResponsiveSize(13, 14, 15),
    textAlign: 'left',
  },
  button: {
    marginTop: getResponsiveSize(0, 2, 4),
    height: getHeight(46),
    borderRadius: moderateScale(9),
  },
  buttonVoted: {
    opacity: 0.9,
  },
  buttonIcon: {
    marginLeft: getResponsiveSize(6, 8, 10),
  },
});

export default ElectionCard;
