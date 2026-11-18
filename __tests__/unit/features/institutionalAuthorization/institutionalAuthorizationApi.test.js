import axios from 'axios';
import {
  clearInstitutionalAuthorizationApiKey,
  getOrCreateInstitutionalAuthorizationApiKey,
  getOrCreateInstitutionalInvitationApiKey,
} from '../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi';
import {answerVerifierRequest} from '../../../../src/services/privado/verifierProof';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://results.example/',
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

let mockPayload = {did: 'did:example:signer'};

jest.mock('../../../../src/redux/store', () => ({
  __esModule: true,
  persistor: {getState: () => ({bootstrapped: true})},
  default: {getState: () => ({wallet: {payload: mockPayload}})},
}));

const mockStorage = new Map();

jest.mock('../../../../src/services/StorageService', () => ({
  StorageService: {
    getItem: jest.fn(async key => mockStorage.get(key) || null),
    setItem: jest.fn(async (key, value) => mockStorage.set(key, value)),
    removeItem: jest.fn(async key => mockStorage.delete(key)),
  },
}));

jest.mock('../../../../src/services/privado/verifierProof', () => ({
  answerVerifierRequest: jest.fn(async () => ({httpStatus: 200})),
}));

const AUTH_REQUEST = {body: {callbackUrl: 'https://results.example/callback?sessionId=s1', scope: []}};

describe('institutionalAuthorizationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockPayload = {did: 'did:example:signer'};
    axios.get.mockResolvedValue({
      data: {
        apiKey: 'api-key-1',
        request: AUTH_REQUEST,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      },
    });
  });

  describe('getOrCreateInstitutionalAuthorizationApiKey', () => {
    it('pide la solicitud de la postulación y la responde con el SDK', async () => {
      await expect(getOrCreateInstitutionalAuthorizationApiKey('app-1')).resolves.toBe('api-key-1');

      expect(axios.get).toHaveBeenCalledWith(
        'https://results.example/api/v1/mobile/institutional-authorizations/auth/app-1/request',
        expect.any(Object),
      );
      expect(answerVerifierRequest).toHaveBeenCalledWith(AUTH_REQUEST, {
        reason: expect.any(String),
      });
    });

    it('reutiliza la API key vigente sin volver a probar', async () => {
      await getOrCreateInstitutionalAuthorizationApiKey('app-1');
      await getOrCreateInstitutionalAuthorizationApiKey('app-1');

      expect(answerVerifierRequest).toHaveBeenCalledTimes(1);
    });

    it('forceRefresh y clear obligan a probar de nuevo', async () => {
      await getOrCreateInstitutionalAuthorizationApiKey('app-1');
      await getOrCreateInstitutionalAuthorizationApiKey('app-1', {forceRefresh: true});
      await clearInstitutionalAuthorizationApiKey('app-1');
      await getOrCreateInstitutionalAuthorizationApiKey('app-1');

      expect(answerVerifierRequest).toHaveBeenCalledTimes(3);
    });

    it('sin sesión abierta falla sin llamar a la red', async () => {
      mockPayload = null;

      await expect(getOrCreateInstitutionalAuthorizationApiKey('app-1')).rejects.toThrow(
        'No se pudo validar tu acceso institucional',
      );
      expect(axios.get).not.toHaveBeenCalled();
      expect(answerVerifierRequest).not.toHaveBeenCalled();
    });

    it('si el verificador rechaza la prueba no guarda la API key', async () => {
      answerVerifierRequest.mockRejectedValueOnce(new Error('HTTP 403'));

      await expect(getOrCreateInstitutionalAuthorizationApiKey('app-1')).rejects.toThrow('HTTP 403');
      expect(mockStorage.size).toBe(0);
    });

    it('rechaza una solicitud incompleta del backend', async () => {
      axios.get.mockResolvedValue({data: {apiKey: 'api-key-1'}});

      await expect(getOrCreateInstitutionalAuthorizationApiKey('app-1')).rejects.toThrow(
        'No se pudo validar la identidad de este dispositivo.',
      );
      expect(answerVerifierRequest).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateInstitutionalInvitationApiKey', () => {
    it('pide la solicitud de la invitación y la responde con el SDK', async () => {
      await expect(getOrCreateInstitutionalInvitationApiKey('inv-1')).resolves.toBe('api-key-1');

      expect(axios.get).toHaveBeenCalledWith(
        'https://results.example/api/v1/mobile/institutional-authorizations/auth/invitations/inv-1/request',
        expect.any(Object),
      );
      expect(answerVerifierRequest).toHaveBeenCalledWith(AUTH_REQUEST, {
        reason: expect.any(String),
      });
    });

    it('sin sesión abierta falla sin llamar a la red', async () => {
      mockPayload = {};

      await expect(getOrCreateInstitutionalInvitationApiKey('inv-1')).rejects.toThrow(
        'No se pudo validar tu identidad para esta invitación',
      );
      expect(answerVerifierRequest).not.toHaveBeenCalled();
    });
  });
});
