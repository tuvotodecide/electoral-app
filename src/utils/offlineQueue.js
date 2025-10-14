import AsyncStorage from '@react-native-async-storage/async-storage';
import {KEY_OFFLINE} from '../common/constants';

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
    list.push({id, createdAt: Date.now(), task});
    await write(list);
    //console.log('[OFFLINE-QUEUE] enqueued', { id, queueLength: list.length });
    return id;
  } catch (err) {
    //console.error('[OFFLINE-QUEUE] enqueue error', err);
    throw err;
  }
};

export const removeById = async id => {
  try {
    const list = await read();
    const next = list.filter(i => i.id !== id);
    await write(next);
    //console.log('[OFFLINE-QUEUE] removed item', { id, remaining: next.length });
  } catch (err) {
    //console.error('[OFFLINE-QUEUE] removeById error', err);
    throw err;
  }
};

export const getAll = read;

export const processQueue = async (handler) => {
  if (processing) {
    const remaining = (await read()).length;
    //console.log('[OFFLINE-QUEUE] processQueue called while already processing', { remaining });
    return {processed: 0, failed: 0, remaining};
  }
  processing = true;
  //console.log('[OFFLINE-QUEUE] starting processQueue');
  let processed = 0;
  let failed = 0;
  try {
    const snapshot = await read(); // instantánea
    //console.log('[OFFLINE-QUEUE] snapshot length', snapshot.length);
    for (const item of snapshot) {
      try {
        //console.log('[OFFLINE-QUEUE] processing item', { id: item.id });
        await handler(item);
        await removeById(item.id);
        processed++;
        //console.log('[OFFLINE-QUEUE] processed item', { id: item.id });
      } catch (e) {
        failed++;
        //console.error('[OFFLINE-QUEUE] handler error for item', { id: item.id, error: e });
      }
    }
    const remaining = (await read()).length;
    //console.log('[OFFLINE-QUEUE] finished processQueue', { processed, failed, remaining });
    return {processed, failed, remaining};
  } finally {
    processing = false;
  }
};


export async function saveVotePlace(dni, value) {
  try {
    await AsyncStorage.setItem(KEY(dni), JSON.stringify(value));
    //console.log('[OFFLINE-QUEUE] saveVotePlace', { dni });
  } catch (e) {
    //console.error('[OFFLINE-QUEUE] saveVotePlace error', { dni, error: e });
  }
}

export async function getVotePlace(dni) {
  try {
    const raw = await AsyncStorage.getItem(KEY(dni));
    const parsed = raw ? JSON.parse(raw) : null;
    //console.log('[OFFLINE-QUEUE] getVotePlace', { dni, found: !!parsed });
    return parsed;
  } catch (e) {
    //console.error('[OFFLINE-QUEUE] getVotePlace error', { dni, error: e });
    return null;
  }
}

export async function clearVotePlace(dni) {
  try {
    await AsyncStorage.removeItem(KEY(dni));
    //console.log('[OFFLINE-QUEUE] clearVotePlace', { dni });
  } catch (e) {
    //console.error('[OFFLINE-QUEUE] clearVotePlace error', { dni, error: e });
  }
}