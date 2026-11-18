import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { DRAFT } from '../common/constants';

export const jsonSafe = (obj) =>
  JSON.stringify(obj, (_k, v) =>
    typeof v === 'bigint' ? v.toString() : v,
  );

// El PIN abre el vault del SDK y el identityToken registra el DNI: no van en
// AsyncStorage (texto plano) sino en SecureStore, solo en este dispositivo.
const SECRET_FIELDS = ['originalPin', 'identityToken'];
const DRAFT_SECRETS = `${DRAFT}.secrets`.replace(/[^\w.-]/g, '_');
const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const splitSecrets = (data = {}) => {
  const plain = {...data};
  const secrets = {};
  for (const field of SECRET_FIELDS) {
    if (plain[field] !== undefined) {
      secrets[field] = plain[field];
    }
    delete plain[field];
  }
  return {plain, secrets};
};

export const saveDraft = async data => {
  const {plain, secrets} = splitSecrets(data);
  if (Object.keys(secrets).length > 0) {
    await SecureStore.setItemAsync(DRAFT_SECRETS, JSON.stringify(secrets), SECURE_OPTIONS);
  } else {
    await SecureStore.deleteItemAsync(DRAFT_SECRETS, SECURE_OPTIONS);
  }
  await AsyncStorage.setItem(DRAFT, jsonSafe(plain));
};

export const getDraft = async () => {
  const j = await AsyncStorage.getItem(DRAFT);
  if (!j) {
    return null;
  }
  const draft = JSON.parse(j);
  let secrets = {};
  try {
    const raw = await SecureStore.getItemAsync(DRAFT_SECRETS, SECURE_OPTIONS);
    secrets = raw ? JSON.parse(raw) : {};
  } catch {
    secrets = {};
  }
  return {...draft, ...secrets};
};

/** Actualiza campos del borrador (p. ej. el progreso) sin perder el resto. */
export const updateDraft = async changes => {
  const current = (await getDraft()) ?? {};
  await saveDraft({...current, ...changes});
};

export const clearDraft = async () => {
  await AsyncStorage.removeItem(DRAFT);
  await SecureStore.deleteItemAsync(DRAFT_SECRETS, SECURE_OPTIONS);
};
