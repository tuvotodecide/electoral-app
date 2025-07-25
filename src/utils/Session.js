import AsyncStorage from '@react-native-async-storage/async-storage';
import {JWT_KEY, SESSION, TTL_MIN} from '../common/constants';
import * as Keychain from 'react-native-keychain';

const EXPIRES_KEY = `${JWT_KEY}_EXPIRES`;

async function migrateIfLegacy() {
  const legacy = await AsyncStorage.getItem(JWT_KEY);
  if (!legacy) return;

  await Keychain.setInternetCredentials(JWT_KEY, 'user', legacy, {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await AsyncStorage.removeItem(JWT_KEY);
}

export async function startSession(jwt, ttl = TTL_MIN) {
  await migrateIfLegacy();
  if (jwt) {
    await Keychain.setInternetCredentials(JWT_KEY, 'user', jwt, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    const exp = Date.now() + ttl * 60_000;
    await AsyncStorage.setItem(EXPIRES_KEY, exp.toString());
  } else {
    await clearSession();
  }
}

export async function clearSession() {
  await Keychain.resetInternetCredentials({server: JWT_KEY});
  await AsyncStorage.multiRemove([JWT_KEY, EXPIRES_KEY]);
}

export async function isSessionValid() {
  await migrateIfLegacy();
  const creds = await Keychain.getInternetCredentials(JWT_KEY);
  const exp = await AsyncStorage.getItem(EXPIRES_KEY);
  return !!creds?.password && Number(exp) > Date.now();
}


export async function getJwt() {
  await migrateIfLegacy();
  const creds = await Keychain.getInternetCredentials(JWT_KEY);
  return creds?.password ?? null;
}


export async function refreshSession(ttl = TTL_MIN) {
  const jwt = await getJwt();
  if (!jwt) return;
  const exp = Date.now() + ttl * 60_000;
  await AsyncStorage.setItem(EXPIRES_KEY, exp.toString());
}