import {StorageService} from '../../../services/StorageService';
import {submitOfficialPublication} from '../api/officialPublicationApi';

const OUTBOX_KEY = 'officialPublication.outbox';
const DEVICE_ID_KEY = 'officialPublication.deviceId';

const safeParse = value => {
  try {
    const parsed = value ? JSON.parse(value) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const makeInstallId = () => {
  const random = () => Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .slice(1);
  return [
    random() + random(),
    random(),
    random(),
    random(),
    random() + random() + random(),
  ].join('-');
};

export const getOfficialPublicationDeviceId = async () => {
  const existing = String(await StorageService.getItem(DEVICE_ID_KEY) || '').trim();
  if (existing) {
    return existing.slice(0, 128);
  }
  const deviceId = makeInstallId();
  await StorageService.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

export const getOfficialPublicationOutboxItems = async () =>
  safeParse(await StorageService.getItem(OUTBOX_KEY));

const writeItems = async items => {
  await StorageService.setItem(OUTBOX_KEY, JSON.stringify(items));
};

export const saveOfficialPublicationOutboxItem = async item => {
  const nextItem = {
    requestId: String(item.requestId),
    deviceId: String(item.deviceId).slice(0, 128),
    userOpHash: String(item.userOpHash).toLowerCase(),
    txHash: item.txHash ? String(item.txHash).toLowerCase() : undefined,
    createdAt: item.createdAt || new Date().toISOString(),
    syncStatus: item.syncStatus || 'PENDING',
  };
  const items = await getOfficialPublicationOutboxItems();
  const index = items.findIndex(
    current =>
      current.requestId === nextItem.requestId &&
      current.userOpHash === nextItem.userOpHash,
  );
  if (index >= 0) {
    items[index] = {...items[index], ...nextItem};
  } else {
    items.push(nextItem);
  }
  await writeItems(items);
  return nextItem;
};

export const markOfficialPublicationOutboxSynced = async (
  requestId,
  userOpHash,
) => {
  const normalizedHash = String(userOpHash).toLowerCase();
  const items = await getOfficialPublicationOutboxItems();
  const next = items.map(item =>
    item.requestId === requestId && item.userOpHash === normalizedHash
      ? {...item, syncStatus: 'SYNCED'}
      : item,
  );
  await writeItems(next);
  return next;
};

export const getPendingOfficialPublicationOutboxItems = async () => {
  const items = await getOfficialPublicationOutboxItems();
  return items.filter(item => item.syncStatus === 'PENDING');
};

export const syncOfficialPublicationOutbox = async (
  submitFn = submitOfficialPublication,
) => {
  const pending = await getPendingOfficialPublicationOutboxItems();
  const results = [];

  for (const item of pending) {
    try {
      await submitFn(
        item.requestId,
        item.deviceId,
        item.userOpHash,
        item.txHash,
      );
      await markOfficialPublicationOutboxSynced(item.requestId, item.userOpHash);
      results.push({...item, syncStatus: 'SYNCED'});
    } catch (error) {
      results.push({...item, syncStatus: 'PENDING', error});
    }
  }

  return results;
};
