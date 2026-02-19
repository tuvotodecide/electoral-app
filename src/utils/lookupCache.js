import AsyncStorage from '@react-native-async-storage/async-storage';

const LOOKUP_CACHE_PREFIX = '@lookup-cache:v1:';
const CACHE_TRACE_ENABLED = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const buildKey = key => `${LOOKUP_CACHE_PREFIX}${String(key || '').trim()}`;

const summarizeData = value => {
  if (Array.isArray(value)) {
    return { kind: 'array', size: value.length };
  }
  if (value && typeof value === 'object') {
    return { kind: 'object', size: Object.keys(value).length };
  }
  return { kind: typeof value };
};

const logCacheTrace = (event, payload = {}) => {
  if (!CACHE_TRACE_ENABLED) return;
  console.log(`[LOOKUP-CACHE] ${event}`, payload);
};

export const getCache = async key => {
  const normalizedKey = buildKey(key);
  try {
    const raw = await AsyncStorage.getItem(normalizedKey);
    if (!raw) {
      logCacheTrace('MISS', { key: normalizedKey });
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      logCacheTrace('INVALID_PAYLOAD', { key: normalizedKey });
      return null;
    }
    const entry = {
      data: parsed.data ?? null,
      syncedAt: Number(parsed.syncedAt || 0) || 0,
      version: parsed.version ?? null,
      key: normalizedKey,
    };
    logCacheTrace('HIT', {
      key: normalizedKey,
      syncedAt: entry.syncedAt,
      version: entry.version,
      summary: summarizeData(entry.data),
    });
    return entry;
  } catch (error) {
    console.error('[LOOKUP-CACHE] getCache error', { key: normalizedKey, error });
    return null;
  }
};

export const setCache = async (
  key,
  data,
  { syncedAt = Date.now(), version = 'v1' } = {},
) => {
  const normalizedKey = buildKey(key);
  const payload = {
    data: data ?? null,
    syncedAt: Number(syncedAt) || Date.now(),
    version: version ?? 'v1',
  };

  try {
    await AsyncStorage.setItem(normalizedKey, JSON.stringify(payload));
    logCacheTrace('SET', {
      key: normalizedKey,
      syncedAt: payload.syncedAt,
      version: payload.version,
      summary: summarizeData(payload.data),
    });
    return payload;
  } catch (error) {
    console.error('[LOOKUP-CACHE] setCache error', { key: normalizedKey, error });
    return null;
  }
};

export const isFresh = async (key, ttlMs) => {
  const entry = await getCache(key);
  if (!entry?.syncedAt) return false;
  const ttl = Math.max(0, Number(ttlMs) || 0);
  const ageMs = Date.now() - entry.syncedAt;
  const fresh = ageMs <= ttl;
  logCacheTrace('FRESHNESS_CHECK', {
    key: buildKey(key),
    ttlMs: ttl,
    ageMs,
    fresh,
  });
  return fresh;
};

export const clearCache = async key => {
  const normalizedKey = buildKey(key);
  try {
    await AsyncStorage.removeItem(normalizedKey);
    logCacheTrace('CLEAR', { key: normalizedKey });
  } catch (error) {
    console.error('[LOOKUP-CACHE] clearCache error', { key: normalizedKey, error });
  }
};
