/**
 * Participations List Screen
 *
 * Lista de participaciones del usuario.
 * Muestra cada participación con estado (VOTO REGISTRADO, EN COLA).
 */

import React, {useCallback, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';
import { StackNav } from '../../../navigation/NavigationKey';
import { useVotingState } from '../state/useVotingState';
import { useElectionRepository } from '../data/useElectionRepository';
import { normalizeUri } from '../../../utils/normalizedUri';
import { FlashList } from '@shopify/flash-list';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const ENABLE_LOCAL_PARTICIPATIONS_FALLBACK = false;

const formatParticipationDateParts = rawDate => {
  const parsedDate = new Date(rawDate || Date.now());
  const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return {
    participatedAt: validDate.toISOString(),
    date: validDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
    time: validDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fullDate: validDate.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

const normalizeVoteParticipation = participation => {
  const dateParts = formatParticipationDateParts(
    participation?.participatedAt ||
      participation?.createdAt ||
      participation?.timestamp,
  );
  const eventId = String(
    participation?.electionId ||
      participation?.eventId ||
      participation?.voteId ||
      '',
  );
  const id = String(
    participation?.id ||
      participation?.participationId ||
      `${eventId || 'participation'}:${dateParts.participatedAt}`,
  );
  const status = participation?.status || 'VOTO_REGISTRADO';

  return {
    id,
    electionId: eventId,
    voteId: String(participation?.voteId || eventId),
    electionTitle: String(
      participation?.electionTitle ||
        participation?.title ||
        participation?.eventTitle ||
        participation?.eventName ||
        'Votación institucional',
    ).trim(),
    status,
    statusLabel: participation?.statusLabel || 'VOTO REGISTRADO',
    date: participation?.date || dateParts.date,
    time: participation?.time || dateParts.time,
    fullDate: participation?.fullDate || dateParts.fullDate,
    organization: String(
      participation?.organization ||
        participation?.institutionName ||
        participation?.organizationName ||
        '',
    ).trim(),
    transactionId: null,
    blockchainHash: null,
    candidateSelected: null,
    errorMessage: participation?.errorMessage || null,
    nftId: participation?.nftId || null,
    nftImageUrl: participation?.nftImageUrl || null,
    participatedAt: dateParts.participatedAt,
    selectedCandidateId: null,
    synced: status === 'VOTO_REGISTRADO',
  };
};

const isLocalFallbackParticipation = participation =>
  participation?.status === 'ERROR' || participation?.synced === false;

const getParticipationKey = participation =>
  String(
    participation?.electionId ||
      participation?.eventId ||
      participation?.voteId ||
      participation?.id ||
      '',
  );

const mergeVoteParticipations = ({
  backendParticipations,
  localParticipations,
  backendSucceeded,
}) => {
  const normalizedBackend = Array.isArray(backendParticipations)
    ? backendParticipations.map(normalizeVoteParticipation)
    : [];
  const localVotes = Array.isArray(localParticipations) ? localParticipations : [];

  if (!ENABLE_LOCAL_PARTICIPATIONS_FALLBACK) {
    return backendSucceeded ? normalizedBackend : [];
  }

  if (!backendSucceeded) {
    return localVotes;
  }

  if (normalizedBackend.length === 0) {
    return localVotes;
  }

  const backendKeys = new Set(normalizedBackend.map(getParticipationKey));
  const localFallback = localVotes.filter(
    item => isLocalFallbackParticipation(item) && !backendKeys.has(getParticipationKey(item)),
  );

  return [...normalizedBackend, ...localFallback];
};

const mergeHistoryItems = ({
  backendParticipations,
  localParticipations,
  witnessRecords,
  backendSucceeded,
}) =>
  [
    ...mergeVoteParticipations({
      backendParticipations,
      localParticipations,
      backendSucceeded,
    }),
    ...(Array.isArray(witnessRecords) ? witnessRecords : []),
  ].sort(
    (left, right) =>
      new Date(right?.participatedAt || 0).getTime() -
      new Date(left?.participatedAt || 0).getTime(),
  );

const ParticipationItem = ({ item, onPress }) => {
  const isAttestation = item?.itemType === 'attestation';
  const isRegistered = item.status === 'VOTO_REGISTRADO' || isAttestation;
  const isFailed = item.status === 'ERROR';
  const statusColor = isRegistered ? '#41A44D' : isFailed ? '#D32F2F' : '#F59E0B';
  const statusBgColor = isRegistered ? '#E8F5E9' : isFailed ? '#FFEBEE' : '#FEF3C7';
  const attestationImageUrl = normalizeUri(item?.nftImageUrl || null);

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        {attestationImageUrl ? (
          <View style={styles.previewRow}>
            <Image
              source={{uri: attestationImageUrl}}
              style={styles.attestationPreview}
              resizeMode="cover"
            />
            {isAttestation ? (
              <View style={styles.previewCopy}>
                <CText type="B12" style={styles.previewLabel}>
                  {item.electionTitle}
                </CText>
                <CText type="R12" style={styles.previewHint}>
                  {item.date} · {item.time}
                </CText>
              </View>
            ) : null}
            {isAttestation ? (
              <Ionicons
                name="chevron-forward"
                size={22}
                color="#9CA3AF"
                style={styles.previewChevron}
              />
            ) : null}
          </View>
        ) : null}
        {!isAttestation ? (
          <View style={styles.itemHeader}>
            <CText type="B16" style={styles.itemTitle}>
              {item.electionTitle}
            </CText>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        ) : null}

        {/* Status Badge */}
        {!isAttestation ? (
          <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
            <CText type="B12" style={[styles.statusText, { color: statusColor }]}>
              {item.statusLabel}
            </CText>
          </View>
        ) : null}

        {/* Date */}
        {!isAttestation ? (
          <CText type="R12" style={styles.dateText}>
            {item.date} · {item.time}
          </CText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const ParticipationsListScreen = () => {
  const navigation = useNavigation();
  const repository = useElectionRepository();
  const {participations: localParticipations = []} = useVotingState();
  const [participations, setParticipations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadParticipations = useCallback(async () => {
    setIsLoading(true);
    const [backendParticipationsResult, witnessRecordsResult] = await Promise.allSettled([
      typeof repository.getParticipations === 'function'
        ? repository.getParticipations()
        : Promise.resolve([]),
      typeof repository.getWitnessRecords === 'function'
        ? repository.getWitnessRecords()
        : Promise.resolve([]),
    ]);
    const backendParticipations =
      backendParticipationsResult.status === 'fulfilled'
        ? backendParticipationsResult.value
        : [];
    const witnessRecords =
      witnessRecordsResult.status === 'fulfilled' ? witnessRecordsResult.value : [];

    setParticipations(
      mergeHistoryItems({
        backendParticipations,
        localParticipations,
        witnessRecords,
        backendSucceeded: backendParticipationsResult.status === 'fulfilled',
      }),
    );
    setIsLoading(false);
  }, [localParticipations, repository]);

  useFocusEffect(
    useCallback(() => {
      loadParticipations();
    }, [loadParticipations]),
  );

  const handleItemPress = (item) => {
    if (item?.itemType === 'attestation') {
      navigation.navigate(StackNav.MyWitnessesDetailScreen, {
        photoUri: item.photoUri || null,
        mesaData: item.mesaData || null,
        partyResults: item.partyResults || [],
        voteSummaryResults: item.voteSummaryResults || [],
        attestationData: item.attestationData || null,
        ballotData: item.ballotData || item.attestationData?.ballotData || null,
        actaUrl:
          item.photoUri ||
          item.ballotData?.image ||
          item.attestationData?.image ||
          null,
        certificateUrl: item.certificateUrl || null,
        electionType:
          item.electionType ||
          item.ballotData?.electionType ||
          item.attestationData?.ballotData?.electionType ||
          null,
      });
      return;
    }

    navigation.navigate(StackNav.VotingReceiptScreen, {
      participationId: item.id,
      electionId: item.electionId,
      participation: item,
      allowBack: true,
    });
  };

  const renderItem = ({ item }) => (
    <ParticipationItem item={item} onPress={handleItemPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
      <CText type="M16" style={styles.emptyText}>
        Aún no tienes participaciones
      </CText>
    </View>
  );

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.participationsHeader} />

      <FlashList
        data={participations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={loadParticipations}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(16, 20, 24),
    paddingBottom: getResponsiveSize(20, 24, 28),
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    padding: getResponsiveSize(14, 16, 18),
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  attestationPreview: {
    width: getResponsiveSize(44, 52, 60),
    height: getResponsiveSize(58, 68, 78),
    borderRadius: moderateScale(10),
    backgroundColor: '#F3F4F6',
  },
  previewCopy: {
    marginLeft: 12,
    flex: 1,
  },
  previewChevron: {
    marginLeft: 10,
  },
  previewLabel: {
    color: '#17694A',
    fontWeight: '700',
    fontSize: getResponsiveSize(14, 15, 16),
  },
  previewHint: {
    color: '#6B7280',
    marginTop: 2,
    fontSize: getResponsiveSize(13, 14, 15),
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  itemTitle: {
    color: '#1F2937',
    fontSize: getResponsiveSize(16, 17, 19),
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  statusText: {
    fontSize: getResponsiveSize(10, 11, 12),
    fontWeight: '700',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(13, 14, 15),
  },
  separator: {
    height: getResponsiveSize(12, 14, 16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: getResponsiveSize(80, 100, 120),
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(14, 15, 16),
    marginTop: getResponsiveSize(12, 14, 16),
  },
});

export default ParticipationsListScreen;
