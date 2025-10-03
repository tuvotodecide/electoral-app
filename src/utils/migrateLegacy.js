// utils/migrateLegacy.js
import axios from 'axios';
import {BACKEND} from '@env';
import {buildSiweAuthSig} from './siweRn';
import {decryptVCWithPin} from './vcCrypto';
import wira from 'wira-sdk';
import {BACKEND_IDENTITY, BUNDLER, SPONSORSHIP_POLICY, CRED_TYPE, CRED_EXP_DAYS, PROVIDER_NAME} from '@env';
import { checkPin, getSecrets } from './Cifrate';

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

export async function migrateIfNeeded(pin) {
  if (!LEGACY_MIGRATION_ENABLED) return {ok:false, reason:'disabled'};

  const pinOk = await checkPin(pin);
  if (!pinOk) return {ok: false, reason: 'bad_pin'};

  const stored = await getSecrets();
  if (!stored) return {ok: false, reason: 'no_local_secrets'};

  const payload = stored?.payloadQr || {};

  const {streamId, privKey} = payload;
  if (!streamId || !privKey) return {ok:false, reason:'no_legacy_fields'};

  const localCipher = stored.payloadQr?.vcCipher;

  let legacyVc = null
  if(localCipher) {
    legacyVc = await decryptVCWithPin(localCipher, pin.trim());
  } else {
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

    legacyVc = dec.data.vc;
  }

  const claims = mapLegacyVcToNewClaims(legacyVc);

  const registerer = new wira.Registerer(
    BACKEND_IDENTITY,
    BUNDLER,
    SPONSORSHIP_POLICY,
  );

  await registerer.createVC(
    CHAIN,
    claims,
    CRED_TYPE,
    CRED_EXP_DAYS,
    privKey,
  );

  const encrypted = await registerer.storeOnDevice(PROVIDER_NAME, pin, false);

  return {ok:true, migrated:true, payload: encrypted};
}
