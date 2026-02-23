import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ENDPOINTS } from './client/api-endpoints';
import { kycClient } from './client/kyc';

export const useKycFindQuery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kycClient.postFind,
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
  return useMutation({
    mutationFn: kycClient.postFindPublic, 
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

  return useMutation({
    mutationFn: kycClient.postStore,
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
