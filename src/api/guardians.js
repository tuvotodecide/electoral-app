import {API} from './http';

export async function inviteGuardian(inviterDid, guardianDid, nickname) {
  const {data} = await API.post('/guardians/invite', {
    inviterDid,
    guardianDid,
    nickname,
  });
  // { ok:true, invId }
  return data;
}

export async function listMyInvitations(guardianDid) {
  const {data} = await API.get('/guardians/invitations', {
    params: {guardianDid},
  });
  // { ok:true, invitations: [...] }
  return data;
}

export async function acceptInvitation(
  invId,
  guardianDid,
  proposedGuardianAddress,
) {
  const {data} = await API.patch(`/guardians/invitation/${invId}/accept`, {
    guardianDid,
    proposedGuardianAddress,
  });
  return data;
}

export async function rejectInvitation(invId, guardianDid) {
  const {data} = await API.patch(`/guardians/invitation/${invId}/reject`, {
    guardianDid,
  });
  return data;
}

export async function listMyGuardians(ownerDid) {
  const {data} = await API.get('/guardians/my-guardians', {params: {ownerDid}});
  // { ok:true, guardians: [{ id, guardianDid, nickname, status:'ACCEPTED' }]}
  return data;
}

export async function updateGuardianNickname(invId, ownerDid, nickname) {
  const {data} = await API.patch(`/guardians/invitation/${invId}/nickname`, {
    ownerDid,
    nickname,
  });
  return data;
}

export async function removeGuardian(invId, ownerDid) {
  const {data} = await API.delete(`/guardians/${invId}`, {params: {ownerDid}});
  return data;
}
