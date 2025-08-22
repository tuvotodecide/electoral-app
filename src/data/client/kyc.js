import {crudFactory} from './crud-factory';
import {Http} from './http';
import {API_ENDPOINTS} from './api-endpoints';

export const kycClient = {
  ...crudFactory(API_ENDPOINTS.KYC),

  postFind(data) {    
    return Http.post(`${API_ENDPOINTS.KYC}/${API_ENDPOINTS.FIND}`, data);
  },
  postFindPublic(data) {    
    return Http.post(`${API_ENDPOINTS.KYC}/${API_ENDPOINTS.FIND}-${API_ENDPOINTS.PUBLIC}`, data);
  },
  postStore(data) {
    return Http.post(`${API_ENDPOINTS.KYC}/${API_ENDPOINTS.STORE}`, data);
  },
};
