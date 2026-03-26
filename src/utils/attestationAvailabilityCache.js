import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = dni => `@attestation-availability:v1:${String(dni || 'unknown')}`;

export const getEndOfLocalDayTimestamp = (value = Date.now()) => {
  const date = new Date(Number(value) || Date.now());
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

export const isAttestationAvailabilityCacheExpired = (
  entry,
  now = Date.now(),
) => {
  if (!entry || typeof entry !== 'object') {
    return true;
  }

  const savedAt = Number(entry.savedAt || 0);
  if (!savedAt) {
    return true;
  }

  const expiresAt = Number(entry.expiresAt || getEndOfLocalDayTimestamp(savedAt));
  return expiresAt < Number(now || Date.now());
};

export async function saveAttestationAvailabilityCache(dni, value) {
  try {
    const savedAt = Date.now();
    const payload = {
      savedAt,
      expiresAt: getEndOfLocalDayTimestamp(savedAt),
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
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed) {
      return null;
    }

    if (isAttestationAvailabilityCacheExpired(parsed)) {
      await AsyncStorage.removeItem(KEY(dni));
      return null;
    }

    return parsed;
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
