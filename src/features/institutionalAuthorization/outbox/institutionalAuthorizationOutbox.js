import {StorageService} from '../../../services/StorageService';
import {submitInstitutionalAuthorization} from '../api/institutionalAuthorizationApi';

const OUTBOX_KEY = 'institutionalAuthorization.outbox';
const DEVICE_ID_KEY = 'institutionalAuthorization.deviceId';

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

export const getInstitutionalAuthorizationDeviceId = async () => {
  const existing = String(await StorageService.getItem(DEVICE_ID_KEY) || '').trim();
  if (existing) return existing.slice(0, 128);
  const deviceId = makeInstallId();
  await StorageService.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

export const getInstitutionalAuthorizationOutboxItems = async () =>
  safeParse(await StorageService.getItem(OUTBOX_KEY));

const writeItems = async items => {
  await StorageService.setItem(OUTBOX_KEY, JSON.stringify(items));
};

export const saveInstitutionalAuthorizationOutboxItem = async item => {
  const nextItem = {
    applicationId: String(item.applicationId),
    deviceId: String(item.deviceId).slice(0, 128),
    walletAddress: String(item.walletAddress || ''),
    userOpHash: String(item.userOpHash).toLowerCase(),
    txHash: item.txHash ? String(item.txHash).toLowerCase() : undefined,
    createdAt: item.createdAt || new Date().toISOString(),
    syncStatus: item.syncStatus || 'PENDING',
  };
  const items = await getInstitutionalAuthorizationOutboxItems();
  const index = items.findIndex(
    current =>
      current.applicationId === nextItem.applicationId &&
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

export const markInstitutionalAuthorizationOutboxSynced = async (
  applicationId,
  userOpHash,
) => {
  const normalizedHash = String(userOpHash).toLowerCase();
  const items = await getInstitutionalAuthorizationOutboxItems();
  const next = items.map(item =>
    item.applicationId === applicationId && item.userOpHash === normalizedHash
      ? {...item, syncStatus: 'SYNCED'}
      : item,
  );
  await writeItems(next);
  return next;
};

export const getPendingInstitutionalAuthorizationOutboxItems = async () => {
  const items = await getInstitutionalAuthorizationOutboxItems();
  return items.filter(item => item.syncStatus === 'PENDING');
};

export const syncInstitutionalAuthorizationOutbox = async (
  submitFn = submitInstitutionalAuthorization,
) => {
  const pending = await getPendingInstitutionalAuthorizationOutboxItems();
  const results = [];
  for (const item of pending) {
    try {
      await submitFn(
        item.applicationId,
        item.deviceId,
        item.walletAddress,
        item.userOpHash,
        item.txHash,
      );
      await markInstitutionalAuthorizationOutboxSynced(
        item.applicationId,
        item.userOpHash,
      );
      results.push({...item, syncStatus: 'SYNCED'});
    } catch (error) {
      results.push({...item, syncStatus: 'PENDING', error});
    }
  }
  return results;
};
