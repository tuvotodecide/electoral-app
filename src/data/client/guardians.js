import {crudFactory} from './crud-factory';
import {Http} from './http';
import {API_ENDPOINTS} from './api-endpoints';

export const guardianClient = {
  ...crudFactory(API_ENDPOINTS.GUARDIANS),

  postGuardiansInvite(data) {
    return Http.post(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.INVITE}`,
      data,
    );
  },
  postStore(data) {
    return Http.post(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.STORE}`, data);
  },
  patchGuardian({id, nickname}) {
    return Http.patch(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.INVITATION}/${id}/nickname`, {nickname});
  },
  deleteGuardian(invId) {
    return Http.delete(`${API_ENDPOINTS.GUARDIANS}/${invId}` );
  },
  getMyGuardians: () => {
    return Http.get(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.MYGUARDIANS}`);
  },
  getMyGuardiansAll: () => {
    return Http.get(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.MYGUARDIANSALL}`);
  },
};
