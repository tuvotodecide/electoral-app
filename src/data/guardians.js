import {useMutation, useQuery, useQueryClient} from 'react-query';
import axios from 'axios';
import wira from 'wira-sdk';
import {BACKEND_IDENTITY} from '@env';

export const guardianApi = new wira.GuardiansApi(BACKEND_IDENTITY);

export const useGuardiansInviteQuery = () => {
  const queryClient = useQueryClient();
  return useMutation((input) => guardianApi.invite(input), {
    onSuccess: data => {
      return data;
    },

    onSettled: () => {
      queryClient.invalidateQueries(
        guardianApi.inviteUrl,
      );
    },
  });
};
export const useGuardiansRecoveryRequestQuery = () => {
  const queryClient = useQueryClient();
  return useMutation((input) => guardianApi.requestRecovery(input), {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        guardianApi.requestRecoveryUrl,
      );
    },
  });
};

export const useGuardianDeleteQuery = () => {
  const queryClient = useQueryClient();
  return useMutation((input) => guardianApi.removeGuardian(
    input.invId,
    input.ownerDid
  ), {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['myGuardiansAll']);
    },
  });
};
export const useGuardianPatchQuery = () => {
  const queryClient = useQueryClient();
  return useMutation((input) => guardianApi.updateGuardianNickname(
    input.invId,
    {
      ownerDid: input.ownerDid,
      nickname: input.nickname
    }
  ), {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['myGuardiansAll']);
    },
  });
};
export const useGuardianInvitationActionQuery = () => {
  const queryClient = useQueryClient();
  return useMutation((input) => guardianApi.respondInvitation(
    input.id,
    input.did,
    input.action
  ), {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['myGuardiansAll']);
    },
  });
};
export const useRecoveryActionQuery = () => {
  const queryClient = useQueryClient();
  return useMutation((input) => guardianApi.respondRecovery(
    input.id,
    input.action,
    {
      guardianDid: input.did
    }
  ), {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['guardiansRecovery']);
    },
  });
};

export function useHasGuardiansQuery(carnet, enabled) {
  const {data, isLoading, refetch} = useQuery(
    ['guardians', 'has', carnet],
    () => guardianApi.hasGuardians(carnet),
    {
      enabled,
      select: res => res.has,
    },
  );
  return {has: data ?? false, loading: isLoading, refetch};
}

export function useGuardiansRecoveryDetailQuery(deviceId, enabled = true) {
  const {data, isLoading, remove} = useQuery(
    ['recovery-detail', deviceId],
    () => guardianApi.recoveryDetail(deviceId),
    {
      enabled: !!deviceId && enabled,
      refetchInterval: 10000,
      refetchIntervalInBackground: true,
    },
  );
  return {data: data, loading: isLoading, remove};
}
export function useGuardiansRecoveryStatusQuery(deviceId, enabled = true) {
  const {data, isLoading} = useQuery(
    ['recovery-detail', deviceId],
    () => guardianApi.recoveryStatus(deviceId),
    {
      enabled: !!deviceId && enabled,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );
  return {data: data, loading: isLoading};
}

export const useMyGuardiansAllListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['myGuardiansAll'],
    () => guardianApi.myGuardians(options.did),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.guardians,
    error,
    isLoading,
  };
};
export const useMyGuardianInvitationsListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['myGuardiansAll'],
    () => {
      return guardianApi.listInvitations(options.did)
    },
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.invitations,
    error,
    isLoading,
  };
};
export const useMyGuardianRecoveryListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['guardiansRecovery'],
    () => guardianApi.listRecoveries(options.did, options.status),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.requests,
    error,
    isLoading,
  };
};
export const useGuardiansThresholdQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['guardiansThreshold', options.did],
    () => guardianApi.getThreshold(options.did),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.threshold,
    error,
    isLoading,
  };
};