import React from 'react';
import {StyleSheet, View} from 'react-native';
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

const RewardsScreen = ({navigation}) => {
  const summary = getMockRewardsSummary();
  const rewards = getMockRewards();

  const handleRewardPress = reward => {
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
});

export default RewardsScreen;
