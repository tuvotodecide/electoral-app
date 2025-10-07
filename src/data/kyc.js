import {useMutation, useQuery, useQueryClient} from 'react-query';
import {API_ENDPOINTS} from './client/api-endpoints';
import {kycClient} from './client/kyc';
import axios from 'axios';

export const useKycFindQuery = () => {
  const queryClient = useQueryClient();

  return useMutation(kycClient.postFind, {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
       
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.KYC}${API_ENDPOINTS.FIND}`,
      );
    },
  });
};
export const useKycFindPublicQuery = () => {
  return useMutation(kycClient.postFindPublic, {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
     
      }
    }
  });
};
export const useKycRegisterQuery = () => {
  const queryClient = useQueryClient();

  return useMutation(kycClient.postStore, {
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (axios.isAxiosError(error)) {

      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(
        `${API_ENDPOINTS.KYC}${API_ENDPOINTS.STORE}`,
      );
    },
  });
};
