import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@offline_queue_v1';
let processing = false;

const read = async () => {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
};

const write = async (list) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
};

export const enqueue = async (task) => {
  const list = await read();
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  list.push({ id, createdAt: Date.now(), task });
  await write(list);
  return id;
};

export const removeById = async (id) => {
  const list = await read();
  const next = list.filter(i => i.id !== id);
  await write(next);
};

export const getAll = read;

export const processQueue = async (handler) => {
  if (processing) return;
  processing = true;
  try {
    let list = await read();
    for (const item of list) {
      try {
        await handler(item); 
        await removeById(item.id);
      } catch (e) {
        // Si falla, no lo borramos. Pasamos al siguiente.
      }
    }
  } finally {
    processing = false;
  }
};
