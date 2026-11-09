import axios from 'axios';
import {getPrivadoClient} from '../../../src/services/privado/privadoSession';
import {authenticateWithBackend} from '../../../src/utils/offlineQueueHandler';

jest.mock('../../../src/utils/pinataService', () => ({}));
jest.mock('../../../src/api/oracle', () => ({oracleCalls: {}, oracleReads: {}}));
jest.mock('../../../src/api/params', () => ({availableNetworks: {}}));
jest.mock('../../../src/utils/persistLocalImage', () => ({
  removePersistedImage: jest.fn(() => Promise.resolve()),
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

jest.mock('../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

const offChainZk = {
  getZkRequest: jest.fn(async ({link}) => ({message: link})),
  generateZkResponse: jest.fn(async () => ({token: 'jwz'})),
  submitZkResponse: jest.fn(async () => ({status: 200})),
};

describe('offlineQueueHandler authenticateWithBackend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrivadoClient.mockResolvedValue({offChainZk});
  });

  it('retorna apiKey cuando la respuesta es vÃ¡lida', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'k1', request: {nonce: 'n1'}},
    });
    const apiKey = await authenticateWithBackend('did:example', '0xpriv');
    expect(apiKey).toBe('k1');
    expect(offChainZk.getZkRequest).toHaveBeenCalledWith({link: {nonce: 'n1'}});
    expect(offChainZk.generateZkResponse).toHaveBeenCalledWith({
      request: {message: {nonce: 'n1'}},
    });
    expect(offChainZk.submitZkResponse).toHaveBeenCalledWith({prepared: {token: 'jwz'}});
  });

  it('propaga el error si el verificador rechaza la respuesta', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'k1', request: {nonce: 'n1'}},
    });
    offChainZk.submitZkResponse.mockRejectedValueOnce(new Error('verifier rejected'));
    await expect(authenticateWithBackend()).rejects.toThrow('verifier rejected');
  });

  it('lanza error si falta request en la respuesta', async () => {
    axios.get.mockResolvedValueOnce({data: {apiKey: 'k1'}});
    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).rejects.toThrow('Invalid authentication request response');
    expect(getPrivadoClient).not.toHaveBeenCalled();
  });
});
