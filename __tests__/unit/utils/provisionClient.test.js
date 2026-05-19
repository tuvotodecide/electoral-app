import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { STORAGE_KEY } from '../../../src/common/constants';
import {ensureProvisioned} from '../../../src/utils/provisionClient';

jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('provisionClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refresca provisionamiento y sobrescribe el storage local', async () => {
    const freshProvision = {
      issuer: {
        adminBase: 'https://issuer.new',
        basicAuth: {user: 'admin', pass: 'new-pass'},
      },
      gemini: {mode: 'apiKey', apiKey: 'new-api-key'},
    };
    axios.post.mockResolvedValueOnce({data: freshProvision});

    const result = await ensureProvisioned();

    expect(result).toBe(freshProvision);
    expect(axios.post).toHaveBeenCalledWith(
      'https://gateway.example/provision',
      expect.objectContaining({platform: expect.any(String)}),
      {timeout: 20000},
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(freshProvision),
    );
  });

  it('usa provisionamiento guardado cuando falla el refresh', async () => {
    const cachedProvision = {
      issuer: {adminBase: 'https://issuer.cached'},
      gemini: {mode: 'apiKey', apiKey: 'cached-api-key'},
    };
    axios.post.mockRejectedValueOnce(new Error('Network Error'));
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(cachedProvision));

    await expect(ensureProvisioned()).resolves.toEqual(
      cachedProvision,
    );
  });
});
