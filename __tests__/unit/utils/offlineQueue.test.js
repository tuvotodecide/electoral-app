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
  enqueue,
  getAll,
  removeById,
  updateById,
  processQueue,
  saveVotePlace,
  getVotePlace,
  clearVotePlace,
} from '../../../src/utils/offlineQueue';

describe('offlineQueue', () => {
  let nowSpy;
  let randomSpy;

  beforeEach(async () => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    await AsyncStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    nowSpy.mockRestore();
    randomSpy.mockRestore();
    console.error.mockRestore();
  });

  it('enqueue y getAll normalizan items', async () => {
    const id = await enqueue({type: 'UPLOAD', payload: {a: 1}});
    const list = await getAll();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(id);
    expect(list[0].task.type).toBe('UPLOAD');
    expect(list[0].attempts).toBe(0);
  });

  it('updateById y removeById actualizan el item', async () => {
    const id = await enqueue({type: 'TASK', payload: {}});
    const updated = await updateById(id, {attempts: 2, lastError: 'boom'});
    expect(updated.attempts).toBe(2);
    expect(updated.lastError).toBe('boom');

    await removeById(id);
    const list = await getAll();
    expect(list).toHaveLength(0);
  });

  it('processQueue procesa exitosamente', async () => {
    await enqueue({type: 'OK', payload: {}});
    const handler = jest.fn(async () => true);
    const result = await processQueue(handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it('processQueue reintenta con error retriable', async () => {
    await enqueue({
      type: 'RETRY',
      payload: {additionalData: {dni: '1', tableCode: 'T1', electionId: 'e1'}},
    });
    const handler = jest.fn(async () => {
      const err = new Error('server');
      err.response = {status: 500, data: {detail: 'fail'}};
      throw err;
    });
    const result = await processQueue(handler);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(1);
    expect(result.failedItems[0].error).toContain('HTTP 500');

    const [item] = await getAll();
    expect(item.attempts).toBe(1);
    expect(item.lastErrorType).toBe('SERVER_5XX');
    expect(item.nextAttemptAt).toBe(5750);
  });

  it('processQueue elimina en error terminal', async () => {
    await enqueue({type: 'AUTH', payload: {}});
    const handler = jest.fn(async () => {
      const err = new Error('unauthorized');
      err.response = {status: 401};
      throw err;
    });
    const result = await processQueue(handler);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(0);
    const list = await getAll();
    expect(list).toHaveLength(0);
  });

  it('save/get/clear vote place', async () => {
    await saveVotePlace('123', {table: 'A-1'});
    await expect(getVotePlace('123')).resolves.toEqual({table: 'A-1'});
    await clearVotePlace('123');
    await expect(getVotePlace('123')).resolves.toBeNull();
  });
});
