import axios from 'axios';
import {createMockSession, VaultError} from '@privado-id/expo-sdk';
import {
  checkClaimedCredForVote,
  claimForVote,
  getCredentialForVote,
  listVoteCredentials,
} from '../../../src/data/credentials';
import {
  getPrivadoClient,
  getPrivadoSession,
} from '../../../src/services/privado/privadoSession';
import {uploadRegistryBackup} from '../../../src/services/privado/registryBackupSync';
import {
  setVaultUnlockPrompter,
  VaultUnlockCancelledError,
  vaultUnlockProvider,
  __resetVaultUnlockForTests,
} from '../../../src/services/privado/vaultUnlock';
import {authenticateWithBackend} from '../../../src/utils/offlineQueueHandler';
import {captureError} from '../../../src/config/sentry';
import {isDemoActive} from '../../../src/features/demo/demoSession';

jest.mock('axios', () => ({get: jest.fn()}));
jest.mock('../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
  getPrivadoSession: jest.fn(),
}));
jest.mock('../../../src/services/privado/registryBackupSync', () => ({
  uploadRegistryBackup: jest.fn(async () => undefined),
}));
jest.mock('../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(async () => 'api-key'),
}));
jest.mock('../../../src/config/sentry', () => ({captureError: jest.fn()}));
jest.mock('../../../src/features/demo/demoSession', () => ({
  isDemoActive: jest.fn(() => false),
}));

const OFFER = 'iden3comm://?request_uri=https%3A%2F%2Fissuer.example%2Fqr';
const voteVc = (eventId, nullifier) => ({
  id: `urn:uuid:${eventId}`,
  type: ['VerifiableCredential', 'SelectedVoter'],
  credentialSubject: {id: 'did:holder', eventId, nullifier},
});
const summary = id => ({id, type: ['VerifiableCredential', 'SelectedVoter'], proofTypes: []});

let session;

beforeEach(() => {
  jest.clearAllMocks();
  __resetVaultUnlockForTests();
  isDemoActive.mockReturnValue(false);
  session = createMockSession();
  getPrivadoClient.mockResolvedValue(session.client);
  getPrivadoSession.mockResolvedValue(session);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  console.error.mockRestore();
});

describe('getCredentialForVote', () => {
  it('busca por el tipo de credencial de voto y devuelve la del evento', async () => {
    const stored = {a: voteVc('event-1', '11'), b: voteVc('event-2', '22')};
    session.client.findCredentialsByType.mockResolvedValue([summary('a'), summary('b')]);
    session.client.getCredentialById.mockImplementation(async id => stored[id]);

    await expect(getCredentialForVote('event-2', 'did', 'pk')).resolves.toEqual({
      id: 'b',
      type: ['VerifiableCredential', 'SelectedVoter'],
      info: stored.b,
    });
    expect(session.client.findCredentialsByType).toHaveBeenCalledWith('SelectedVoter', {
      includeExpired: true,
    });
  });

  it('compara el eventId como texto', async () => {
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockResolvedValue(voteVc(123, '11'));

    await expect(getCredentialForVote('123')).resolves.toMatchObject({id: 'a'});
  });

  it('no descifra nada si no hay credenciales de voto', async () => {
    await expect(getCredentialForVote('event-1')).resolves.toBeUndefined();
    expect(session.client.getCredentialById).not.toHaveBeenCalled();
  });

  it('devuelve undefined si la lectura falla', async () => {
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockRejectedValue(new Error('locked'));

    await expect(getCredentialForVote('event-1')).resolves.toBeUndefined();
  });

  it('en demo devuelve la credencial sintética', async () => {
    isDemoActive.mockReturnValue(true);

    await expect(getCredentialForVote('event-1')).resolves.toMatchObject({
      id: 'demo_credential',
      info: {credentialSubject: {eventId: 'event-1'}},
    });
    expect(getPrivadoClient).not.toHaveBeenCalled();
  });
});

describe('listVoteCredentials', () => {
  it('descifra todas las credenciales de voto y omite las ilegibles', async () => {
    const stored = {a: voteVc('event-1', '11'), b: undefined, c: voteVc('event-3', '33')};
    session.client.findCredentialsByType.mockResolvedValue([
      summary('a'),
      summary('b'),
      summary('c'),
    ]);
    session.client.getCredentialById.mockImplementation(async id => stored[id]);

    await expect(listVoteCredentials()).resolves.toEqual([
      {id: 'a', type: ['VerifiableCredential', 'SelectedVoter'], info: stored.a},
      {id: 'c', type: ['VerifiableCredential', 'SelectedVoter'], info: stored.c},
    ]);
  });

  it('usa el motivo indicado si hay que abrir el vault', async () => {
    const prompter = jest.fn(async () => ({type: 'pin', pin: '1234'}));
    setVaultUnlockPrompter(prompter);
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockImplementation(async () => {
      await vaultUnlockProvider({purpose: 'unlock'});
      return voteVc('event-1', '11');
    });

    await listVoteCredentials({reason: 'Para tus recompensas'});

    expect(prompter).toHaveBeenCalledWith(
      expect.objectContaining({reason: 'Para tus recompensas'}),
    );
  });

  it('sin credenciales de voto no descifra nada', async () => {
    await expect(listVoteCredentials()).resolves.toEqual([]);
    expect(session.client.getCredentialById).not.toHaveBeenCalled();
  });

  it('propaga la cancelación del desbloqueo', async () => {
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockRejectedValue(new VaultUnlockCancelledError());

    await expect(listVoteCredentials()).rejects.toBeInstanceOf(VaultUnlockCancelledError);
  });

  it('en demo no hay credenciales', async () => {
    isDemoActive.mockReturnValue(true);

    await expect(listVoteCredentials()).resolves.toEqual([]);
    expect(getPrivadoClient).not.toHaveBeenCalled();
  });
});

