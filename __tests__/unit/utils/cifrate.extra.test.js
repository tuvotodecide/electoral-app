const store = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key, value) => {
    store[key] = value;
    return Promise.resolve();
  }),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve()),
  getGenericPassword: jest.fn(() => Promise.resolve(null)),
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when_unlocked'},
}));

jest.mock('react-native-quick-crypto', () => ({
  randomBytes: jest.fn(size => new Uint8Array(size).fill(7)),
}));

jest.mock('crypto-js', () => ({
  SHA256: jest.fn(() => ({toString: () => 'hash'})),
}));

jest.mock('@noble/hashes/sha3', () => ({
  keccak_256: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

jest.mock('@noble/hashes/argon2', () => ({
  argon2id: jest.fn(() => new Uint8Array([9, 9])),
}));

jest.mock('@noble/hashes/utils', () => ({
  bytesToHex: jest.fn(() => '0xhex'),
  hexToBytes: jest.fn(() => new Uint8Array([1, 2])),
  utf8ToBytes: jest.fn(() => new Uint8Array([3, 4])),
}));

jest.mock('ethers', () => ({
  Wallet: jest.fn(() => ({
    signMessage: jest.fn(async () => 'sig'),
  })),
}));

jest.mock('../../../src/utils/aesGcm', () => ({
  aesGcmEncrypt: jest.fn(async () => new Uint8Array([8, 8])),
  aesGcmDecrypt: jest.fn(async () => Buffer.from('{"a":1}')),
}));

jest.mock('../../../src/utils/BioFlag', () => ({
  getBioFlag: jest.fn(async () => true),
  setBioFlag: jest.fn(async () => true),
}));

jest.mock('../../../src/utils/ensureBundle', () => ({
  readBundleFile: jest.fn(async () => null),
  writeBundleAtomic: jest.fn(async () => true),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import Keychain from 'react-native-keychain';
import {readBundleFile, writeBundleAtomic} from '../../../src/utils/ensureBundle';
import {
  checkPin,
  createBundleFromPrivKey,
  createSeedBundle,
  decryptRecoveryPayload,
  getCredentialSubjectFromPayload,
  getSecrets,
  hashIdentifier,
  unlockSeed,
  saveSecrets,
  signWithKey,
} from '../../../src/utils/Cifrate';

describe('Cifrate utils', () => {
  beforeEach(() => {
    Object.keys(store).forEach(key => delete store[key]);
    jest.clearAllMocks();
  });

  it('createSeedBundle genera bundle', async () => {
    const bundle = await createSeedBundle('1234');
    expect(bundle).toHaveProperty('seedHex');
    expect(bundle).toHaveProperty('cipherHex');
    expect(bundle).toHaveProperty('saltHex');
  });

  it('createBundleFromPrivKey usa privKey existente', async () => {
    const bundle = await createBundleFromPrivKey('1234', '0xabc');
    expect(bundle.seedHex).toBeDefined();
    expect(bundle.cipherHex).toBeDefined();
    expect(bundle.saltHex).toBeDefined();
  });

  it('signWithKey firma mensaje', async () => {
    const sig = await signWithKey('0xpriv', 'hello');
    expect(sig).toBe('sig');
  });

  it('hashIdentifier usa keccak', () => {
    const out = hashIdentifier('123', 'salt');
    expect(out).toBeInstanceOf(Uint8Array);
  });

  it('saveSecrets persiste datos y bundle', async () => {
    await saveSecrets(
      '1234',
      {account: '0x1', guardian: '0x2', salt: '1'},
      true,
      {cipherHex: 'c', saltHex: 's'},
    );
    expect(Keychain.setGenericPassword).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    expect(writeBundleAtomic).toHaveBeenCalled();
  });

  it('getSecrets devuelve bundle cuando no hay keychain', async () => {
    readBundleFile.mockResolvedValueOnce({account: '0x1'});
    const out = await getSecrets(true);
    expect(out.payloadQr.account).toBe('0x1');
  });

  it('getSecrets devuelve keychain cuando hay flags', async () => {
    Keychain.getGenericPassword.mockResolvedValueOnce({
      password: JSON.stringify({account: '0x2'}),
    });
    store['FINLINE_FLAGS'] = JSON.stringify({PIN_HASH: 'hash'});
    const out = await getSecrets();
    expect(out.payloadQr.account).toBe('0x2');
  });

  it('checkPin compara hash cuando flags existen', async () => {
    store['FINLINE_FLAGS'] = JSON.stringify({PIN_HASH: 'hash'});
    await expect(checkPin('1234')).resolves.toBe(true);
  });

  it('checkPin retorna false si unlock falla', async () => {
    const {aesGcmDecrypt} = require('../../../src/utils/aesGcm');
    aesGcmDecrypt.mockRejectedValueOnce(new Error('fail'));
    readBundleFile.mockResolvedValueOnce({
      cipherHex: 'c',
      saltHex: 's',
      account: '0x1',
      guardian: '0x2',
      salt: '1',
    });
    await expect(checkPin('1234')).resolves.toBe(false);
  });

  it('unlockSeed descifra bundle', async () => {
    const out = await unlockSeed('1234', {cipherHex: 'c', saltHex: 's'});
    expect(out).toBeInstanceOf(Buffer);
  });

  it('decryptRecoveryPayload descifra y parsea', async () => {
    const encryptedHex = '0011';
    await expect(decryptRecoveryPayload(encryptedHex, '1234')).resolves.toEqual({
      a: 1,
    });
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
