import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import {StackNav} from '../../../navigation/NavigationKey';
import RewardListItem from '../components/RewardListItem';
import RewardSummaryCard from '../components/RewardSummaryCard';
import {useRewardsQuery} from '../data/rewardsApi';
import {colors} from '../../../themes/colors';

const RewardsScreen = ({navigation, route}) => {
  const {
    rewards: {data: rewards, rewardsAvailable},
    isLoading,
    error,
  } = useRewardsQuery();
  const hasVoteRewardNotice = route?.params?.voteRewardAvailable === true;
  const voteRewardAvailable = rewardsAvailable || hasVoteRewardNotice;
  const voteReward = {
    id: 'reward-vote',
    title: 'Recompensa por votar',
    amount: 0,
    currency: 'TVD',
    status: 'available',
    statusLabel: 'Disponible',
    processLabel: 'Recompensa por tu participación',
    type: 'Recompensa por votar',
    message: 'Tienes una recompensa por voto disponible para reclamar.',
  };
  const displayedRewards = hasVoteRewardNotice
    ? (rewards || []).map(reward =>
        reward.id === 'reward-vote'
          ? {
              ...reward,
              ...voteReward,
            }
          : reward,
      )
    : rewards;
  const rewardsToDisplay =
    hasVoteRewardNotice && !displayedRewards.some(reward => reward.id === 'reward-vote')
      ? [voteReward, ...displayedRewards]
      : displayedRewards;

  const handleRewardPress = reward => {
    navigation.navigate(StackNav.RewardDetailScreen, {
      rewardId: reward.id,
      reward,
    });
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title="Mis recompensas" testID="rewardsHeader" />
      <RewardSummaryCard />
      {voteRewardAvailable && (
        <View style={styles.rewardNotice} testID="voteRewardAvailableNotice">
          <Text style={styles.rewardNoticeTitle}>Recompensa por voto disponible</Text>
          <Text style={styles.rewardNoticeBody}>
            Pulsa Reclamar cuando la reclamación esté habilitada.
          </Text>
        </View>
      )}
      {isLoading && !hasVoteRewardNotice ? (
        <View style={styles.stateContainer} testID="rewardsLoading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && !hasVoteRewardNotice ? (
        <View style={styles.stateContainer} testID="rewardsError">
          <Text style={styles.rewardNoticeBody}>
            No se pudieron cargar las recompensas.
          </Text>
        </View>
      ) : (
        <FlashList
          testID="rewardsList"
          data={rewardsToDisplay}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <RewardListItem reward={item} onPress={handleRewardPress} />
          )}
          ListFooterComponent={<View style={styles.footerSpace} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
