import AsyncStorage from '@react-native-async-storage/async-storage';
import { JWT_KEY, SESSION, TTL_MIN } from '../common/constants';

const EXPIRES_KEY = `${JWT_KEY}_EXPIRES`;

export async function startSession(jwt, ttl = TTL_MIN) {
  if (jwt) {
    const exp = Date.now() + ttl * 60_000;
    await AsyncStorage.multiSet([
      [JWT_KEY, jwt],
      [EXPIRES_KEY, exp.toString()],
    ]);
  } else {
    // Si no hay token, eliminamos cualquier sesión previa
    await clearSession();
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([JWT_KEY, EXPIRES_KEY]);
}

export async function isSessionValid() {
  const [[, jwt], [, exp]] = await AsyncStorage.multiGet([
    JWT_KEY,
    EXPIRES_KEY,
  ]);
  return Boolean(jwt) && Number(exp) > Date.now();
}

export async function getJwt() {
  return AsyncStorage.getItem(JWT_KEY);
}