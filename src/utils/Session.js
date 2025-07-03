import AsyncStorage from '@react-native-async-storage/async-storage';
import {JWT_KEY, SESSION, TTL_MIN} from '../common/constants';

const EXPIRES_KEY = `${JWT_KEY}_EXPIRES`;

export async function startSession(jwt, ttl = TTL_MIN) {
  const exp = Date.now() + ttl * 60_000;
  await AsyncStorage.multiSet([
    [JWT_KEY, jwt],
    [EXPIRES_KEY, exp.toString()],
  ]);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([JWT_KEY, EXPIRES_KEY]);
}

export async function isSessionValid() {
  const [[, jwt], [, exp]] = await AsyncStorage.multiGet([
    JWT_KEY,
    EXPIRES_KEY,
  ]);
  return !!jwt && Number(exp) > Date.now();
}

export async function getJwt() {
  return AsyncStorage.getItem(JWT_KEY);
}
