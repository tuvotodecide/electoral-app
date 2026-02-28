import { BACKEND_IDENTITY } from '@env';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import wira from 'wira-sdk';

export const guardianApi = new wira.GuardiansApi(BACKEND_IDENTITY);

export const useGuardiansInviteQuery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => guardianApi.invite(input),
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
  return useMutation({
    mutationFn: (input) => guardianApi.requestRecovery(input),
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
  return useMutation({
    mutationFn: (input) => guardianApi.removeGuardian(
      input.invId,
      input.ownerDid
    ),
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
  return useMutation({
    mutationFn: (input) => guardianApi.updateGuardianNickname(
      input.invId,
      {
        ownerDid: input.ownerDid,
        nickname: input.nickname
      }
    ),
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
  return useMutation({
    mutationFn: (input) => guardianApi.respondInvitation(
      input.id,
      input.did,
      input.action
    ), 
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
  return useMutation({
    mutationFn: (input) => guardianApi.respondRecovery(
      input.id,
      input.action,
      {
        guardianDid: input.did
      }
    ),
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
  const {data, isLoading, refetch} = useQuery({
    queryKey: ['guardians', 'has', carnet],
    queryFn: () => guardianApi.hasGuardians(carnet),
    enabled,
    select: res => res.has,
  });
  return {has: data ?? false, loading: isLoading, refetch};
}

export function useGuardiansRecoveryDetailQuery(deviceId, enabled = true) {
  const queryClient = useQueryClient();
  const {data, isLoading} = useQuery({
    queryKey: ['recovery-detail', deviceId],
    queryFn: () => guardianApi.recoveryDetail(deviceId),
    enabled: !!deviceId && enabled,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
  const remove = () => queryClient.removeQueries({queryKey: ['recovery-detail', deviceId]});
  return {data: data, loading: isLoading, remove};
}
export function useGuardiansRecoveryStatusQuery(deviceId, enabled = true) {
  const {data, isLoading} = useQuery({
    queryKey: ['recovery-detail', deviceId],
    queryFn: () => guardianApi.recoveryStatus(deviceId),
    enabled: !!deviceId && enabled,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
  return {data: data, loading: isLoading};
}

export const useMyGuardiansAllListQuery = options => {
  const {data, error, isLoading} = useQuery({
    queryKey: ['myGuardiansAll'],
    queryFn: () => guardianApi.myGuardians(options.did),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.guardians,
    error,
    isLoading,
  };
};
export const useMyGuardianInvitationsListQuery = options => {
  const {data, error, isLoading} = useQuery({
    queryKey: ['myGuardiansAll'],
    queryFn: () => {
      return guardianApi.listInvitations(options.did)
    },
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.invitations,
    error,
    isLoading,
  };
};
export const useMyGuardianRecoveryListQuery = options => {
  const {data, error, isLoading} = useQuery({
    queryKey: ['guardiansRecovery'],
    queryFn: () => guardianApi.listRecoveries(options.did, options.status),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.requests,
    error,
    isLoading,
  };
};
export const useGuardiansThresholdQuery = options => {
  const {data, error, isLoading} = useQuery({
    queryKey: ['guardiansThreshold', options.did],
    queryFn: () => guardianApi.getThreshold(options.did),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.threshold,
    error,
    isLoading,
  };
};