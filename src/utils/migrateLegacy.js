// utils/migrateLegacy.js
import axios from 'axios';
import {BACKEND} from '@env';
import {buildSiweAuthSig} from './siweRn';
import * as Keychain from 'react-native-keychain';
import {encryptVCWithPin} from './vcCrypto';
import {didFromEthAddress} from '../api/did';
import {createCredential, waitForVC} from './issuerClient';
import {Wallet} from 'ethers';

export const LEGACY_MIGRATION_ENABLED = true;

function mapLegacyVcToNewClaims(legacyVc) {
  const cs = legacyVc?.credentialSubject || {};
  const fullName =
    cs.fullName || cs.firstName || cs.nombreCompleto || cs.nombre || '';
  const nationalIdNumber =
    cs.governmentIdentifier || cs.nationalIdNumber || cs.documentNumber || cs.numeroDoc || '';
  const birthDateSec =
    cs.dateOfBirth ?? cs.birthDate ?? cs.birthdate ?? cs.fechaNacimiento ?? null;

  const birthDate =
    typeof birthDateSec === 'number'
      ? birthDateSec
      : (typeof birthDateSec === 'string' && /^\d+$/.test(birthDateSec)
          ? parseInt(birthDateSec, 10)
          : null);

  return {
    fullName: String(fullName || '').trim(),
    nationalIdNumber: String(nationalIdNumber || '').trim(),
    birthDate: birthDate ?? 0,
  };
}

export async function migrateFromBackendIfNeeded(stored, pin) {
  if (!LEGACY_MIGRATION_ENABLED) return {ok:false, reason:'disabled'};

  const payload = stored?.payloadQr || {};
  if (payload.vcCipher) return {ok:true, migrated:false, payload};

  const {streamId, privKey} = payload;
  if (!streamId || !privKey) return {ok:false, reason:'no_legacy_fields'};

  let load;
  try {
    load = await axios.post(`${BACKEND}kyc/load`, {streamId}, {withCredentials: true});
    if (!load.data?.ok) return {ok:false, reason:'server_load_failed'};
  } catch {
    return {ok:false, reason:'server_down_load'};
  }

  const {dataHash} = load.data.data || {};
  if (!dataHash) return {ok:false, reason:'no_datahash'};

  let dec;
  try {
    const authSig = await buildSiweAuthSig(privKey, dataHash);
    dec = await axios.post(`${BACKEND}kyc/decrypt`, {streamId, authSig}, {withCredentials: true});
    if (!dec.data?.ok || !dec.data.vc) return {ok:false, reason:'server_dec_failed'};
  } catch {
    return {ok:false, reason:'server_down_dec'};
  }

  const legacyVc = dec.data.vc;
  console.log(legacyVc);
  
  
  const claims = mapLegacyVcToNewClaims(legacyVc);
  console.log(claims);


  let address = payload.account;
  if (!address) {
    try { address = new Wallet(privKey).address; } catch {}
  }
  if (!address) return {ok:false, reason:'no_eth_address'};

  const {did: subjectDid} = didFromEthAddress(address);
  console.log(subjectDid);
  
  let credentialId;
  try {
    const {id} = await createCredential(subjectDid, claims);
    credentialId = id;
  } catch {
    return {ok:false, reason:'issuer_create_failed'};
  }

  let newVc;
  try {
    newVc = await waitForVC(credentialId);
  } catch {
    return {ok:false, reason:'issuer_wait_failed'};
  }

  const vcCipher = await encryptVCWithPin(newVc, pin);

  const newPayload = {
    ...payload,
    account: address,
    did: subjectDid,
    vcCipher,
  };
  delete newPayload.streamId; 

  await Keychain.setGenericPassword(
    'finline.wallet.vc',
    JSON.stringify(newPayload),
    {
      service: 'finline.wallet.vc',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );

  return {ok:true, migrated:true, payload:newPayload};
}
