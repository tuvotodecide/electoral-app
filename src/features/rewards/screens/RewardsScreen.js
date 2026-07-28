import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import {StackNav} from '../../../navigation/NavigationKey';
import RewardListItem from '../components/RewardListItem';
import RewardSummaryCard from '../components/RewardSummaryCard';
import {
  getMockRewards,
  getMockRewardsSummary,
} from '../data/mockRewards';

const RewardsScreen = ({navigation, route}) => {
  const summary = getMockRewardsSummary();
  const voteRewardAvailable = route?.params?.voteRewardAvailable === true;
  const rewards = getMockRewards().map(reward =>
    voteRewardAvailable && reward.id === 'reward-vote'
      ? {
          ...reward,
          status: 'available',
          statusLabel: 'Disponible',
          message: 'Tienes una recompensa por voto disponible para reclamar.',
        }
      : reward,
  );

  const handleRewardPress = reward => {
    if (voteRewardAvailable && reward?.id === 'reward-vote') {
      // TODO: implementar reclamación de recompensa por voto
    }
    navigation.navigate(StackNav.RewardDetailScreen, {
      rewardId: reward.id,
      reward,
    });
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title="Mis recompensas" testID="rewardsHeader" />
      <RewardSummaryCard
        total={summary.totalTVD}
        currency={summary.currency}
      />
      {voteRewardAvailable && (
        <View style={styles.rewardNotice} testID="voteRewardAvailableNotice">
          <Text style={styles.rewardNoticeTitle}>Recompensa por voto disponible</Text>
          <Text style={styles.rewardNoticeBody}>
            Pulsa Reclamar cuando la reclamación esté habilitada.
          </Text>
        </View>
      )}
      <FlashList
        testID="rewardsList"
        data={rewards}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <RewardListItem reward={item} onPress={handleRewardPress} />
        )}
        ListFooterComponent={<View style={styles.footerSpace} />}
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
  footerSpace: {
    height: 24,
  },
  rewardNotice: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5EF',
    borderWidth: 1,
    borderColor: '#9AD3B5',
  },
  rewardNoticeTitle: {
    color: '#165B3C',
    fontWeight: '700',
    fontSize: 14,
  },
  rewardNoticeBody: {
    color: '#2E5D47',
    fontSize: 13,
    marginTop: 4,
  },
});

export default RewardsScreen;
