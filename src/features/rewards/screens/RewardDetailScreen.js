import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';
import {getMockRewardById} from '../data/mockRewards';

const InfoRow = ({label, value}) => (
  <View style={styles.infoRow}>
    <CText style={styles.infoLabel}>{label}</CText>
    <CText style={styles.infoValue} numberOfLines={2}>
      {value}
    </CText>
  </View>
);

const RewardDetailScreen = ({route}) => {
  const paramReward = route?.params?.reward || null;
  const rewardId = route?.params?.rewardId || paramReward?.id;
  const reward = paramReward || getMockRewardById(rewardId);

  if (!reward) {
    return (
      <CSafeAreaView style={styles.container}>
        <CHeader title="Detalle de recompensa" testID="rewardDetailHeader" />
        <View style={styles.fallbackBox} testID="rewardDetailFallback">
          <CText style={styles.fallbackTitle}>Recompensa no encontrada</CText>
          <CText style={styles.fallbackText}>
            No pudimos encontrar el detalle de esta recompensa.
          </CText>
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title="Detalle de recompensa" testID="rewardDetailHeader" />
      <ScrollView
        testID="rewardDetailContent"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift-outline" size={moderateScale(26)} color="#459151" />
          </View>
          <CText style={styles.heroLabel}>Monto recibido</CText>
          <View style={styles.amountRow}>
            <CText style={styles.heroAmount}>+{reward.amount}</CText>
          </View>
          <CText style={styles.heroCurrency}>{reward.currency}</CText>
          <View style={styles.heroBadge}>
            <CText style={styles.heroBadgeText}>{reward.statusLabel}</CText>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Tipo de recompensa" value={reward.type} />
          <InfoRow label="Proceso relacionado" value={reward.processName} />
          <InfoRow label="Fecha" value={reward.createdAtLabel} />
          <InfoRow label="Estado" value={reward.statusLabel} />
        </View>

        <View style={styles.messageBox}>
          <CText style={styles.messageText}>{reward.message}</CText>
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(24),
  },
  heroCard: {
    backgroundColor: '#459151',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 7},
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  heroIcon: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(14),
  },
  heroLabel: {
    color: '#E8F5E9',
    fontSize: moderateScale(13),
    marginBottom: moderateScale(8),
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: moderateScale(42),
    fontWeight: '800',
    lineHeight: moderateScale(48),
  },
  heroCurrency: {
    color: '#FFFFFF',
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginTop: moderateScale(4),
  },
  heroBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    marginTop: moderateScale(14),
  },
  heroBadgeText: {
    color: '#459151',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(14),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    minHeight: moderateScale(44),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F2',
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: moderateScale(13),
    flex: 0.9,
    marginRight: moderateScale(10),
  },
  infoValue: {
    color: '#232323',
    fontSize: moderateScale(13),
    fontWeight: '700',
    flex: 1.1,
    textAlign: 'right',
  },
  messageBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(16),
    marginTop: moderateScale(14),
  },
  messageText: {
    color: '#459151',
    fontSize: moderateScale(14),
    fontWeight: '700',
    lineHeight: moderateScale(20),
  },
  fallbackBox: {
    margin: moderateScale(16),
    padding: moderateScale(18),
    borderRadius: moderateScale(12),
    backgroundColor: '#FFFFFF',
  },
  fallbackTitle: {
    color: '#232323',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  fallbackText: {
    color: '#6B7280',
    fontSize: moderateScale(13),
    marginTop: moderateScale(6),
  },
});

export default RewardDetailScreen;
