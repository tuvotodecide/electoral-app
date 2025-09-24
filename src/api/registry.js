import { API } from './http';
import { discoverableHashFromDni } from '../utils/idHash';

export async function registryCheckByDni(dni) {
  const discoverableHash = discoverableHashFromDni(dni);
  const { data } = await API.post('/registry/check', { discoverableHash });
  // { ok: true, exists: boolean }
  return { ...data, discoverableHash };
}

export async function registryResolveByDni(dni) {
  const discoverableHash = discoverableHashFromDni(dni);
  const { data } = await API.get('/registry/resolve', { params: { discoverableHash } });
  // { ok: true, did, accountAddress, ... } | { ok:false, error:'not-found' }
  return { ...data, discoverableHash };
}


export async function registryRegister(input) {
  const payload = {
    did: input.did,
    accountAddress: input.accountAddress,
    guardianContractAddress: input.guardianContractAddress ?? null,
    displayNamePublic: input.displayNamePublic ?? null,
  };
  if (input.discoverableHashOptIn && input.dni) {
    payload.discoverableHash = discoverableHashFromDni(input.dni);
  }
  const { data } = await API.post('/registry/register', payload);
  // { ok:true, id: <streamId> }
  return data;
}

export async function registryUpdateDisplayName(did, displayNamePublic) {
  const { data } = await API.patch('/registry/name', { did, displayNamePublic });
  return data;
}
