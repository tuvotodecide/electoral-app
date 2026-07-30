import React, {useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import LoadingModal from '../../../components/modal/LoadingModal';
import {StackNav} from '../../../navigation/NavigationKey';
import RewardListItem from '../components/RewardListItem';
import RewardSummaryCard from '../components/RewardSummaryCard';
import {useClaimVoteRewardMutation, useRewardsQuery} from '../data/rewardsApi';
import {colors} from '../../../themes/colors';

const RewardsScreen = ({navigation, route}) => {
  const voteRewardAvailable = route?.params?.voteRewardAvailable === true;

  const {rewards: fetchedRewards, isLoading, error} = useRewardsQuery();
  const {claimReward} = useClaimVoteRewardMutation();
  const [claimModal, setClaimModal] = useState({
    visible: false,
    isLoading: false,
    success: false,
    message: '',
    reward: null,
  });
  const rewards = fetchedRewards.map(reward =>
    voteRewardAvailable && reward.id === 'reward-vote'
      ? {
          ...reward,
          status: 'available',
          statusLabel: 'Disponible',
          message: 'Tienes una recompensa por voto disponible para reclamar.',
        }
      : reward,
  );

  const runClaim = reward => {
    setClaimModal({
      visible: true,
      isLoading: true,
      success: false,
      message: 'Reclamando tu recompensa...',
      reward,
    });
    claimReward(reward.id, {
      onSuccess: () => {
        setClaimModal({
          visible: true,
          isLoading: false,
          success: true,
          message: 'Reclamaste tu recompensa correctamente.',
          reward,
        });
      },
      onError: () => {
        setClaimModal({
          visible: true,
          isLoading: false,
          success: false,
          message: 'No se pudo reclamar la recompensa. Inténtalo de nuevo.',
          reward,
        });
      },
    });
  };

  const handleRewardPress = reward => {
    if (voteRewardAvailable && reward?.id === 'reward-vote') {
      runClaim(reward);
      return;
    }
    navigation.navigate(StackNav.RewardDetailScreen, {
      rewardId: reward.id,
      reward,
    });
  };

  const handleClaimModalPrimaryPress = () => {
    if (claimModal.success) {
      const reward = claimModal.reward;
      setClaimModal({visible: false, isLoading: false, success: false, message: '', reward: null});
      navigation.navigate(StackNav.RewardDetailScreen, {
        rewardId: reward.id,
        reward,
      });
      return;
    }
    runClaim(claimModal.reward);
  };

  const handleClaimModalDismiss = () => {
    setClaimModal({visible: false, isLoading: false, success: false, message: '', reward: null});
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
      {isLoading ? (
        <View style={styles.stateContainer} testID="rewardsLoading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.stateContainer} testID="rewardsError">
          <Text style={styles.rewardNoticeBody}>
            No se pudieron cargar las recompensas.
          </Text>
        </View>
      ) : (
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
      )}
      <LoadingModal
        visible={claimModal.visible}
        isLoading={claimModal.isLoading}
        success={claimModal.success}
        message={claimModal.message}
        buttonText={claimModal.success ? 'Continuar' : 'Reintentar'}
        onClose={handleClaimModalPrimaryPress}
        secondBtn={claimModal.success ? undefined : 'Cerrar'}
        onSecondPress={handleClaimModalDismiss}
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
