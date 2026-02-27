/**
 * Participations List Screen
 *
 * Lista de participaciones del usuario.
 * Muestra cada participación con estado (VOTO REGISTRADO, EN COLA).
 */

import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import { moderateScale } from '../../../common/constants';
import { UI_STRINGS, MOCK_PARTICIPATIONS } from '../data/mockData';
import { StackNav } from '../../../navigation/NavigationKey';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const ParticipationItem = ({ item, onPress }) => {
  const isRegistered = item.status === 'VOTO_REGISTRADO';
  const statusColor = isRegistered ? '#41A44D' : '#F59E0B';
  const statusBgColor = isRegistered ? '#E8F5E9' : '#FEF3C7';

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
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

  const handleItemPress = (item) => {
    if (item.status === 'VOTO_REGISTRADO') {
      // Navigate to receipt/comprobante screen
      navigation.navigate(StackNav.UniversityElectionReceiptScreen, {
        participationId: item.id,
      });
    } else {
      // Show info that it's pending
      // Could show a modal or toast
    }
  };

  const renderItem = ({ item }) => (
    <ParticipationItem item={item} onPress={handleItemPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
      <CText type="M16" style={styles.emptyText}>
        No tienes participaciones aún
      </CText>
    </View>
  );

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.participationsHeader} />

      <FlatList
        data={MOCK_PARTICIPATIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
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
