jest.mock('react-native-quick-crypto', () => ({
  randomBytes: jest.fn(size => {
    const buf = new Uint8Array(size);
    buf.fill(1);
    return buf;
  }),
}));

jest.mock('@noble/hashes/argon2', () => ({
  argon2id: jest.fn(() => new Uint8Array([7, 7, 7, 7])),
}));

jest.mock('@noble/hashes/sha3', () => ({
  keccak_256: jest.fn(() => new Uint8Array([4, 4, 4, 4])),
}));

jest.mock('@noble/hashes/utils', () => ({
  bytesToHex: jest.fn(() => 'deadbeef'),
  hexToBytes: jest.fn(() => new Uint8Array([9, 9, 9])),
  utf8ToBytes: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

jest.mock('../../../src/utils/ensureBundle', () => ({
  readBundleFile: jest.fn(() => null),
  writeBundleAtomic: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../src/utils/aesGcm', () => ({
  aesGcmEncrypt: jest.fn(() => Buffer.from('cipher')),
  aesGcmDecrypt: jest.fn(() => Buffer.from('{"ok":true}')),
}));

import {
  createBundleFromPrivKey,
  createSeedBundle,
  hashIdentifier,
  unlockSeed,
  decryptRecoveryPayload,
  getCredentialSubjectFromPayload,
} from '../../../src/utils/Cifrate';

describe('Cifrate utils (crypto)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea seed bundle y bundle desde privKey', async () => {
    const seedBundle = await createSeedBundle('1234');
    expect(seedBundle).toEqual({
      seedHex: 'deadbeef',
      cipherHex: 'deadbeef',
      saltHex: 'deadbeef',
    });

    const bundle = await createBundleFromPrivKey('1234', '0xdead');
    expect(bundle.seedHex).toBe('deadbeef');
  });

  it('hashIdentifier genera hash', () => {
    const hash = hashIdentifier('123');
    expect(hash).toBeInstanceOf(Uint8Array);
  });

  it('unlockSeed y decryptRecoveryPayload devuelven bytes y json', async () => {
    const out = await unlockSeed('1234', {saltHex: '00', cipherHex: '00'});
    expect(out).toBeInstanceOf(Buffer);

    const payload = await decryptRecoveryPayload('00', '1234');
    expect(payload).toEqual({ok: true});
  });

  it('getCredentialSubjectFromPayload extrae subject', () => {
    expect(getCredentialSubjectFromPayload({vc: {credentialSubject: {a: 1}}})).toEqual({a: 1});
    expect(getCredentialSubjectFromPayload({vc: {vc: {credentialSubject: {b: 2}}}})).toEqual({b: 2});
  });
});
