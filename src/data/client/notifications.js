import {crudFactory} from './crud-factory';
import {Http} from './http';
import {API_ENDPOINTS} from './api-endpoints';

export const notificationsClient = {
  ...crudFactory(API_ENDPOINTS.PUSHLOG),
  paginated: () => {
 
    return Http.get(API_ENDPOINTS.PUSHLOG);
  },

 
};
