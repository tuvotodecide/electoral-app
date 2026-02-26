jest.mock('../../../src/utils/pinataService', () => ({}));
jest.mock('../../../src/api/oracle', () => ({oracleCalls: {}, oracleReads: {}}));
jest.mock('../../../src/api/params', () => ({availableNetworks: {}}));
jest.mock('../../../src/utils/persistLocalImage', () => ({
  removePersistedImage: jest.fn(),
}));
jest.mock('../../../src/api/account', () => ({executeOperation: jest.fn()}));
jest.mock('../../../src/notifications', () => ({
  showActaDuplicateNotification: jest.fn(),
  showLocalNotification: jest.fn(),
}));
jest.mock('../../../src/services/pushPermission', () => ({
  requestPushPermissionExplicit: jest.fn(),
}));
jest.mock('../../../src/config/sentry', () => ({
  captureError: jest.fn(),
  addBlockchainBreadcrumb: jest.fn(),
}));
jest.mock('../../../src/utils/worksheetLocalStatus', () => ({
  WorksheetStatus: {PENDING: 'PENDING'},
  getWorksheetLocalStatus: jest.fn(),
  upsertWorksheetLocalStatus: jest.fn(),
}));
jest.mock('../../../src/utils/offlineQueue', () => ({
  enqueue: jest.fn(),
  updateById: jest.fn(),
}));
jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://backend.example',
  CHAIN: 'testnet',
  VERIFIER_REQUEST_ENDPOINT: 'https://verifier.example',
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(),
}));

import axios from 'axios';
import wira from 'wira-sdk';
import {authenticateWithBackend} from '../../../src/utils/offlineQueueHandler';

describe('offlineQueueHandler authenticateWithBackend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna apiKey cuando la respuesta es vÃ¡lida', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'k1', request: {nonce: 'n1'}},
    });
    wira.authenticateWithVerifier.mockResolvedValueOnce(true);

    const apiKey = await authenticateWithBackend('did:example', '0xpriv');
    expect(apiKey).toBe('k1');
    expect(wira.authenticateWithVerifier).toHaveBeenCalledWith(
      JSON.stringify({nonce: 'n1'}),
      'did:example',
      '0xpriv',
    );
  });

  it('lanza error si falta request en la respuesta', async () => {
    axios.get.mockResolvedValueOnce({data: {apiKey: 'k1'}});
    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).rejects.toThrow('Invalid authentication request response');
  });
});
