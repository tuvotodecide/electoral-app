const store = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    delete store[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach(key => delete store[key]);
    return Promise.resolve();
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WorksheetStatus,
  clearWorksheetLocalStatus,
  getWorksheetLocalStatus,
  listWorksheetLocalStatuses,
  upsertWorksheetLocalStatus,
} from '../../../src/utils/worksheetLocalStatus';

describe('worksheetLocalStatus', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('devuelve null si la identidad es incompleta', async () => {
    await expect(getWorksheetLocalStatus({dni: '1'})).resolves.toBeNull();
  });

  it('inserta y obtiene el estado local', async () => {
    const identity = {dni: '123', electionId: 'e1', tableCode: 'A-1'};
    const inserted = await upsertWorksheetLocalStatus(identity, {
      status: WorksheetStatus.PENDING,
    });
    expect(inserted).toHaveProperty('status', WorksheetStatus.PENDING);
    expect(inserted).toHaveProperty('updatedAt');

    const fetched = await getWorksheetLocalStatus(identity);
    expect(fetched).toMatchObject({
      status: WorksheetStatus.PENDING,
    });
  });

  it('lista y limpia estados locales', async () => {
    const identity = {dni: '999', electionId: 'e2', tableCode: 'B-2'};
    await upsertWorksheetLocalStatus(identity, {
      status: WorksheetStatus.UPLOADED,
    });

    const list = await listWorksheetLocalStatuses();
    expect(Object.keys(list)).toHaveLength(1);

    await clearWorksheetLocalStatus(identity);
    const afterClear = await getWorksheetLocalStatus(identity);
    expect(afterClear).toBeNull();
  });
});