describe('checkClaimedCredForVote', () => {
  it('indica si la credencial del evento está guardada', async () => {
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockResolvedValue(voteVc('event-1', '11'));

    await expect(checkClaimedCredForVote('event-1')).resolves.toBe(true);
    await expect(checkClaimedCredForVote('event-9')).resolves.toBe(false);
  });

  it('pasa el motivo al modal de desbloqueo mientras descifra', async () => {
    const prompter = jest.fn(async () => ({type: 'pin', pin: '1234'}));
    setVaultUnlockPrompter(prompter);
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockImplementation(async () => {
      await vaultUnlockProvider({purpose: 'unlock', biometricsEnabled: false});
      return voteVc('event-1', '11');
    });

    await checkClaimedCredForVote('event-1');

    expect(prompter).toHaveBeenCalledWith(
      expect.objectContaining({reason: expect.stringContaining('credencial de voto')}),
    );
  });

  it('propaga la cancelación del desbloqueo en vez de darla por reclamada', async () => {
    session.client.findCredentialsByType.mockResolvedValue([summary('a')]);
    session.client.getCredentialById.mockRejectedValue(new VaultUnlockCancelledError());

    await expect(checkClaimedCredForVote('event-1')).rejects.toBeInstanceOf(
      VaultUnlockCancelledError,
    );
  });
});

describe('claimForVote', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({data: {vc: 'cred-1', credentialId: 'cred-1', offer: OFFER}});
  });

  it('pide la oferta a back-results, la reclama y sube el respaldo con el PIN', async () => {
    let pinDuringClaim;
    session.client.claimCredentialFromIssuer.mockImplementation(async () => {
      pinDuringClaim = await vaultUnlockProvider({purpose: 'unlock'});
      return {stored: true};
    });

    await expect(claimForVote('event-1', '1234567', '4321')).resolves.toEqual({
      claimed: true,
      invalidPin: false,
      backupUpdated: true,
    });

    expect(session.vault.verifyPin).toHaveBeenCalledWith('4321');
    expect(authenticateWithBackend).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/voting\/events\/vote\/cred-vc$/),
      expect.objectContaining({
        params: {eventId: 'event-1', dni: '1234567'},
        headers: expect.objectContaining({'x-api-key': 'api-key'}),
      }),
    );
    expect(session.client.claimCredentialFromIssuer).toHaveBeenCalledWith({
      offer: OFFER,
      credentialType: 'SelectedVoter',
    });
    // El SDK abre el vault con el PIN escrito, sin mostrar el modal.
    expect(pinDuringClaim).toEqual({type: 'pin', pin: '4321'});
    expect(uploadRegistryBackup).toHaveBeenCalledWith('4321');
    const claimOrder = session.client.claimCredentialFromIssuer.mock.invocationCallOrder[0];
    expect(uploadRegistryBackup.mock.invocationCallOrder[0]).toBeGreaterThan(claimOrder);
  });

  it('con un PIN incorrecto no llama a la red', async () => {
    session.vault.verifyPin.mockResolvedValue(false);

    await expect(claimForVote('event-1', '1234567', '0000')).resolves.toEqual({
      claimed: false,
      invalidPin: true,
      backupUpdated: false,
    });
    expect(axios.get).not.toHaveBeenCalled();
    expect(session.client.claimCredentialFromIssuer).not.toHaveBeenCalled();
  });

  it('falla si back-results no devuelve la oferta (backend anterior)', async () => {
    axios.get.mockResolvedValue({data: {vc: 'cred-1'}});

    await expect(claimForVote('event-1', '1234567', '4321')).resolves.toEqual({
      claimed: false,
      invalidPin: false,
      backupUpdated: false,
    });
    expect(session.client.claimCredentialFromIssuer).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({step: 'claim-credential'}),
    );
  });

  it('falla sin subir el respaldo si el SDK no guarda la credencial', async () => {
    session.client.claimCredentialFromIssuer.mockResolvedValue({stored: false});

    await expect(claimForVote('event-1', '1234567', '4321')).resolves.toMatchObject({
      claimed: false,
    });
    expect(uploadRegistryBackup).not.toHaveBeenCalled();
  });

  it('si el respaldo no se puede subir, la credencial queda reclamada y se informa', async () => {
    const error = new Error('network');
    uploadRegistryBackup.mockRejectedValueOnce(error);

    await expect(claimForVote('event-1', '1234567', '4321')).resolves.toEqual({
      claimed: true,
      invalidPin: false,
      backupUpdated: false,
    });
    expect(captureError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({step: 'registry-backup', critical: false}),
    );
  });

  it('un error del vault al verificar el PIN no se trata como PIN incorrecto', async () => {
    session.vault.verifyPin.mockRejectedValue(new VaultError('VAULT_LOCKED_OUT', 'locked'));

    await expect(claimForVote('event-1', '1234567', '4321')).resolves.toEqual({
      claimed: false,
      invalidPin: false,
      backupUpdated: false,
    });
  });
});
