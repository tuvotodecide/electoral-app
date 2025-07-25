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
import {setBioFlag} from './BioFlag';
import {Platform} from 'react-native';
import {getJwt} from './Session';
import {readBundleFile, writeBundleAtomic} from './ensureBundle';

const KEYCHAIN_ID = 'finline.wallet.vc';
const FLAGS_KEY = 'FINLINE_FLAGS';

export async function createSeedBundle(pin) {
  const seed = randomBytes(32);
  const salt = randomBytes(16);

  const key = argon2id(utf8ToBytes(pin), salt, {
    t: 1,
    m: 2 * 1024,
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
    m: 2 * 1024,
    p: 1,
    dkLen: 32,
  });
  return aesGcmDecrypt(buf(bundle.seedHex), key);
}

export async function saveSecrets(pin, payloadQr, useBiometry) {
  const accessControl = !useBiometry
    ? undefined
    : Platform.OS === 'ios'
    ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE
    : Keychain.ACCESS_CONTROL.BIOMETRY_ANY;

  await Keychain.setGenericPassword(
    'finline.wallet.vc',
    JSON.stringify(payloadQr),
    {
      service: 'finline.wallet.vc',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl,
      authenticationPrompt: {
        title: 'Autentícate',
        subtitle: 'Desbloquea tu billetera',
        cancel: 'Cancelar',
      },
    },
  );
  await setBioFlag(!!useBiometry);

  await AsyncStorage.setItem(
    FLAGS_KEY,
    JSON.stringify({
      PIN_HASH: SHA256(pin.trim()).toString(),
      BIO_ENABLED: useBiometry,
      HAS_WALLET: true,
    }),
  );
  const jwt = await getJwt();
  await writeBundleAtomic(JSON.stringify({...payloadQr, jwt}));
}

export async function getSecrets(allowNoFlags = false) {
  const res = await Keychain.getGenericPassword({
    service: KEYCHAIN_ID,
    authenticationPrompt: 'Identifícate para abrir tu billetera',
  });
  console.log(res);

  const flags = await AsyncStorage.getItem(FLAGS_KEY);
  console.log(flags);

  if (!res) {
    const bundle = await readBundleFile();

    if (!bundle) return null; // tampoco hay bundle
    return {payloadQr: bundle, flags: flags ? JSON.parse(flags) : null};
  } // si no está en Keychain → null
  if (!flags && !allowNoFlags) return null; // ⇠ solo corta cuando NO se permite

  return {
    payloadQr: JSON.parse(res.password),
    flags: flags ? JSON.parse(flags) : null,
  };
}
export async function checkPin(pin) {
  let flags = await AsyncStorage.getItem(FLAGS_KEY);
  if (!flags) {
    // console.log('aca');

    // const stored = await getSecrets(true); // lee el bundle
    // if (!stored) return false;
    // console.log(stored);
    // try {
    //   await unlockSeed(pin, stored.payloadQr);
    //   flags = JSON.stringify({
    //     PIN_HASH: SHA256(pin.trim()).toString(),
    //     BIO_ENABLED: await getBioFlag(),
    //     HAS_WALLET: true,
    //   });
    //   console.log(flags);
    //   await AsyncStorage.setItem(FLAGS_KEY, flags);
    //   const jwt = await getJwt();
    //   await writeBundleAtomic(JSON.stringify({...stored.payloadQr, jwt}));
    // } catch {
    //   return false;
    // } // PIN incorrecto
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
