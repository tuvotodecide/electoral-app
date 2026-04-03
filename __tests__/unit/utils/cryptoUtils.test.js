import {
  getCredentialSubjectFromPayload,
} from '../../../src/utils/Cifrate';

describe('Cifrate utils (crypto)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getCredentialSubjectFromPayload extrae subject', () => {
    expect(getCredentialSubjectFromPayload({vc: {credentialSubject: {a: 1}}})).toEqual({a: 1});
    expect(getCredentialSubjectFromPayload({vc: {vc: {credentialSubject: {b: 2}}}})).toEqual({b: 2});
  });
});
