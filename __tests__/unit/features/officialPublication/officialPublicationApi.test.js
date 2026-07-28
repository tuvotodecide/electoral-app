import axios from 'axios';
import {
  claimOfficialPublication,
  clearOfficialPublicationApiKey,
  getOrCreateOfficialPublicationApiKey,
  getOfficialPublicationRequest,
  startOfficialPublicationSigning,
  submitOfficialPublication,
} from '../../../../src/features/officialPublication/api/officialPublicationApi';
import wira from 'wira-sdk';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://results.example/',
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../../../../src/redux/store', () => ({
  __esModule: true,
  persistor: {
    getState: () => ({bootstrapped: true}),
  },
  default: {
    getState: () => ({
      wallet: {
        payload: {
          did: 'did:example:admin',
          privKey: '0xpriv',
        },
      },
    }),
  },
  getState: () => ({
    wallet: {
      payload: {
        did: 'did:example:admin',
        privKey: '0xpriv',
      },
    },
  }),
}));

const mockStorage = new Map();

jest.mock('../../../../src/services/StorageService', () => ({
  StorageService: {
    getItem: jest.fn(async key => mockStorage.get(key) || null),
    setItem: jest.fn(async (key, value) => mockStorage.set(key, value)),
    removeItem: jest.fn(async key => mockStorage.delete(key)),
  },
}));

jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(async () => ({ok: true})),
}));

describe('officialPublicationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    axios.get.mockImplementation(url => {
      if (String(url).includes('/auth/')) {
        return Promise.resolve({
          data: {
            apiKey: 'api-key',
            request: {body: {callbackUrl: 'https://results.example/callback'}},
            expiresAt: new Date(Date.now() + 600000).toISOString(),
          },
        });
      }
      return Promise.resolve({data: {request: {requestId: 'req-1'}}});
    });
  });

  it('consulta detalle movil autenticado', async () => {
    const result = await getOfficialPublicationRequest('req-1');

    expect(wira.authenticateWithVerifier).toHaveBeenCalledWith(
      expect.any(String),
      'did:example:admin',
      '0xpriv',
    );
    expect(axios.get).toHaveBeenCalledWith(
      'https://results.example/api/v1/mobile/official-publication/requests/req-1',
      expect.objectContaining({
        headers: expect.objectContaining({'x-api-key': 'api-key'}),
      }),
    );
    expect(result.requestId).toBe('req-1');
  });

  it('genera API key especifica por request y la reutiliza', async () => {
    const key1 = await getOrCreateOfficialPublicationApiKey('req-1');
    const key2 = await getOrCreateOfficialPublicationApiKey('req-1');
    const keyOther = await getOrCreateOfficialPublicationApiKey('req-2');

    expect(key1).toBe('api-key');
    expect(key2).toBe('api-key');
    expect(keyOther).toBe('api-key');
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get.mock.calls[0][0]).toContain('/auth/req-1/request');
    expect(axios.get.mock.calls[1][0]).toContain('/auth/req-2/request');
    expect(wira.authenticateWithVerifier).toHaveBeenCalledTimes(2);
  });

  it('claim envia solamente deviceId', async () => {
    axios.post.mockResolvedValueOnce({data: {requestId: 'req-1'}});

    await claimOfficialPublication('req-1', 'device-1');

    expect(axios.post).toHaveBeenCalledWith(
      'https://results.example/api/v1/mobile/official-publication/requests/req-1/claim',
      {deviceId: 'device-1'},
      expect.objectContaining({
        headers: expect.objectContaining({'x-api-key': 'api-key'}),
      }),
    );
  });

  it('claim, signing y submission reutilizan la misma API key del request', async () => {
    axios.post.mockResolvedValue({data: {request: {status: 'CLAIMED'}}});

    await claimOfficialPublication('req-1', 'device-1');
    await startOfficialPublicationSigning('req-1', 'device-1');
    await submitOfficialPublication(
      'req-1',
      'device-1',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );

    expect(wira.authenticateWithVerifier).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls.every(call => call[2].headers['x-api-key'] === 'api-key')).toBe(
      true,
    );
  });

  it('401 elimina y renueva una sola vez', async () => {
    axios.get.mockImplementation(url => {
      if (String(url).includes('/auth/')) {
        const suffix = wira.authenticateWithVerifier.mock.calls.length + 1;
        return Promise.resolve({
          data: {
            apiKey: `api-key-${suffix}`,
            request: {body: {callbackUrl: 'https://results.example/callback'}},
            expiresAt: new Date(Date.now() + 600000).toISOString(),
          },
        });
      }
      if (axios.get.mock.calls.filter(call => String(call[0]).includes('/requests/req-1')).length === 1) {
        return Promise.reject({response: {status: 401}});
      }
      return Promise.resolve({data: {request: {requestId: 'req-1'}}});
    });

    await getOfficialPublicationRequest('req-1');

    const requestCalls = axios.get.mock.calls.filter(call =>
      String(call[0]).includes('/requests/req-1'),
    );
    expect(requestCalls).toHaveLength(2);
    expect(wira.authenticateWithVerifier).toHaveBeenCalledTimes(2);
  });

  it('elimina key local al completar o al limpiar explicitamente', async () => {
    await getOrCreateOfficialPublicationApiKey('req-1');
    await clearOfficialPublicationApiKey('req-1');

    await getOrCreateOfficialPublicationApiKey('req-1');

    expect(wira.authenticateWithVerifier).toHaveBeenCalledTimes(2);
  });

  it('submission envia solo hashes y no acepta datos contractuales como autoridad', async () => {
    axios.post.mockResolvedValueOnce({data: {request: {status: 'SUBMITTED'}}});

    await submitOfficialPublication(
      'req-1',
      'device-1',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );

    expect(axios.post).toHaveBeenCalledWith(
      'https://results.example/api/v1/mobile/official-publication/requests/req-1/submission',
      {
        deviceId: 'device-1',
        userOpHash:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
      expect.any(Object),
    );
    expect(axios.post.mock.calls[0][1]).not.toHaveProperty('callData');
    expect(axios.post.mock.calls[0][1]).not.toHaveProperty('institutionId');
  });
});
