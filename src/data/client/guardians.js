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
  postRecoveryRequest({dni, deviceId}) {
    return Http.post(
      `${API_ENDPOINTS.SESSION}/${API_ENDPOINTS.RECOVERY}/${API_ENDPOINTS.REQUEST}`,
      {dni, deviceId},
    );
  },
  postHasGuardians({data}) {
    return Http.post(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.HASGUARDIANS}`,
      data,
    );
  },
  getHasGuardians({carnet}) {
    return Http.get(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.HAS}/${carnet}`,
    );
  },
  getRecoveryGuardiansDetail({deviceId}) {
    return Http.get(
      `${API_ENDPOINTS.SESSION}/${API_ENDPOINTS.RECOVERY}/${API_ENDPOINTS.DETAIL}?deviceId=${deviceId}`,
    );
  },
  getRecoveryPayload({deviceId}) {
    return Http.get(
      `${API_ENDPOINTS.SESSION}/${API_ENDPOINTS.RECOVERY}/${API_ENDPOINTS.PAYLOAD}?deviceId=${deviceId}`,
    );
  },
  getRecoveryStatus({deviceId}) {
    return Http.get(
      `${API_ENDPOINTS.SESSION}/${API_ENDPOINTS.RECOVERY}/${API_ENDPOINTS.STATUS}?deviceId=${deviceId}`,
    );
  },

  postStore(data) {
    return Http.post(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.STORE}`, data);
  },
  patchGuardian({id, nickname}) {
    return Http.patch(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.INVITATION}/${id}/nickname`,
      {nickname},
    );
  },
  patchActionGuardian({id, action}) {
    return Http.patch(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.INVITATION}/${id}/${action}`,
    );
  },
  patchRecoveryGuardian({id, action}) {
    return Http.patch(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.RECOVERY}/${id}/${action}`,
    );
  },
  deleteGuardian(invId) {
    return Http.delete(`${API_ENDPOINTS.GUARDIANS}/${invId}`);
  },
  getMyGuardians: () => {
    return Http.get(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.MYGUARDIANS}`);
  },
  getMyGuardiansAll: () => {
    return Http.get(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.MYGUARDIANSALL}`,
    );
  },
  getGuardiansRecoveryList: () => {
    return Http.get(
      `${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.RECOVERY}/${API_ENDPOINTS.PENDING}`,
    );
  },
  getGuardiansAcceptedList: () => {
    return Http.get(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.MYGUARDIANS}`);
  },
  getGuardiansInvitationsList: () => {
    return Http.get(`${API_ENDPOINTS.GUARDIANS}/${API_ENDPOINTS.INVITATIONS}`);
  },
};
