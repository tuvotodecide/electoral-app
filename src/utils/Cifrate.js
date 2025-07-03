import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SHA256} from 'crypto-js';

import { keccak_256 as keccak256 } from '@noble/hashes/sha3';

import { argon2id } from '@noble/hashes/argon2';
import { Wallet } from 'ethers';
import {
  bytesToHex as hex,
  hexToBytes as buf,
  utf8ToBytes,
} from '@noble/hashes/utils';

import { randomBytes } from 'react-native-quick-crypto';
import { aesGcmEncrypt, aesGcmDecrypt } from './aesGcm';

const KEYCHAIN_ID = 'finline.wallet.vc';
const FLAGS_KEY = 'FINLINE_FLAGS';

export async function createSeedBundle(pin) {
  const seed = randomBytes(32);     
  const salt = randomBytes(16);

  const key = argon2id(utf8ToBytes(pin), salt, {
    t: 2,
    m: 16 * 1024,
    p: 1,
    dkLen: 32,
  });

  const cipher = await aesGcmEncrypt(seed, key);

  return {
    seedHex:   hex(seed),        // <- 32 bytes, sirve como llave
    cipherHex: hex(cipher),      // <- 60 bytes, para guardar seguro
    saltHex:   hex(salt),
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
    t: 2,
    m: 4 * 1024,
    p: 1,
    dkLen: 32,
  });
  return aesGcmDecrypt(buf(bundle.seedHex), key);
}

export async function saveSecrets(pin, payloadQr, useBiometry) {
  await Keychain.setGenericPassword(
    KEYCHAIN_ID, 
    JSON.stringify(payloadQr), 
    {
      service: KEYCHAIN_ID,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: useBiometry
        ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE
        : undefined,
      authenticationPrompt: {
        title: 'Autentícate',
        subtitle: 'Desbloquea tu billetera',
        cancel: 'Cancelar',
      },
    },
  );

  await AsyncStorage.setItem(
    FLAGS_KEY,
    JSON.stringify({
      PIN_HASH: SHA256(pin.trim()).toString(),
      BIO_ENABLED: useBiometry,
      HAS_WALLET: true,
    }),
  );
}

export async function getSecrets() {
  const res = await Keychain.getGenericPassword({
    service: KEYCHAIN_ID,
    authenticationPrompt: 'Identifícate para abrir tu billetera',
  });
  const flags = await AsyncStorage.getItem(FLAGS_KEY);

  if (!res || !flags) return null;
  return {payloadQr: JSON.parse(res.password), flags: JSON.parse(flags)};
}

export async function checkPin(pin) {
  const flags = await AsyncStorage.getItem(FLAGS_KEY);
  if (!flags) return false;
  const {PIN_HASH} = JSON.parse(flags);
  return SHA256(pin.trim()).toString() === PIN_HASH;
}
