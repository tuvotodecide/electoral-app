import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  clearDraft,
  getDraft,
  saveDraft,
  updateDraft,
} from '../../../src/utils/RegisterDraft';
import {DRAFT} from '../../../src/common/constants';

describe('RegisterDraft (secretos en SecureStore)', () => {
  let asyncItems;
  let secureItems;

  beforeEach(() => {
    jest.clearAllMocks();
    asyncItems = new Map();
    secureItems = new Map();
    AsyncStorage.setItem.mockImplementation(async (key, value) => {
      asyncItems.set(key, value);
    });
    AsyncStorage.getItem.mockImplementation(async key => asyncItems.get(key) ?? null);
    AsyncStorage.removeItem.mockImplementation(async key => {
      asyncItems.delete(key);
    });
    SecureStore.setItemAsync.mockImplementation(async (key, value) => {
      secureItems.set(key, value);
    });
    SecureStore.getItemAsync.mockImplementation(async key => secureItems.get(key) ?? null);
    SecureStore.deleteItemAsync.mockImplementation(async key => {
      secureItems.delete(key);
    });
  });

  it('guarda el PIN y el identityToken fuera de AsyncStorage y los devuelve al leer', async () => {
    await saveDraft({
      dni: '1234567',
      originalPin: '4821',
      identityToken: 'header.claims.signature',
      progress: {credentialClaimed: true},
    });

    const plain = asyncItems.get(DRAFT);
    expect(plain).not.toContain('4821');
    expect(plain).not.toContain('header.claims.signature');
    expect(JSON.parse(plain)).toEqual({dni: '1234567', progress: {credentialClaimed: true}});

    const [[secretKey, secretValue, options]] = SecureStore.setItemAsync.mock.calls;
    expect(secretKey).toMatch(/^[\w.-]+$/);
    expect(JSON.parse(secretValue)).toEqual({
      originalPin: '4821',
      identityToken: 'header.claims.signature',
    });
    expect(options).toEqual({keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});

    expect(await getDraft()).toEqual({
      dni: '1234567',
      originalPin: '4821',
      identityToken: 'header.claims.signature',
      progress: {credentialClaimed: true},
    });
  });

  it('updateDraft cambia campos sin perder los secretos', async () => {
    await saveDraft({dni: '1', originalPin: '4821', progress: {}});
    await updateDraft({progress: {registered: true}});
    expect(await getDraft()).toEqual({
      dni: '1',
      originalPin: '4821',
      progress: {registered: true},
    });
  });

  it('clearDraft borra ambos almacenes', async () => {
    await saveDraft({dni: '1', originalPin: '4821'});
    await clearDraft();
    expect(asyncItems.size).toBe(0);
    expect(secureItems.size).toBe(0);
    expect(await getDraft()).toBeNull();
  });

  it('sin secretos no deja nada en SecureStore', async () => {
    await saveDraft({dni: '1', originalPin: '4821'});
    await saveDraft({dni: '1'});
    expect(secureItems.size).toBe(0);
  });
});
