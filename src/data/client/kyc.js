import { BACKEND_IDENTITY, IDENTITY_KEY } from '@env';
import {crudFactory} from './crud-factory';
import {Http} from './http';
import {API_ENDPOINTS} from './api-endpoints';
import wira from 'wira-sdk';


export const registryApi = new wira.RegistryApi(BACKEND_IDENTITY, IDENTITY_KEY);

export const kycClient = {
  ...crudFactory(API_ENDPOINTS.KYC),

  postFind(data) {    
    return Http.post(`${API_ENDPOINTS.KYC}/${API_ENDPOINTS.FIND}`, data);
  },
  postFindPublic({identifier}) {    
    return registryApi.registryResolveByDni(identifier);
  },
  postStore(data) {
    return Http.post(`${API_ENDPOINTS.KYC}/${API_ENDPOINTS.STORE}`, data);
  },
};
