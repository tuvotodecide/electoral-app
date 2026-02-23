import AsyncStorage from '@react-native-async-storage/async-storage';
import {EXPIRES_KEY, JWT_KEY, SESSION, TTL_MIN} from '../common/constants';
import * as Keychain from 'react-native-keychain';



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
  await Keychain.resetInternetCredentials({server: JWT_KEY});
  await AsyncStorage.multiRemove([JWT_KEY, EXPIRES_KEY, SESSION]);
}

export async function isSessionValid() {
  await migrateIfLegacy();
  const isLocalSession = await AsyncStorage.getItem(SESSION);
  const creds = await Keychain.getInternetCredentials(JWT_KEY);
  const exp = await AsyncStorage.getItem(EXPIRES_KEY);
  return (
    (isLocalSession === '1' || !!creds?.password) &&
    Number(exp) > Date.now()
  );
}


export async function getJwt() {
  await migrateIfLegacy();
  const creds = await Keychain.getInternetCredentials(JWT_KEY); 
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
