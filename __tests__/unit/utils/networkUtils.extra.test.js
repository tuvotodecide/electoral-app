jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('@env', () => ({
  BACKEND: 'https://backend.example',
  BACKEND_BLOCKCHAIN: 'https://blockchain.example',
  BACKEND_RESULT: 'https://result.example',
}));

import NetInfo from '@react-native-community/netinfo';
import {
  checkInternetConnection,
  backendProbe,
  validateBackendConnectivity,
  showNetworkErrorAlert,
  retryWithBackoff,
} from '../../../src/utils/networkUtils';

describe('networkUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.AbortController = class {
      constructor() {
        this.signal = {};
        this.abort = jest.fn();
      }
    };
  });

  it('checkInternetConnection devuelve true si hay conexiÃ³n', async () => {
    NetInfo.fetch.mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
    });
    await expect(checkInternetConnection()).resolves.toBe(true);
  });

  it('backendProbe devuelve ok en respuesta exitosa', async () => {
    global.fetch.mockResolvedValueOnce({ok: true, status: 200});
    const result = await backendProbe({baseUrl: 'https://api-ok.example'});
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('backendProbe devuelve error cuando falta baseUrl', async () => {
    const result = await backendProbe({baseUrl: ''});
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('MISSING_BASE_URL');
  });

  it('backendProbe clasifica error por status 500', async () => {
    global.fetch.mockResolvedValueOnce({ok: false, status: 500});
    const result = await backendProbe({baseUrl: 'https://api-500.example'});
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('SERVER_5XX');
  });

  it('backendProbe clasifica error por status 401', async () => {
    global.fetch.mockResolvedValueOnce({ok: false, status: 401});
    const result = await backendProbe({baseUrl: 'https://api-401.example'});
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('AUTH');
  });

  it('backendProbe clasifica error de timeout', async () => {
    const err = new Error('timeout');
    err.code = 'ECONNABORTED';
    global.fetch.mockRejectedValueOnce(err);
    const result = await backendProbe({baseUrl: 'https://api-timeout.example'});
    expect(result.ok).toBe(false);
    expect(result.errorType).toBe('NETWORK_TIMEOUT');
  });

  it('validateBackendConnectivity devuelve resultados por endpoint', async () => {
    global.fetch.mockResolvedValue({ok: true, status: 200});
    const results = await validateBackendConnectivity();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('name');
    expect(results[0]).toHaveProperty('ok');
  });

  it('validateBackendConnectivity captura error de fetch', async () => {
    global.fetch.mockRejectedValueOnce(new Error('fail'));
    const results = await validateBackendConnectivity();
    expect(results[0].ok).toBe(false);
  });

  it('showNetworkErrorAlert dispara alerta', () => {
    const {Alert} = require('react-native');
    showNetworkErrorAlert({code: 'NETWORK_ERROR', message: 'Network Error'});
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('showNetworkErrorAlert maneja 404 y 500', () => {
    const {Alert} = require('react-native');
    showNetworkErrorAlert({response: {status: 404}, message: 'x'});
    showNetworkErrorAlert({response: {status: 500}, message: 'x'});
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('retryWithBackoff reintenta y resuelve', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    await expect(retryWithBackoff(fn, 2, 1)).resolves.toBe('ok');
  });

  it('retryWithBackoff lanza error al agotar reintentos', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(retryWithBackoff(fn, 1, 1)).rejects.toThrow('fail');
  });
});
