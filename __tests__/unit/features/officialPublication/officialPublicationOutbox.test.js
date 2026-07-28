import {StorageService} from '../../../../src/services/StorageService';
import {
  getOfficialPublicationDeviceId,
  getOfficialPublicationOutboxItems,
  markOfficialPublicationOutboxSynced,
  saveOfficialPublicationOutboxItem,
  syncOfficialPublicationOutbox,
} from '../../../../src/features/officialPublication/outbox/officialPublicationOutbox';

jest.mock('../../../../src/services/StorageService', () => ({
  StorageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('officialPublicationOutbox', () => {
  const storage = {};

  beforeEach(() => {
    Object.keys(storage).forEach(key => delete storage[key]);
    StorageService.getItem.mockImplementation(async key => storage[key] || null);
    StorageService.setItem.mockImplementation(async (key, value) => {
      storage[key] = value;
    });
  });

  it('genera un deviceId local no invasivo y lo reutiliza', async () => {
    const first = await getOfficialPublicationDeviceId();
    const second = await getOfficialPublicationDeviceId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
    expect(first.length).toBeLessThanOrEqual(128);
  });

  it('guarda submission pendiente sin secretos y la marca sincronizada', async () => {
    await saveOfficialPublicationOutboxItem({
      requestId: 'req-1',
      deviceId: 'device-1',
      userOpHash: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      privateKey: '0xsecret',
      callData: '0x1234',
    });

    const items = await getOfficialPublicationOutboxItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      requestId: 'req-1',
      deviceId: 'device-1',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      syncStatus: 'PENDING',
    });
    expect(items[0]).not.toHaveProperty('privateKey');
    expect(items[0]).not.toHaveProperty('callData');

    await markOfficialPublicationOutboxSynced(
      'req-1',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );
    expect((await getOfficialPublicationOutboxItems())[0].syncStatus).toBe('SYNCED');
  });

  it('reintenta submission con el mismo hash y no reenvia UserOperation', async () => {
    await saveOfficialPublicationOutboxItem({
      requestId: 'req-1',
      deviceId: 'device-1',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    const submitFn = jest.fn(async () => ({status: 'SUBMITTED'}));

    const result = await syncOfficialPublicationOutbox(submitFn);

    expect(submitFn).toHaveBeenCalledWith(
      'req-1',
      'device-1',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      undefined,
    );
    expect(result[0].syncStatus).toBe('SYNCED');
  });
});
