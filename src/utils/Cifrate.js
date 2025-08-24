import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SHA256} from 'crypto-js';

import {keccak_256 as keccak256} from '@noble/hashes/sha3';

import {argon2id} from '@noble/hashes/argon2';
import {Wallet} from 'ethers';
import {
  bytesToHex as hex,
  hexToBytes as buf,
  utf8ToBytes,
} from '@noble/hashes/utils';

import {randomBytes} from 'react-native-quick-crypto';
import {aesGcmEncrypt, aesGcmDecrypt} from './aesGcm';
import {getBioFlag, setBioFlag} from './BioFlag';
import {getJwt} from './Session';
import {readBundleFile, writeBundleAtomic} from './ensureBundle';
import {FLAGS_KEY, KEYCHAIN_ID} from '../common/constants';

export async function createBundleFromPrivKey(pin, privKey) {
  const seed = buf(privKey.startsWith('0x') ? privKey.slice(2) : privKey); // = seed
  const salt = randomBytes(16);
  const key = argon2id(utf8ToBytes(pin), salt, {t: 1, m: 512, p: 1, dkLen: 32});
  const cipher = await aesGcmEncrypt(seed, key);
  return {seedHex: hex(seed), cipherHex: hex(cipher), saltHex: hex(salt)};
}

export async function createSeedBundle(pin) {
  const seed = randomBytes(32);
  const salt = randomBytes(16);

  const key = argon2id(utf8ToBytes(pin), salt, {
    t: 1,
    m: 512,
    p: 1,
    dkLen: 32,
  });

  const cipher = await aesGcmEncrypt(seed, key);

  return {
    seedHex: hex(seed),
    cipherHex: hex(cipher),
    saltHex: hex(salt),
  };
}

export async function signWithKey(privKey, message) {
  const wallet = new Wallet(privKey);
  return wallet.signMessage(message);
}

export function hashIdentifier(dni, salt = '') {
  return keccak256(utf8ToBytes(dni + salt));
}

export async function unlockSeed(pin, bundle) {
  const key = argon2id(utf8ToBytes(pin), buf(bundle.saltHex), {
    t: 1,
    m: 512,
    p: 1,
    dkLen: 32,
  });
  return aesGcmDecrypt(buf(bundle.cipherHex), key);
}

export async function saveSecrets(
  pin,
  payloadQr,
  useBiometry,
  bundle,
  pinHashOpt,
) {
  await Keychain.setGenericPassword(
    'finline.wallet.vc',
    JSON.stringify(payloadQr),
    {
      service: 'finline.wallet.vc',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
  await setBioFlag(!!useBiometry);

  const pinHash =
    (pin && String(pin).length ? SHA256(pin.trim()).toString() : pinHashOpt) ||
    null;
  if (!pinHash)
    throw new Error('No hay PIN ni pinHash para finalizar el registro');

  await AsyncStorage.setItem(
    FLAGS_KEY,
    JSON.stringify({
      PIN_HASH: pinHash,
      BIO_ENABLED: useBiometry,
      HAS_WALLET: true,
    }),
  );
  const jwt = await getJwt();
  await writeBundleAtomic(
    JSON.stringify({
      cipherHex: bundle.cipherHex,
      saltHex: bundle.saltHex,
      streamId: payloadQr.streamId,
      account: payloadQr.account,
      guardian: payloadQr.guardian,
      salt: payloadQr.salt,
      jwt,
    }),
  );
}

export async function getSecrets(allowNoFlags = false) {
  const res = await Keychain.getGenericPassword({
    service: KEYCHAIN_ID,
  });

  const flags = await AsyncStorage.getItem(FLAGS_KEY);

  if (!res) {
    const bundle = await readBundleFile();

    if (!bundle) return null;
    return {payloadQr: bundle, flags: flags ? JSON.parse(flags) : null};
  }
  if (!flags && !allowNoFlags) return null;

  return {
    payloadQr: JSON.parse(res.password),
    flags: flags ? JSON.parse(flags) : null,
  };
}
export async function checkPin(pin) {
  let flags = await AsyncStorage.getItem(FLAGS_KEY);
  if (!flags) {
    const stored = await getSecrets(true);
    if (!stored) return false;

    try {
      const seedBytes = await unlockSeed(pin, stored.payloadQr);
      const privKey = '0x' + hex(seedBytes);

      const payloadForKeychain = {
        streamId: stored.payloadQr.streamId,
        account: stored.payloadQr.account,
        guardian: stored.payloadQr.guardian,
        salt: stored.payloadQr.salt,
        privKey,
      };
      await Keychain.setGenericPassword(
        'finline.wallet.vc',
        JSON.stringify(payloadForKeychain),
        {
          service: KEYCHAIN_ID,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        },
      );

      flags = JSON.stringify({
        PIN_HASH: SHA256(pin.trim()).toString(),
        BIO_ENABLED: await getBioFlag(),
        HAS_WALLET: true,
      });
      await AsyncStorage.setItem(FLAGS_KEY, flags);
      const jwt = await getJwt();
      await writeBundleAtomic(JSON.stringify({...stored.payloadQr, jwt}));
    } catch {
      return false;
    }
    return true;
  }
  const {PIN_HASH} = JSON.parse(flags);
  return SHA256(pin.trim()).toString() === PIN_HASH;
}
export async function decryptRecoveryPayload(encryptedHex, pin) {
  const bytes = buf(encryptedHex);
  const salt = bytes.slice(0, 16);
  const cipher = bytes.slice(16);
  const key = argon2id(utf8ToBytes(pin), salt, {
    t: 2,
    m: 16 * 1024,
    p: 1,
    dkLen: 32,
  });

  const plainBytes = await aesGcmDecrypt(cipher, key);
  return JSON.parse(plainBytes.toString());
}
