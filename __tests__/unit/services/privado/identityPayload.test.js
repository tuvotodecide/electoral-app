import {createMockSession} from '@privado-id/expo-sdk';
import {
  IdentityCredentialMissingError,
  IdentityNotFoundError,
  loadIdentityPayload,
  withLegacySubjectFields,
} from '../../../../src/services/privado/identityPayload';
import {getPrivadoClient} from '../../../../src/services/privado/privadoSession';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

const HOLDER = {
  did: 'did:iden3:base:sepolia:2qHolder',
  keyId: 'BJJ:holder',
  wallet: {address: '0x00000000000000000000000000000000000000aa'},
};
const PERSON_VC = {
  id: 'urn:uuid:person',
  type: ['VerifiableCredential', 'PersonCredential'],
  credentialSubject: {
    id: HOLDER.did,
    fullName: 'Ana Pérez',
    nationalIdNumber: '1234567',
    birthDate: 631152000,
  },
};

describe('withLegacySubjectFields', () => {
  it('añade los nombres de campo de la credencial anterior', () => {
    expect(withLegacySubjectFields(PERSON_VC).credentialSubject).toEqual({
      ...PERSON_VC.credentialSubject,
      governmentIdentifier: '1234567',
      documentNumber: '1234567',
      dateOfBirth: 631152000,
    });
  });

  it('no pisa campos existentes ni modifica la credencial original', () => {
    const vc = {
      credentialSubject: {nationalIdNumber: '1', governmentIdentifier: '2', dateOfBirth: 5, birthDate: 9},
    };
    expect(withLegacySubjectFields(vc).credentialSubject).toEqual({
      nationalIdNumber: '1',
      governmentIdentifier: '2',
      documentNumber: '1',
      dateOfBirth: 5,
      birthDate: 9,
    });
    expect(vc.credentialSubject).not.toHaveProperty('documentNumber');
  });

  it('sin credentialSubject la devuelve igual', () => {
    const vc = {id: 'x'};
    expect(withLegacySubjectFields(vc)).toBe(vc);
    expect(withLegacySubjectFields(undefined)).toBeUndefined();
  });
});

describe('loadIdentityPayload', () => {
  let client;

  beforeEach(() => {
    client = createMockSession().client;
    client.getHolderDid.mockResolvedValue(HOLDER);
    client.getCredentialByType.mockResolvedValue(PERSON_VC);
    getPrivadoClient.mockResolvedValue(client);
  });

  it('arma el payload con el DID, la dirección y la credencial del tipo configurado', async () => {
    const payload = await loadIdentityPayload();

    expect(client.getCredentialByType).toHaveBeenCalledWith('PersonCredential');
    expect(payload).toEqual({
      did: HOLDER.did,
      account: HOLDER.wallet.address,
      dni: '1234567',
      vc: withLegacySubjectFields(PERSON_VC),
    });
    expect(payload).not.toHaveProperty('privKey');
  });

  it('sin identidad lanza IdentityNotFoundError', async () => {
    client.getHolderDid.mockResolvedValue(undefined);
    await expect(loadIdentityPayload()).rejects.toBeInstanceOf(IdentityNotFoundError);
    expect(client.getCredentialByType).not.toHaveBeenCalled();
  });

  it('sin la credencial lanza IdentityCredentialMissingError con los tipos encontrados', async () => {
    client.getCredentialByType.mockResolvedValue(undefined);
    client.getCredentials.mockResolvedValue([
      {id: 'a', type: ['VerifiableCredential', 'Other'], proofTypes: []},
      {id: 'b', type: ['VerifiableCredential', 'Other'], proofTypes: []},
    ]);

    const error = await loadIdentityPayload().catch(e => e);
    expect(error).toBeInstanceOf(IdentityCredentialMissingError);
    expect(error.credentialType).toBe('PersonCredential');
    expect(error.message).toBe('No se encontró la credencial PersonCredential: solo hay Other');
  });
});
