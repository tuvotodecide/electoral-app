import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@FIN/LOGIN_ATTEMPTS';

export async function getAttempts() {
  const n = await AsyncStorage.getItem(KEY);
  return n ? parseInt(n, 10) : 0;
}

export async function incAttempts() {
  const n = (await getAttempts()) + 1;
  await AsyncStorage.setItem(KEY, String(n));
  return n;
}

export async function resetAttempts() {
  await AsyncStorage.removeItem(KEY);
}

export async function isLocked() {
  const n = await getAttempts();
  return n >= 5;
}
