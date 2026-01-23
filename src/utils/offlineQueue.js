import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEY_OFFLINE } from '../common/constants';

let processing = false;
const KEY = dni => `@vote-place:${dni}`;

const read = async () => {
  const raw = await AsyncStorage.getItem(KEY_OFFLINE);
  return raw ? JSON.parse(raw) : [];
};

const write = async list => {
  await AsyncStorage.setItem(KEY_OFFLINE, JSON.stringify(list));
};

export const enqueue = async task => {
  try {
    const list = await read();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    list.push({ id, createdAt: Date.now(), task });
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
    for (const item of snapshot) {
      try {
        await handler(item);
        await removeById(item.id);
        processed++;
      } catch (e) {
        failed++;

        const msg = toErrorString(e);

        const payload = item?.task?.payload || {};
        const tableCode =
          payload?.additionalData?.tableCode ||
          payload?.tableData?.codigo ||
          payload?.tableData?.tableCode ||
          payload?.electoralData?.tableCode ||
          null;

        failedItems.push({
          id: item.id,
          error: msg,
          tableCode,
          createdAt: item.createdAt,
          type: item?.task?.type,
        });

        console.error('[OFFLINE-QUEUE] handler error for item', {
          id: item.id,
          error: msg,
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