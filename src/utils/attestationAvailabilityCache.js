import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = dni => `@attestation-availability:v1:${String(dni || 'unknown')}`;

export async function saveAttestationAvailabilityCache(dni, value) {
  try {
    const payload = {
      savedAt: Date.now(),
      ...value,
    };
    await AsyncStorage.setItem(KEY(dni), JSON.stringify(payload));
  } catch (e) {
    console.error('[AVAILABILITY-CACHE] save error', { dni, error: e });
  }
}

export async function getAttestationAvailabilityCache(dni) {
  try {
    const raw = await AsyncStorage.getItem(KEY(dni));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('[AVAILABILITY-CACHE] get error', { dni, error: e });
    return null;
  }
}

export async function clearAttestationAvailabilityCache(dni) {
  try {
    await AsyncStorage.removeItem(KEY(dni));
  } catch (e) {
    console.error('[AVAILABILITY-CACHE] clear error', { dni, error: e });
  }
}
