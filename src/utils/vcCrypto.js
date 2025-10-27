import {argon2id} from '@noble/hashes/argon2';
import {
  utf8ToBytes,
  bytesToHex as hex,
  hexToBytes as buf,
} from '@noble/hashes/utils';
import {aesGcmEncrypt, aesGcmDecrypt} from './aesGcm';
import {randomBytes} from 'react-native-quick-crypto';

export async function encryptVCWithPin(vcObj, pin) {
  const salt = randomBytes(16);
  const key = argon2id(utf8ToBytes(pin), salt, {
    t: 1,
    m: 512,
    p: 1,
    dkLen: 32,
  });
  const plain = utf8ToBytes(JSON.stringify(vcObj));
  const cipher = await aesGcmEncrypt(plain, key);
  const payload = new Uint8Array(salt.length + cipher.length);
  payload.set(salt, 0);
  payload.set(cipher, salt.length);
  return hex(payload);
}

export async function decryptVCWithPin(vcHex, pin) {
  const bytes = buf(vcHex);
  const salt = bytes.slice(0, 16);
  const body = bytes.slice(16);
  const key = argon2id(utf8ToBytes(pin), salt, {
    t: 1,
    m: 512,
    p: 1,
    dkLen: 32,
  });
  const plain = await aesGcmDecrypt(body, key);
  return JSON.parse(new TextDecoder().decode(plain));
}
