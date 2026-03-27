/**
 * Vote Receipt Screen (Comprobante)
 *
 * Muestra el comprobante del voto registrado con:
 * - Icono de éxito
 * - Título "Voto registrado exitosamente"
 * - Detalle de la elección
 * - Sección desplegable "Detalle de mi selección"
 * - Información de transacción/blockchain cuando exista
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';
import { useVotingState } from '../state/useVotingState';
import { releaseVoteForElection } from '../offline/queueAdapter';
import { StackNav, TabNav } from '../../../navigation/NavigationKey';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const buildSelectionEntries = candidateSelected => {
  const ticketEntries = Array.isArray(candidateSelected?.ticketEntries)
    ? candidateSelected.ticketEntries
        .map(entry => ({
          label: String(entry?.roleName || '').trim(),
          value: String(entry?.name || '').trim(),
        }))
        .filter(entry => entry.value)
    : [];

  if (ticketEntries.length > 0) {
    return ticketEntries;
  }

  const fallbackEntries = [
    {
      label: String(UI_STRINGS.president || '').replace(/:$/, ''),
      value: String(candidateSelected?.presidentName || '').trim(),
    },
    {
      label: String(UI_STRINGS.vicePresident || '').replace(/:$/, ''),
      value: String(candidateSelected?.viceName || '').trim(),
    },
  ];

  return fallbackEntries.filter(entry => entry.value);
};

const VoteReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const allowExitRef = useRef(false);
  const allowBackNavigation = route?.params?.allowBack === true;
  const {participations = [], lastReceipt, syncStateWithBlockchain, syncedWithBlockchain} = useVotingState(route?.params?.electionId ?? '');

  const participationId = route?.params?.participationId;
  const routeParticipation = route?.params?.participation || null;
  const participation =
    routeParticipation ||
    participations.find(p => p.id === participationId) ||
    (lastReceipt?.id === participationId ? lastReceipt : null) ||
    lastReceipt || {
      electionTitle: 'Votación institucional',
      fullDate: '',
      organization: '',
      candidateSelected: null,
      transactionId: null,
      blockchainHash: null,
    };
  const isFailedParticipation = participation?.status === 'ERROR';
  const isQueuedParticipation =
    participation?.synced === false && !isFailedParticipation;
  const selectionEntries = buildSelectionEntries(participation?.candidateSelected);

  const toggleDetail = () => {
    setIsDetailExpanded(!isDetailExpanded);
  };

  const navigateHome = useCallback(() => {
    allowExitRef.current = true;
    navigation.reset({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: {screen: TabNav.HomeScreen},
        },
      ],
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (allowBackNavigation) {
        return undefined;
      }

      allowExitRef.current = false;

      const onBeforeRemove = event => {
        if (allowExitRef.current) {
          return;
        }

        const actionType = String(event?.data?.action?.type || '');
        if (
          actionType === 'GO_BACK' ||
          actionType === 'POP' ||
          actionType === 'POP_TO_TOP'
        ) {
          event.preventDefault();
        }
      };

      const onBackPress = () => true;
      const removeBackHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      const unsubscribe = navigation.addListener('beforeRemove', onBeforeRemove);

      return () => {
        removeBackHandler.remove();
        unsubscribe();
      };
    }, [allowBackNavigation, navigation]),
  );

  useEffect(() => {
    if (participationId && !isQueuedParticipation && !isFailedParticipation) {
      syncStateWithBlockchain(participationId)
    }
  }, [isFailedParticipation, isQueuedParticipation, participationId, participations]);

  const renderSyncStatus = () => {
    if (isFailedParticipation) {
      return 'alert-circle';
    }
    if (isQueuedParticipation) {
      return 'clock-outline';
    }
    switch (syncedWithBlockchain) {
      case 'loading':
        return 'progress-download';
      case 'synced':
        return 'check-circle';
      case 'not_synced':
        return 'close-circle';
      case 'failed':
        return 'wifi-alert';
      default:
        return null;
    }
  }

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader
        title={UI_STRINGS.receiptHeader}
        isHideBack={!allowBackNavigation}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              isQueuedParticipation && styles.iconCircleQueued,
              isFailedParticipation && styles.iconCircleFailed,
            ]}>
            <Ionicons
              name={
                isFailedParticipation
                  ? 'alert-circle'
                  : isQueuedParticipation
                    ? 'time'
                    : 'checkmark-circle'
              }
              size={moderateScale(56)}
              color={
                isFailedParticipation
                  ? '#D32F2F'
                  : isQueuedParticipation
                    ? '#F59E0B'
                    : '#41A44D'
              }
            />
          </View>
        </View>

        {/* Success Title */}
        <CText type="B22" style={styles.successTitle}>
          {isQueuedParticipation
            ? 'Voto en cola para sincronizar'
            : isFailedParticipation
              ? 'No se pudo completar el voto'
              : UI_STRINGS.voteRegisteredSuccess}
        </CText>

        {isFailedParticipation && participation?.errorMessage ? (
          <CText type="R14" style={styles.failureMessage}>
            {participation.errorMessage}
          </CText>
        ) : null}

        {/* Card with details */}
        <View style={styles.card}>
          {/* Election Title */}
          <CText type="B16" style={styles.electionTitle}>
            {participation.electionTitle}
          </CText>

          {/* Date and Time */}
          <View style={styles.detailRow}>
            <CText type="R14" style={styles.detailLabel}>
              {UI_STRINGS.dateTime}
            </CText>
            <CText type="M14" style={styles.detailValue}>
              {participation.fullDate}
            </CText>
          </View>

          {/* Selection Detail - Expandable */}
          <TouchableOpacity
            style={styles.expandableHeader}
            onPress={toggleDetail}
            activeOpacity={0.7}
          >
            <CText type="M14" style={styles.expandableTitle}>
              {UI_STRINGS.selectionDetail}
            </CText>
            <Ionicons
              name={isDetailExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#374151"
            />
          </TouchableOpacity>

          {/* Expanded Selection Detail */}
          {isDetailExpanded && participation.candidateSelected && (
            <View style={styles.expandedContent}>
              <View style={styles.selectionDetailRow}>
                <CText type="R12" style={styles.selectionLabel}>
                  {UI_STRINGS.party}
                </CText>
                <CText type="M14" style={styles.selectionValue}>
                  {participation.candidateSelected.partyName}
                </CText>
              </View>
              {selectionEntries.map(entry => (
                <View
                  key={`${entry.label}:${entry.value}`}
                  style={styles.selectionDetailRow}
                >
                  <CText type="R12" style={styles.selectionLabel}>
                    {entry.label}
                  </CText>
                  <CText type="M14" style={styles.selectionValue}>
                    {entry.value}
                  </CText>
                </View>
              ))}
            </View>
          )}

          {/* Organization */}
          <View style={styles.detailRow}>
            <CText type="R14" style={styles.detailLabel}>
              {UI_STRINGS.organization}
            </CText>
            <CText type="M14" style={styles.detailValue}>
              {participation.organization}
            </CText>
          </View>

          {/* Transaction ID */}
          {participation.transactionId && (
            <View style={styles.detailRow}>
              <CText type="R14" style={styles.detailLabel}>
                {UI_STRINGS.transactionId}
              </CText>
              <CText type="M14" style={styles.detailValueMono}>
                {participation.transactionId}
              </CText>
            </View>
          )}

          {/* Blockchain Hash */}
          <View style={styles.detailRow}>
            <CText type="R14" style={styles.detailLabel}>
              {UI_STRINGS.syncedWithBlockchain}
            </CText>
            <Icon
              name={renderSyncStatus()}
              size={20}
              color="#374151"
            />
          </View>
        </View>

        <CButton
          title={isFailedParticipation ? 'Volver a votar' : 'Ir al inicio'}
          onPress={async () => {
            if (isFailedParticipation) {
              await releaseVoteForElection(route?.params?.electionId ?? '');
            }
            navigateHome();
          }}
          containerStyle={styles.homeButton}
          sinMargen
        />
      </ScrollView>

    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(20, 24, 28),
    paddingBottom: getResponsiveSize(100, 110, 120),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  iconCircle: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleQueued: {
    backgroundColor: '#FEF3C7',
  },
  iconCircleFailed: {
    backgroundColor: '#FFEBEE',
  },
  successTitle: {
    color: '#1F2937',
    fontSize: getResponsiveSize(20, 22, 26),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  failureMessage: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: getResponsiveSize(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  homeButton: {
    marginTop: getResponsiveSize(24, 28, 32),
  },
  electionTitle: {
    color: '#1F2937',
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: getResponsiveSize(13, 14, 15),
  },
  detailValue: {
    color: '#1F2937',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  detailValueMono: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(12, 13, 14),
    fontFamily: 'monospace',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expandableTitle: {
    color: '#374151',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
  expandedContent: {
    backgroundColor: '#F9FAFB',
    borderRadius: moderateScale(8),
    padding: getResponsiveSize(12, 14, 16),
    marginVertical: getResponsiveSize(8, 10, 12),
  },
  selectionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(4, 6, 8),
  },
  selectionLabel: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(11, 12, 13),
  },
  selectionValue: {
    color: '#374151',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '500',
  },
});

export default VoteReceiptScreen;
