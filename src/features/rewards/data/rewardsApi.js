import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import axios from 'axios';
import {VERIFIER_REQUEST_ENDPOINT} from '@env';
import wira from 'wira-sdk';
import { getRewardHash, getVoteInfo, getVoteReward, hasReceivedReward } from '@/src/api/vote';
import { useSelector } from 'react-redux';
import { getCredentialForVote } from '@/src/data/credentials';
import { captureError } from '@/src/config/sentry';

const getClaimRequest = async () => {
  const request = await axios.get(VERIFIER_REQUEST_ENDPOINT + '/claim-reward');

  const data = request.data;
  if (!data.request) {
    throw new Error('Invalid reward request response: missing message');
  }

  return data.request;
}

const claimVoteReward = async (electionId, account, did, privKey) => {
  try {
    const credential = await getCredentialForVote(electionId, did, privKey);
    if (!credential) {
      throw new Error('No se pudo validar tu acceso para emitir el voto');
    }

    const rewardHash = getRewardHash(electionId, credential.info?.credentialSubject?.nullifier);
    const rewardAlreadyClaimed = await hasReceivedReward(electionId, rewardHash);
    if(rewardAlreadyClaimed) return;

    const claimRequest = await getClaimRequest();
    const callbackUrl = claimRequest.body.callbackUrl;
    if(!callbackUrl) {
      throw new Error('No se pudo preparar la confirmación para el reclamo de la recompensa');
    }
    claimRequest.body.callbackUrl = callbackUrl + `?recipient=${account}`

    await wira.authenticateWithVerifier(
      JSON.stringify(claimRequest),
      did,
      privKey,
      [credential.id]
    ); 
  } catch (error) {
    captureError(error, {
      flow: 'claimReward',
      step: 'claimRequest',
      critical: 'true',
    });
    throw error;
  }
};

const getUserElectionsFromVcs = async (did, privKey) => {
  const creds = await wira.getUserCredentials(did, privKey);
  return creds.filter(cred => cred.type === 'SelectedVoter')
    .map(cred => ({
      eventId: cred.info?.credentialSubject?.eventId,
      secret: cred.info?.credentialSubject?.nullifier,
    }));
}

const getRewardsStatusByElection = async (electionIdsWithSecrets) => {
  const promises = electionIdsWithSecrets.map(async (item) => {
    const rewardHash = getRewardHash(item.eventId, item.secret);
    const { name } = await getVoteInfo(item.eventId);
    const hasReceived = await hasReceivedReward(item.eventId, rewardHash);

    return {
      electionId: item.eventId,
      electionName: name,
      hasReceived,
    }
  });

  const results = await Promise.allSettled(promises);
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}

const fetchVoteRewards = async (did, privKey) => {
  const rewardAmount = await getVoteReward();
  const electionsWithSecrets = await getUserElectionsFromVcs(did, privKey);
  const rewardsByElection = await getRewardsStatusByElection(electionsWithSecrets);

  let filteredRewards = [];
  if (rewardAmount.raw > 0) {
    filteredRewards = rewardsByElection;
  } else {
    filteredRewards = rewardsByElection.filter(item => item.hasReceived);
  }

  return filteredRewards.map(item => {
    return {
      id: item.electionId,
      title: 'Recompensa por votar',
      amount: rewardAmount.formatted,
      amountLabel: `+${rewardAmount.formatted} TVD`,
      currency: 'TVD',
      status: item.hasReceivedReward ? 'received' : 'pending',
      statusLabel: item.hasReceivedReward ? 'Recibida': 'Pendiente',
      processName: item.electionName,
      processLabel: item.electionName,
      type: 'Recompensa por votar',
      message: 'Recibiste esta recompensa por tu participación.',
    }
  });
};

export const useRewardsQuery = (options = {}) => {
  const userData = useSelector(state => state.wallet.payload);

  const {data, error, isLoading, isFetching, refetch} = useQuery({
    queryKey: ['rewards'],
    queryFn: () => fetchVoteRewards(userData.did, userData.privKey),
    ...options,
  });

  return {
    rewards: data ?? [],
    error,
    isLoading,
    isFetching,
    refetch,
  };
};

export const useClaimVoteRewardMutation = () => {
  const queryClient = useQueryClient();
  const userData = useSelector(state => state.wallet.payload);

  const {mutate, mutateAsync, isPending, error} = useMutation({
    mutationFn: (electionId) => claimVoteReward(electionId, userData.account, userData.did, userData.privKey),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['rewards']});
    },
  });

  return {claimReward: mutate, claimRewardAsync: mutateAsync, isClaiming: isPending, error};
};
