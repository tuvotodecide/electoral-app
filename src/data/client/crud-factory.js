
import {API_ENDPOINTS} from './api-endpoints';
import { Http } from './http';

export function crudFactory(endpoint) {
  return {
    get(params) {
      return Http.get(endpoint, params);
    },
    getwithSlug({slug}) {
      return Http.get(`${endpoint}/${slug}`);
    },
    post(data) {
      return Http.post(endpoint, data);
    },
    createform(data) {
      return Http.postform(endpoint, data);
    },
    update({id,data}) {
      return Http.put(`${endpoint}/${id}`, data);
    },
    patch({id, data}) {
      return Http.patch(`${endpoint}/${id}`, data);
    },

    delete({id}) {
      return Http.delete(`${endpoint}/${id}`);
    },
  };
}
