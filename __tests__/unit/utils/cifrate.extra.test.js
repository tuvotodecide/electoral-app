import {
  getCredentialSubjectFromPayload,
} from '../../../src/utils/Cifrate';

describe('Cifrate utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCredentialSubjectFromPayload extrae vc', () => {
    const out = getCredentialSubjectFromPayload({
      vc: {credentialSubject: {id: '1'}},
    });
    expect(out).toEqual({id: '1'});
  });

  it('getCredentialSubjectFromPayload retorna null si no hay vc', () => {
    expect(getCredentialSubjectFromPayload({})).toBeNull();
  });
});
