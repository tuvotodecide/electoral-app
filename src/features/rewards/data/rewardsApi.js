import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import axios from 'axios';
import {VERIFIER_REQUEST_ENDPOINT} from '@env';
import { getOwnVoteInfo, getRewardHash, getVoteInfo, getVoteReward, hasReceivedReward } from '@/src/api/vote';
import { useSelector } from 'react-redux';
import { getCredentialForVote, listVoteCredentials } from '@/src/data/credentials';
import { answerVerifierRequest } from '@/src/services/privado/verifierProof';
import { captureError } from '@/src/config/sentry';
import { hashVoteNullifier } from '../../voting/utils/dataHasher';
import { isDemoActive } from '../../demo/demoSession';

const rewardStatuses = {
  received: {
    key: 'received',
    value: 'Recibida',
    message: 'Recibiste esta recompensa por tu participación.'
  },
  pending: {
    key: 'pending',
    value: 'Pendiente',
    message: 'Espera a que termine la votación para reclamar tu recompensa.'
  },
  available: {
    key: 'available',
    value: 'Disponible',
    message: 'Tienes una recompensa por voto disponible para reclamar.',
  }
}

const getClaimRequest = async () => {
  const request = await axios.get(VERIFIER_REQUEST_ENDPOINT + '/claim-reward');

  const data = request.data;
  if (!data.request) {
    throw new Error('Invalid reward request response: missing message');
  }

  return data.request;
}

export const claimVoteReward = async (electionId, account) => {
  try {
    const credential = await getCredentialForVote(electionId);
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

    // Prueba ZK de la credencial de voto (eventId y nullifier) al verificador
    // de back-results, que envía la recompensa a `recipient`.
    await answerVerifierRequest(claimRequest, {
      credentialId: credential.id,
      reason: 'Abre tu cuenta para reclamar tu recompensa.',
    });
  } catch (error) {
    captureError(error, {
      flow: 'claimReward',
      step: 'claimRequest',
      critical: 'true',
    });
    throw error;
  }
};

// Una credencial de voto por evento: su nullifier es el secreto del voto y de
// la recompensa.
const getUserElectionsFromVcs = async () => {
  const creds = await listVoteCredentials({
    reason: 'Abre tu cuenta para ver tus recompensas.',
  });
  return creds
    .map(cred => ({
      eventId: cred.info?.credentialSubject?.eventId,
      secret: cred.info?.credentialSubject?.nullifier,
    }))
    .filter(item => item.eventId != null && item.secret != null);
}

const getRewardsStatusByElection = async (electionIdsWithSecrets) => {
  const promises = electionIdsWithSecrets.map(async (item) => {
    try {
      const rewardHash = getRewardHash(item.eventId, item.secret);
      const { name, endDate } = await getVoteInfo(item.eventId);
      const [hasVoted] = await getOwnVoteInfo(item.eventId, hashVoteNullifier(item.eventId, item.secret))
      const hasReceived = await hasReceivedReward(item.eventId, rewardHash);

      return {
        electionId: item.eventId,
        electionName: name,
        hasReceived,
        hasVoted,
        canBeClaimed: Math.floor(Date.now() / 1000) > endDate,
        endDate: new Date(endDate * 1000).toLocaleString(),
      }
    } catch (error) {
      throw error;
    }
  });

  const results = await Promise.allSettled(promises);
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}

export const fetchVoteRewards = async () => {
  // TokenRewardsCard está en HomeScreen y lleva a RewardsScreen -> getVoteReward()
  // -> RPC de cadena. En demo se devuelve vacío en lugar de una pantalla de error.
  if (isDemoActive()) {
    return {rewardsAvailable: false, data: []};
  }

  const rewardAmount = await getVoteReward();
  const electionsWithSecrets = await getUserElectionsFromVcs();
  const rewardsByElection = await getRewardsStatusByElection(electionsWithSecrets);

  let filteredRewards = [];
  if (rewardAmount.raw > 0) {
    filteredRewards = rewardsByElection.filter(item => item.hasVoted);
  } else {
    filteredRewards = rewardsByElection.filter(item => item.hasReceived);
  }

  const rewardsData = filteredRewards.map(item => {
    const rewardStatus = item.hasReceived ? rewardStatuses.received
      : item.canBeClaimed ? rewardStatuses.available : rewardStatuses.pending

    return {
      id: item.electionId,
      title: 'Recompensa por votar',
      amount: rewardAmount.formatted,
      amountLabel: `+${rewardAmount.formatted} TVD`,
      currency: 'TVD',
      status: rewardStatus.key,
      statusLabel: rewardStatus.value,
      endAtLabel: item.endDate,
      processName: item.electionName,
      processLabel: item.electionName,
      type: 'Recompensa por votar',
      message: rewardStatus.message,
    }
  });

  return {
    rewardsAvailable: rewardAmount.raw > 0,
    data: rewardsData,
  }
};

export const useRewardsQuery = (options = {}) => {
  const {data, error, isLoading, isFetching, refetch} = useQuery({
    queryKey: ['rewards'],
    queryFn: () => fetchVoteRewards(),
    ...options,
  });

  return {
    rewards: data ?? { rewardsAvailable: false, data: [] },
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
    mutationFn: (electionId) => claimVoteReward(electionId, userData.account),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['rewards']});
    },
  });

  return {claimReward: mutate, claimRewardAsync: mutateAsync, isClaiming: isPending, error};
};
