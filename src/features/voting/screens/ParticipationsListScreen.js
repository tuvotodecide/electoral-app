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
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';
import { StackNav } from '../../../navigation/NavigationKey';
import { useVotingState } from '../state/useVotingState';
import { useElectionRepository } from '../data/useElectionRepository';
import { normalizeUri } from '../../../utils/normalizedUri';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const mergeParticipations = (remoteParticipations, localParticipations) => {
  const pendingLocal = (Array.isArray(localParticipations) ? localParticipations : []).filter(
    item => item?.synced !== true || item?.status === 'ERROR',
  );
  const blockedElectionIds = new Set(
    pendingLocal.map(item => String(item?.electionId || '')).filter(Boolean),
  );
  const seenIds = new Set(pendingLocal.map(item => String(item?.id || '')).filter(Boolean));
  const nextParticipations = [...pendingLocal];

  (Array.isArray(remoteParticipations) ? remoteParticipations : []).forEach(item => {
    const itemId = String(item?.id || '');
    const electionId = String(item?.electionId || '');

    if ((itemId && seenIds.has(itemId)) || (electionId && blockedElectionIds.has(electionId))) {
      return;
    }

    if (itemId) {
      seenIds.add(itemId);
    }

    nextParticipations.push(item);
  });

  return nextParticipations.sort(
    (left, right) =>
      new Date(right?.participatedAt || 0).getTime() -
      new Date(left?.participatedAt || 0).getTime(),
  );
};

const ParticipationItem = ({ item, onPress }) => {
  const isRegistered = item.status === 'VOTO_REGISTRADO';
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
            <View style={styles.previewCopy}>
              <CText type="B12" style={styles.previewLabel}>
                Attestation
              </CText>
              <CText type="R12" style={styles.previewHint}>
                Certificado asociado
              </CText>
            </View>
          </View>
        ) : null}
        <View style={styles.itemHeader}>
          <CText type="B16" style={styles.itemTitle}>
            {item.electionTitle}
          </CText>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <CText type="B12" style={[styles.statusText, { color: statusColor }]}>
            {item.statusLabel}
          </CText>
        </View>

        {/* Date */}
        <CText type="R12" style={styles.dateText}>
          {item.date} · {item.time}
        </CText>
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
    try {
      const remoteParticipations = await repository.getParticipations();
      setParticipations(mergeParticipations(remoteParticipations, localParticipations));
    } catch (error) {
      setParticipations(mergeParticipations([], localParticipations));
    } finally {
      setIsLoading(false);
    }
  }, [localParticipations, repository]);

  useFocusEffect(
    useCallback(() => {
      loadParticipations();
    }, [loadParticipations]),
  );

  const handleItemPress = (item) => {
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

      <FlatList
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
  previewLabel: {
    color: '#17694A',
    fontWeight: '700',
  },
  previewHint: {
    color: '#6B7280',
    marginTop: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  itemTitle: {
    color: '#1F2937',
    fontSize: getResponsiveSize(15, 16, 18),
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
    fontSize: getResponsiveSize(12, 13, 14),
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
