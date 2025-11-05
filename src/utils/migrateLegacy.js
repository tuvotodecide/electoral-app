// utils/migrateLegacy.js
import axios from 'axios';
import {BACKEND, BACKEND_IDENTITY, CRED_TYPE, CRED_EXP_DAYS, PROVIDER_NAME, CHAIN} from '@env';
import {buildSiweAuthSig} from './siweRn';
import {decryptVCWithPin} from './vcCrypto';
import wira from 'wira-sdk';
import {checkPin, getSecrets} from './Cifrate';
import { availableNetworks, sponsorshipPolicyId } from '../api/params';

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
    dateOfBirth: birthDate ?? 0,
  };
}

export async function migrateIfNeeded(pin) {
  const sanitizedPin = typeof pin === 'string' ? pin.trim() : pin;
  if (!LEGACY_MIGRATION_ENABLED) return {ok: false, reason: 'disabled'};

  const pinOk = await checkPin(sanitizedPin);
  if (!pinOk) return {ok: false, reason: 'bad_pin'};

  const stored = await getSecrets();
  if (!stored) return {ok: false, reason: 'no_local_secrets'};

  const payload = stored?.payloadQr || {};
  const {streamId, privKey} = payload;
  if (!streamId || !privKey) return {ok: false, reason: 'no_legacy_fields'};

  const localCipher = stored.payloadQr?.vcCipher;

  let legacyVc = null;
  if (localCipher) {
    try {
      legacyVc = await decryptVCWithPin(localCipher, sanitizedPin);
    } catch (error) {
      return {ok: false, reason: 'decrypt_local_failed', error};
    }
  } else {
    let load;
    try {
      load = await axios.post(
        `${BACKEND}kyc/load`,
        {streamId},
        {withCredentials: true},
      );
      if (!load.data?.ok) {
        return {
          ok: false,
          reason: 'server_load_failed',
          endpoint: `${BACKEND}kyc/load`,
          response: load.data,
        };
      }
    } catch (error) {
      return {
        ok: false,
        reason: 'server_down_load',
        endpoint: `${BACKEND}kyc/load`,
        error,
      };
    }

    const {dataHash} = load.data.data || {};
    if (!dataHash) return {ok: false, reason: 'no_datahash'};

    let dec;
    try {
      const authSig = await buildSiweAuthSig(privKey, dataHash);
      dec = await axios.post(
        `${BACKEND}kyc/decrypt`,
        {streamId, authSig},
        {withCredentials: true},
      );
      if (!dec.data?.ok || !dec.data.vc) {
        return {
          ok: false,
          reason: 'server_dec_failed',
          endpoint: `${BACKEND}kyc/decrypt`,
          response: dec.data,
        };
      }
    } catch (error) {
      return {
        ok: false,
        reason: 'server_down_dec',
        endpoint: `${BACKEND}kyc/decrypt`,
        error,
      };
    }

    legacyVc = dec.data.vc;
  }

  if (!legacyVc) return {ok: false, reason: 'no_legacy_vc'};

  const claims = mapLegacyVcToNewClaims(legacyVc);

  const registerer = new wira.Registerer(
    BACKEND_IDENTITY,
    availableNetworks[CHAIN].bundler,
    sponsorshipPolicyId,
  );

  try {
    await registerer.createVC(
      CHAIN,
      claims,
      CRED_TYPE,
      CRED_EXP_DAYS,
      privKey,
    );
    await registerer.createWallet(claims.nationalIdNumber);
  } catch (error) {
    return {ok: false, reason: 'create_vc_failed', error};
  }

  try {
    const encrypted = await registerer.storeOnDevice(
      PROVIDER_NAME,
      sanitizedPin,
      false,
    );
    const response = await registerer.storeDataOnServer();
    if (!response.ok) {
      throw new Error(`Failed to store data on server: ${response.error}`);
    }
    return {ok: true, migrated: true, payload: encrypted};
  } catch (error) {
    return {ok: false, reason: 'store_on_device_failed', error};
  }
}

export async function getLegacyData(data) {
  const load = await axios.post(
    `${BACKEND}kyc/load`,
    {streamId: data.streamId},
    {withCredentials: true},
  );

  if(!load.data?.ok) {
    throw new Error('Failed to retrieve legacy data');
  }

  const {dataHash} = load.data.data || {};
  if (!dataHash) {
    throw new Error('Failed to retrieve legacy data hash');
  };

  const authSig = await buildSiweAuthSig(data.privKey, dataHash);
  dec = await axios.post(
    `${BACKEND}kyc/decrypt`,
    {streamId: data.streamId, authSig},
    {withCredentials: true},
  );
  if (!dec.data?.ok || !dec.data.vc) {
    throw new Error('Failed to decrypt legacy data');
  }

  const credData = {
    fullName: dec.data.vc.credentialSubject.fullName,
    governmentIdentifier: dec.data.vc.credentialSubject.governmentIdentifier,
    dateOfBirth: dec.data.vc.credentialSubject.dateOfBirth,
  }

  if(!credData.fullName || !credData.governmentIdentifier || !credData.dateOfBirth) {
    throw new Error('Not enough data found for migration')
  }

  return credData;
}

export async function checkLegacyDataExists() {
  const stored = await getSecrets();
  return !!stored;
}