jest.mock('../../../src/utils/Cifrate', () => ({
  checkPin: jest.fn(),
  createBundleFromPrivKey: jest.fn(),
  getSecrets: jest.fn(),
  saveSecrets: jest.fn(),
}));

jest.mock('../../../src/utils/PinAttempts', () => ({
  resetAttempts: jest.fn(),
}));

jest.mock('../../../src/utils/BioFlag', () => ({
  getBioFlag: jest.fn(),
}));

jest.mock('../../../src/utils/Session', () => ({
  getJwt: jest.fn(),
}));

jest.mock('../../../src/utils/ensureBundle', () => ({
  writeBundleAtomic: jest.fn(() => Promise.resolve()),
}));

import * as Keychain from 'react-native-keychain';
import {changePin} from '../../../src/utils/changePin';
import {
  checkPin,
  createBundleFromPrivKey,
  getSecrets,
  saveSecrets,
} from '../../../src/utils/Cifrate';
import {resetAttempts} from '../../../src/utils/PinAttempts';
import {getBioFlag} from '../../../src/utils/BioFlag';
import {getJwt} from '../../../src/utils/Session';
import {writeBundleAtomic} from '../../../src/utils/ensureBundle';

describe('changePin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lanza error si el pin actual es incorrecto', async () => {
    checkPin.mockResolvedValueOnce(false);
    await expect(changePin('1111', '2222')).rejects.toThrow(
      'PIN actual incorrecto',
    );
  });

  it('lanza error si no hay secretos almacenados', async () => {
    checkPin.mockResolvedValueOnce(true);
    getSecrets.mockResolvedValueOnce(null);
    await expect(changePin('1111', '2222')).rejects.toThrow(
      'No se encontraron datos cifrados',
    );
  });

  it('actualiza secretos y bundle cuando el pin es vÃ¡lido', async () => {
    checkPin.mockResolvedValueOnce(true);
    getSecrets.mockResolvedValueOnce({
      payloadQr: {privKey: '0xabc', account: '0x1', guardian: 'g', salt: 's'},
    });
    createBundleFromPrivKey.mockResolvedValueOnce({
      cipherHex: 'c',
      saltHex: 's',
    });
    getBioFlag.mockResolvedValueOnce(false);
    getJwt.mockResolvedValueOnce('jwt-1');

    await changePin('1111', '2222');

    expect(saveSecrets).toHaveBeenCalled();
    expect(writeBundleAtomic).toHaveBeenCalled();
    expect(resetAttempts).toHaveBeenCalled();
    expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
  });

  it('guarda bundle en keychain cuando biometry estÃ¡ habilitado', async () => {
    checkPin.mockResolvedValueOnce(true);
    getSecrets.mockResolvedValueOnce({
      payloadQr: {privKey: '0xabc', account: '0x1', guardian: 'g', salt: 's'},
    });
    createBundleFromPrivKey.mockResolvedValueOnce({
      cipherHex: 'c',
      saltHex: 's',
    });
    getBioFlag.mockResolvedValue(true);
    getJwt.mockResolvedValueOnce('jwt-2');

    await changePin('1111', '2222');

    expect(Keychain.setGenericPassword).toHaveBeenCalled();
  });
});
