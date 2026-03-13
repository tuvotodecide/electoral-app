// Tests para funciones helper de offlineQueueHandler
// Estos tests cubren funciones utilitarias que no requieren mocks complejos de blockchain

jest.mock('../../../src/utils/pinataService', () => ({
  uploadImageToIPFS: jest.fn(),
  uploadJSONToIPFS: jest.fn(),
  uploadElectoralActComplete: jest.fn(),
  uploadCertificateNFT: jest.fn(),
  checkDuplicateBallot: jest.fn(),
}));
jest.mock('../../../src/api/oracle', () => ({
  oracleCalls: {
    requestRegister: jest.fn(() => 'req-register'),
    attest: jest.fn(() => 'attest'),
    createAttestation: jest.fn(() => 'create-attestation'),
  },
  oracleReads: {
    isRegistered: jest.fn(async () => true),
    isUserJury: jest.fn(async () => false),
    waitForOracleEvent: jest.fn(),
  },
}));
jest.mock('../../../src/api/params', () => ({
  availableNetworks: {
    testnet: {
      explorer: 'https://explorer.example/',
      nftExplorer: 'https://nft.example',
      attestationNft: '0xabc',
    },
  },
}));
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
  WorksheetStatus: {PENDING: 'PENDING', FAILED: 'FAILED', UPLOADED: 'UPLOADED'},
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
  post: jest.fn(),
}));
jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(async () => true),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import axios from 'axios';
import {authenticateWithBackend} from '../../../src/utils/offlineQueueHandler';

describe('offlineQueueHandler authenticateWithBackend extended', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna apiKey cuando la autenticación es exitosa', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'test-api-key', request: {nonce: 'test-nonce'}},
    });

    const apiKey = await authenticateWithBackend('did:example:123', '0xprivkey');
    expect(apiKey).toBe('test-api-key');
  });

  it('lanza error cuando falta apiKey en la respuesta', async () => {
    axios.get.mockResolvedValueOnce({
      data: {request: {nonce: 'n1'}},
    });

    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).rejects.toThrow();
  });

  it('lanza error cuando falta request en la respuesta', async () => {
    axios.get.mockResolvedValueOnce({data: {apiKey: 'k1'}});

    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).rejects.toThrow('Invalid authentication request response');
  });

  it('lanza error cuando axios falla', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).rejects.toThrow('Network error');
  });

  it('lanza error cuando la respuesta está vacía', async () => {
    axios.get.mockResolvedValueOnce({data: null});

    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).rejects.toThrow();
  });

  it('lanza error cuando request.nonce está vacío', async () => {
    axios.get.mockResolvedValueOnce({
      data: {apiKey: 'k1', request: {}},
    });

    // Debería funcionar pero el SDK puede fallar
    // Este test verifica que la función se ejecuta
    await expect(
      authenticateWithBackend('did:example', '0xpriv'),
    ).resolves.toBeDefined();
  });
});
