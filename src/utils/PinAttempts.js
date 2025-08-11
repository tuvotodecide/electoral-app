import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@FIN/LOGIN_ATTEMPTS';
const LOCK_KEY = '@FIN/LOCK_UNTIL';
const LOCK_MS = 15 * 60_000;

export async function getAttempts() {
  const n = await AsyncStorage.getItem(KEY);
  return n ? parseInt(n, 10) : 0;
}

export async function incAttempts() {
  const n = (await getAttempts()) + 1;
  await AsyncStorage.setItem(KEY, String(n));
  if (n >= 5) {
   
    await AsyncStorage.setItem(LOCK_KEY, String(Date.now() + LOCK_MS));
  }
  return n;
}
export async function resetAttempts() {
  await AsyncStorage.multiRemove([KEY, LOCK_KEY]);
}

export async function isLocked() {
  const until = await AsyncStorage.getItem(LOCK_KEY);
  
  if (!until) return false;
  if (Date.now() < Number(until)) return true;

 
  await AsyncStorage.multiRemove([KEY, LOCK_KEY]);
  return false;
}