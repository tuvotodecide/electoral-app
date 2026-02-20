import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEY_OFFLINE } from '../common/constants';

let processing = false;
const KEY = dni => `@vote-place:${dni}`;
const RETRY_POLICY = {
  baseDelayMs: 4000,
  maxDelayMs: 300000,
  maxJitterMs: 1500,
};

const RETRIABLE_ERROR_TYPES = new Set([
  'NETWORK_TIMEOUT',
  'NETWORK_DOWN',
  'SERVER_5XX',
  'RATE_LIMIT',
  'CONFLICT_IDEMPOTENT',
  'UNKNOWN',
]);

const TERMINAL_ERROR_TYPES = new Set([
  'AUTH',
  'VALIDATION',
  'BUSINESS_TERMINAL',
]);

const normalizeQueueItem = item => {
  const now = Date.now();
  return {
    id: item?.id,
    createdAt: Number(item?.createdAt) || now,
    updatedAt: Number(item?.updatedAt) || Number(item?.createdAt) || now,
    attempts: Number(item?.attempts) >= 0 ? Number(item.attempts) : 0,
    nextAttemptAt:
      Number(item?.nextAttemptAt) || Number(item?.createdAt) || now,
    lastError: item?.lastError || null,
    lastErrorType: item?.lastErrorType || null,
    task: item?.task,
  };
};

const read = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY_OFFLINE);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeQueueItem);
  } catch {
    return [];
  }
};

const write = async list => {
  await AsyncStorage.setItem(KEY_OFFLINE, JSON.stringify(list));
};

const buildNextAttemptAt = attempts => {
  const normalizedAttempts = Math.max(1, Number(attempts) || 1);
  const exponentialDelay = Math.min(
    RETRY_POLICY.maxDelayMs,
    RETRY_POLICY.baseDelayMs * Math.pow(2, normalizedAttempts - 1),
  );
  const jitter = Math.floor(Math.random() * (RETRY_POLICY.maxJitterMs + 1));
  return Date.now() + exponentialDelay + jitter;
};

const isNetworkCode = code =>
  code === 'ECONNABORTED' ||
  code === 'ETIMEDOUT' ||
  code === 'ENOTFOUND' ||
  code === 'ECONNRESET' ||
  code === 'ERR_NETWORK';

const classifyQueueError = error => {
  const explicitType = String(error?.errorType || '').trim().toUpperCase();
  if (explicitType) return explicitType;

  const status = Number(error?.response?.status);
  const code = String(error?.code || '').trim().toUpperCase();
  const message = String(error?.message || '')
    .trim()
    .toLowerCase();

  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER_5XX';
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 400 || status === 422) return 'VALIDATION';
  if (status === 404) return 'UNKNOWN';
  if (status === 409) return 'CONFLICT_IDEMPOTENT';
  if (isNetworkCode(code)) {
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return 'NETWORK_TIMEOUT';
    }
    return 'NETWORK_DOWN';
  }
  if (error?.request && !error?.response) return 'NETWORK_DOWN';
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('abort')
  ) {
    return 'NETWORK_TIMEOUT';
  }
  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('internet')
  ) {
    return 'NETWORK_DOWN';
  }
  return 'UNKNOWN';
};

const isRetriableType = type => RETRIABLE_ERROR_TYPES.has(type);
const isTerminalType = type => TERMINAL_ERROR_TYPES.has(type);

export const enqueue = async task => {
  try {
    const list = await read();
    const now = Date.now();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    list.push(
      normalizeQueueItem({
        id,
        createdAt: now,
        updatedAt: now,
        attempts: 0,
        nextAttemptAt: now,
        lastError: null,
        lastErrorType: null,
        task,
      }),
    );
    await write(list);
    return id;
  } catch (err) {
    throw err;
  }
};

export const removeById = async id => {
  try {
    const list = await read();
    const next = list.filter(i => i.id !== id);
    await write(next);
  } catch (err) {
    console.error('[OFFLINE-QUEUE] removeById error', err);
    throw err;
  }
};

