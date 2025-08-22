import {useMutation, useQuery, useQueryClient} from 'react-query';
import {API_ENDPOINTS} from './client/api-endpoints';
import {guardianClient} from './client/guardians';
import axios from 'axios';

export const useGuardiansInviteQuery = () => {
  const queryClient = useQueryClient();
  return useMutation(guardianClient.postGuardiansInvite, {
    onSuccess: data => {
      return data;
    },

    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.GUARDIANS}${API_ENDPOINTS.INVITE}`,
      );
    },
  });
};
export const useGuardiansRecoveryRequestQuery = () => {
  const queryClient = useQueryClient();
  return useMutation(guardianClient.postRecoveryRequest, {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.GUARDIANS}${API_ENDPOINTS.RECOVERY}`,
      );
    },
  });
};
export const useCheckHasGuardiansQuery = () => {
  const queryClient = useQueryClient();
  return useMutation(guardianClient.postHasGuardians, {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(`${API_ENDPOINTS.HASGUARDIANS}`);
    },
  });
};

export const useGuardianDeleteQuery = () => {
  const queryClient = useQueryClient();
  return useMutation(guardianClient.deleteGuardian, {
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
  return useMutation(guardianClient.patchGuardian, {
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
  return useMutation(guardianClient.patchActionGuardian, {
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
  return useMutation(guardianClient.patchRecoveryGuardian, {
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

export const useMyGuardiansListQuery = options => {
  const {data, error, isLoading} = useQuery(
    [API_ENDPOINTS.MYGUARDIANS, options],
    ({queryKey}) =>
      guardianClient.getMyGuardians(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};
export function useHasGuardiansQuery(carnet, enabled) {
  const {data, isLoading, refetch} = useQuery(
    ['guardians', 'has', carnet],
    () => guardianClient.getHasGuardians({carnet}),
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
    () => guardianClient.getRecoveryGuardiansDetail({deviceId}),
    {
      enabled: !!deviceId && enabled,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );
  return {data: data, loading: isLoading, remove};
}
export function useGuardiansRecoveryStatusQuery(deviceId, enabled = true) {
  const {data, isLoading} = useQuery(
    ['recovery-detail', deviceId],
    () => guardianClient.getRecoveryStatus({deviceId}),
    {
      enabled: !!deviceId && enabled,
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  );
  return {data: data, loading: isLoading};
}
export function useGuardiansPayloadQuery(deviceId, enabled = false) {
  const {data, isLoading} = useQuery(
    ['recovery-payload', deviceId],
    () => guardianClient.getRecoveryPayload({deviceId}),
    {
      enabled: !!deviceId && enabled,
    },
  );
  return {data: data, loading: isLoading};
}

export const useMyGuardiansAllListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['myGuardiansAll'],
    () => guardianClient.getMyGuardiansAll(),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};
export const useMyGuardianInvitationsListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['myGuardiansAll'],
    () => guardianClient.getGuardiansInvitationsList(),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};
export const useMyGuardianRecoveryListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['guardiansRecovery'],
    () => guardianClient.getGuardiansRecoveryList(),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};
export const useGuardianAcceptedListQuery = options => {
  const {data, error, isLoading} = useQuery(
    ['my-guardians'],
    () => guardianClient.getGuardiansAcceptedList(),
    {
      keepPreviousData: true,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};

export const useMyGuardiansInvitationsListQuery = options => {
  const {data, error, isLoading} = useQuery(
    [`${API_ENDPOINTS.MYGUARDIANSALL}${API_ENDPOINTS.INVITATION}`, options],
    ({queryKey}) =>
      guardianClient.getMyGuardiansAll(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};
export const useMyGuardiansAdminListQuery = options => {
  const {data, error, isLoading} = useQuery(
    [API_ENDPOINTS.MYGUARDIANS, options],
    ({queryKey}) =>
      guardianClient.getMyGuardiansAll(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data: data?.edges,
    error,
    isLoading,
  };
};

