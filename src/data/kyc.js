import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { kycClient } from './client/kyc';

export const useKycFindPublicQuery = () => {
  return useMutation({
    mutationFn: kycClient.postFindPublic, 
    onSuccess: data => {
      return data;
    },

    onError: error => {
      if (isAxiosError(error)) {
     
      }
    }
  });
};

