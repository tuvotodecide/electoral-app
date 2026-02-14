import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_WORKSHEET_LOCAL_STATUS = '@worksheet_local_status_v1';

export const WorksheetStatus = Object.freeze({
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  UPLOADED: 'UPLOADED',
  NOT_FOUND: 'NOT_FOUND',
});

const normalizeKeyPart = value => String(value ?? '').trim();
const normalizeTableCode = value =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const buildKey = ({ dni, electionId, tableCode }) => {
  const normalizedDni = normalizeKeyPart(dni);
  const normalizedElectionId = normalizeKeyPart(electionId);
  const normalizedTableCode = normalizeTableCode(tableCode);
  if (!normalizedDni || !normalizedElectionId || !normalizedTableCode) {
    return '';
  }
  return `${normalizedDni}::${normalizedElectionId}::${normalizedTableCode}`;
};

const readStore = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY_WORKSHEET_LOCAL_STATUS);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = async store => {
  await AsyncStorage.setItem(
    KEY_WORKSHEET_LOCAL_STATUS,
    JSON.stringify(store || {}),
  );
};

export const getWorksheetLocalStatus = async identity => {
  const key = buildKey(identity || {});
  if (!key) return null;
  const store = await readStore();
  return store[key] || null;
};

export const upsertWorksheetLocalStatus = async (identity, patch) => {
  const key = buildKey(identity || {});
  if (!key) return null;
  const store = await readStore();
  const current = store[key] || {};
  const next = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  store[key] = next;
  await writeStore(store);
  return next;
};

export const clearWorksheetLocalStatus = async identity => {
  const key = buildKey(identity || {});
  if (!key) return;
  const store = await readStore();
  if (store[key]) {
    delete store[key];
    await writeStore(store);
  }
};

export const listWorksheetLocalStatuses = async () => {
  return readStore();
};
