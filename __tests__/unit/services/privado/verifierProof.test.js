import {createMockSession, VerifierResponseError} from '@privado-id/expo-sdk';
import {
  answerVerifierRequest,
  isVerifierRejection,
} from '../../../../src/services/privado/verifierProof';
import {getPrivadoClient} from '../../../../src/services/privado/privadoSession';
import {
  __resetVaultUnlockForTests,
  setVaultUnlockPrompter,
  vaultUnlockProvider,
  withVaultUnlockReason,
} from '../../../../src/services/privado/vaultUnlock';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

const REQUEST = {
  id: 'req-1',
  type: 'https://iden3-communication.io/authorization/1.0/request',
  body: {callbackUrl: 'https://verifier.example/vote?optionId=o1', scope: []},
};

let offChainZk;

beforeEach(() => {
  jest.clearAllMocks();
  __resetVaultUnlockForTests();
  const {client} = createMockSession();
  offChainZk = client.offChainZk;
  offChainZk.getZkRequest.mockResolvedValue({
    callbackUrl: REQUEST.body.callbackUrl,
    scope: [{id: 1}, {id: 2}],
  });
  offChainZk.generateZkResponse.mockResolvedValue({token: 'jwz'});
  offChainZk.submitZkResponse.mockResolvedValue({httpStatus: 200, responseText: '{}'});
  getPrivadoClient.mockResolvedValue(client);
});

describe('answerVerifierRequest', () => {
  it('lee la solicitud, prueba cada scope con la credencial indicada y envía la respuesta', async () => {
    await expect(answerVerifierRequest(REQUEST, {credentialId: 'storage-1'})).resolves.toEqual({
      httpStatus: 200,
      responseText: '{}',
    });

    expect(offChainZk.getZkRequest).toHaveBeenCalledWith({link: REQUEST});
    expect(offChainZk.generateZkResponse).toHaveBeenCalledWith({
      request: {callbackUrl: REQUEST.body.callbackUrl, scope: [{id: 1}, {id: 2}]},
      credentialIds: {1: 'storage-1', 2: 'storage-1'},
    });
    expect(offChainZk.submitZkResponse).toHaveBeenCalledWith({prepared: {token: 'jwz'}});
  });

  it('sin credentialId deja que el SDK elija la credencial', async () => {
    await answerVerifierRequest(REQUEST);

    expect(offChainZk.generateZkResponse).toHaveBeenCalledWith(
      expect.objectContaining({credentialIds: undefined}),
    );
  });

  it('pasa `reason` al modal si el SDK necesita abrir el vault', async () => {
    const prompter = jest.fn(async () => ({type: 'pin', pin: '1234'}));
    setVaultUnlockPrompter(prompter);
    offChainZk.generateZkResponse.mockImplementation(async () => {
      await vaultUnlockProvider({purpose: 'unlock'});
      return {token: 'jwz'};
    });

    await answerVerifierRequest(REQUEST, {reason: 'Abre tu cuenta para votar.'});

    expect(prompter).toHaveBeenCalledWith(
      expect.objectContaining({reason: 'Abre tu cuenta para votar.'}),
    );
  });

  it('sin `reason` conserva el de una operación externa', async () => {
    const prompter = jest.fn(async () => ({type: 'pin', pin: '1234'}));
    setVaultUnlockPrompter(prompter);
    offChainZk.generateZkResponse.mockImplementation(async () => {
      await vaultUnlockProvider({purpose: 'unlock'});
      return {token: 'jwz'};
    });

    await withVaultUnlockReason('Motivo externo', () => answerVerifierRequest(REQUEST));

    expect(prompter).toHaveBeenCalledWith(expect.objectContaining({reason: 'Motivo externo'}));
  });

  it('propaga el rechazo del verificador', async () => {
    const error = new VerifierResponseError(REQUEST.body.callbackUrl, 409, 'no credits');
    offChainZk.submitZkResponse.mockRejectedValue(error);

    await expect(answerVerifierRequest(REQUEST, {credentialId: 'storage-1'})).rejects.toBe(error);
  });
});

describe('isVerifierRejection', () => {
  it('reconoce el estado HTTP del rechazo del verificador', () => {
    const error = new VerifierResponseError('https://verifier.example', 409, '');

    expect(isVerifierRejection(error, 409)).toBe(true);
    expect(isVerifierRejection(error, 400)).toBe(false);
    expect(isVerifierRejection(new Error('HTTP 409'), 409)).toBe(false);
  });
});