export const updateById = async (id, patch = {}) => {
  try {
    const list = await read();
    const idx = list.findIndex(i => i.id === id);
    if (idx < 0) return null;

    const current = normalizeQueueItem(list[idx]);
    const next = normalizeQueueItem({
      ...current,
      ...patch,
      id: current.id,
      task: patch?.task || current.task,
      createdAt: current.createdAt,
      updatedAt: Number(patch?.updatedAt) || Date.now(),
    });

    list[idx] = next;
    await write(list);
    return next;
  } catch (err) {
    console.error('[OFFLINE-QUEUE] updateById error', err);
    throw err;
  }
};

export const getAll = read;

export const processQueue = async (handler) => {
  if (processing) {
    const remaining = (await read()).length;
    return { processed: 0, failed: 0, remaining, failedItems: [] };
  }
  processing = true;
  let processed = 0;
  let failed = 0;
  const failedItems = [];

  try {
    const snapshot = await read();
    const now = Date.now();
    for (const item of snapshot) {
      if (Number(item?.nextAttemptAt) > now) {
        continue;
      }

      try {
        await handler(item);
        await removeById(item.id);
        processed++;
      } catch (e) {
        failed++;

        const msg = toErrorString(e);
        const errorType = classifyQueueError(e);
        const explicitRemove = e?.removeFromQueue === true;
        const removeFromQueue = explicitRemove || isTerminalType(errorType);
        const attempts = (Number(item?.attempts) || 0) + 1;
        const nextAttemptAt = removeFromQueue
          ? null
          : buildNextAttemptAt(attempts);

        const payload = item?.task?.payload || {};
        const additionalData = payload?.additionalData || {};
        const tableCode =
          additionalData?.tableCode ||
          payload?.tableCode ||
          payload?.tableData?.codigo ||
          payload?.tableData?.tableCode ||
          payload?.electoralData?.tableCode ||
          null;
        const dni =
          String(additionalData?.dni || payload?.dni || '').trim() || null;
        const electionId =
          String(additionalData?.electionId || payload?.electionId || '').trim() ||
          null;

        failedItems.push({
          id: item.id,
          error: msg,
          tableCode,
          dni,
          electionId,
          createdAt: item.createdAt,
          type: item?.task?.type,
          removedFromQueue: removeFromQueue,
          errorType,
          attempts,
          nextAttemptAt,
        });

        if (removeFromQueue) {
          await removeById(item.id);
        } else if (isRetriableType(errorType)) {
          await updateById(item.id, {
            attempts,
            nextAttemptAt,
            lastError: msg,
            lastErrorType: errorType,
          });
        } else {
          await updateById(item.id, {
            attempts,
            nextAttemptAt,
            lastError: msg,
            lastErrorType: 'UNKNOWN',
          });
        }

        console.error('[OFFLINE-QUEUE] handler error for item', {
          id: item.id,
          error: msg,
          errorType,
          removeFromQueue,
        });
      }
    }

    const remaining = (await read()).length;
    return { processed, failed, remaining, failedItems };
  } finally {
    processing = false;
  }
};

const toErrorString = (e) => {
  if (!e) return 'Unknown error';

  const status = e?.response?.status;
  const data = e?.response?.data;

  if (status) {
    let dataStr = '';
    try {
      dataStr =
        data == null ? '' :
          typeof data === 'string' ? data :
            JSON.stringify(data, null, 2);
    } catch {
      dataStr = String(data);
    }

    const base = `HTTP ${status}${e?.message ? ` - ${e.message}` : ''}`;
    return dataStr ? `${base}\n${dataStr}` : base;
  }

  if (e?.message) return String(e.message);

  try {
    return typeof e === 'string' ? e : JSON.stringify(e);
  } catch {
    return String(e);
  }
};
export async function saveVotePlace(dni, value) {
  try {
    await AsyncStorage.setItem(KEY(dni), JSON.stringify(value));
  } catch (e) {
    console.error('[OFFLINE-QUEUE] saveVotePlace error', { dni, error: e });
  }
}

export async function getVotePlace(dni) {
  try {
    const raw = await AsyncStorage.getItem(KEY(dni));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed;
  } catch (e) {
    console.error('[OFFLINE-QUEUE] getVotePlace error', { dni, error: e });
    return null;
  }
}

export async function clearVotePlace(dni) {
  try {
    await AsyncStorage.removeItem(KEY(dni));
  } catch (e) {
    console.error('[OFFLINE-QUEUE] clearVotePlace error', { dni, error: e });
  }
}
