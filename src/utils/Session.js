import AsyncStorage from '@react-native-async-storage/async-storage';
import {EXPIRES_KEY, JWT_KEY, JWT_KEY_EXPO, SESSION, TTL_MIN} from '../common/constants';
import { InternetCredentials } from '../data/client/internetCredentials';

async function migrateIfLegacy() {
  const legacy = await AsyncStorage.getItem(JWT_KEY);
  if (!legacy) return;

  await InternetCredentials.saveInternetCredentials(JWT_KEY_EXPO, 'user', legacy, {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await AsyncStorage.removeItem(JWT_KEY);
}

export async function startSession(jwt, ttl = TTL_MIN) {
  await migrateIfLegacy();
  if (jwt) {
    await InternetCredentials.saveInternetCredentials(JWT_KEY_EXPO, 'user', jwt);
    const exp = Date.now() + ttl * 60_000;
    await AsyncStorage.multiSet([
      [EXPIRES_KEY, exp.toString()],
      [SESSION, '1'],
    ]);
  } else {
    await clearSession();
  }
}

export async function startLocalSession(ttl = TTL_MIN) {
  await migrateIfLegacy();
  const exp = Date.now() + ttl * 60_000;
  await AsyncStorage.multiSet([
    [EXPIRES_KEY, exp.toString()],
    [SESSION, '1'],
  ]);
}

export async function clearSession() {
  await InternetCredentials.resetInternetCredentials(JWT_KEY_EXPO);
  await AsyncStorage.multiRemove([JWT_KEY, EXPIRES_KEY, SESSION]);
}

export async function isSessionValid() {
  await migrateIfLegacy();
  const isLocalSession = await AsyncStorage.getItem(SESSION);
  const creds = await InternetCredentials.getInternetCredentials(JWT_KEY_EXPO);
  const exp = await AsyncStorage.getItem(EXPIRES_KEY);
  return (
    (isLocalSession === '1' || !!creds?.password) &&
    Number(exp) > Date.now()
  );
}


export async function getJwt() {
  await migrateIfLegacy();
  const creds = await InternetCredentials.getInternetCredentials(JWT_KEY_EXPO);
  return creds?.password ?? null;
}


export async function refreshSession(ttl = TTL_MIN) {
  const isLocalSession = await AsyncStorage.getItem(SESSION);
  const jwt = await getJwt();
  if (isLocalSession !== '1' && !jwt) return;
  const exp = Date.now() + ttl * 60_000;
  await AsyncStorage.multiSet([
    [EXPIRES_KEY, exp.toString()],
    [SESSION, '1'],
  ]);
}
