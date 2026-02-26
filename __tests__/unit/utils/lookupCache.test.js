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
  clearCache,
  getCache,
  isFresh,
  setCache,
} from '../../../src/utils/lookupCache';

describe('lookupCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it('setCache y getCache guardan y leen', async () => {
    await setCache('key1', {a: 1}, {syncedAt: 900, version: 'v2'});
    const entry = await getCache('key1');
    expect(entry).toMatchObject({
      data: {a: 1},
      syncedAt: 900,
      version: 'v2',
    });
  });

  it('getCache retorna null cuando no hay datos', async () => {
    await expect(getCache('missing')).resolves.toBeNull();
  });

  it('isFresh evalÃºa ttl', async () => {
    await setCache('fresh', {ok: true}, {syncedAt: 950});
    await expect(isFresh('fresh', 100)).resolves.toBe(true);
    await expect(isFresh('fresh', 10)).resolves.toBe(false);
  });

  it('clearCache elimina item', async () => {
    await setCache('clear', {a: 1});
    await clearCache('clear');
    await expect(getCache('clear')).resolves.toBeNull();
  });
});
