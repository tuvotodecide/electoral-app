import {useMutation, useQuery, useQueryClient} from 'react-query';
import {API_ENDPOINTS} from './client/api-endpoints';
import {guardianClient} from './client/guardians';

export const useGuardiansInviteQuery = () => {
  const queryClient = useQueryClient();
  return useMutation(guardianClient.postGuardiansInvite, {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        console.log(error);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.GUARDIANS}${API_ENDPOINTS.INVITE}`,
      );
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
        console.log(error);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.MYGUARDIANSALL}`,
      );
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
        console.log(error);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.MYGUARDIANSALL}`,
      );
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
    data : data?.edges,
    error,
    isLoading,
  };
};
export const useMyGuardiansAllListQuery = options => {
  const {data, error, isLoading} = useQuery(
    [API_ENDPOINTS.MYGUARDIANSALL, options],
    ({queryKey}) =>
      guardianClient.getMyGuardiansAll(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data : data?.edges,
    error,
    isLoading,
  };
};
export const useMyGuardiansInvitationsListQuery = options => {
  const {data, error, isLoading} = useQuery(
    [API_ENDPOINTS.MYGUARDIANSALL, options],
    ({queryKey}) =>
      guardianClient.getMyGuardiansAll(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data : data?.edges,
    error,
    isLoading,
  };
};
export const useMyGuardiansAdminListQuery = options => {
  const {data, error, isLoading} = useQuery(
    [API_ENDPOINTS.MYGUARDIANSALL, options],
    ({queryKey}) =>
      guardianClient.getMyGuardiansAll(Object.assign({}, queryKey[1])),
    {
      keepPreviousData: true,
    },
  );

  return {
    data : data?.edges,
    error,
    isLoading,
  };
};


// export const useKycRegisterQuery = () => {
//   const queryClient = useQueryClient();

//   return useMutation(guardianClient.postStore, {
//     onSuccess: data => {
//       return data;
//     },

//     onError: error => {
//       if (axios.isAxiosError(error)) {
//         console.log(error);
//       }
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries(
//         `${API_ENDPOINTS.KYC}${API_ENDPOINTS.STORE}`,
//       );
//     },
//   });
// };
