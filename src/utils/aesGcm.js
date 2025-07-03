// src/utils/aesGcm.js
import crypto from 'react-native-quick-crypto';

// helpers
const algo   = 'aes-256-gcm';
const ivSize = 12;            // 96 bits, recomendado por NIST

export function aesGcmEncrypt(plainBytes, keyBytes) {
  const iv      = crypto.randomBytes(ivSize);
  const cipher  = crypto.createCipheriv(algo, Buffer.from(keyBytes), iv);

  const enc1    = cipher.update(Buffer.from(plainBytes));
  const enc2    = cipher.final();
  const tag     = cipher.getAuthTag();        // 16 bytes

  // IV + cipher + tag
  return Buffer.concat([iv, enc1, enc2, tag]);
}

export function aesGcmDecrypt(cipherBytes, keyBytes) {
  const buf   = Buffer.from(cipherBytes);
  const iv    = buf.slice(0, ivSize);
  const tag   = buf.slice(buf.length - 16);
  const data  = buf.slice(ivSize, buf.length - 16);

  const decipher = crypto.createDecipheriv(algo, Buffer.from(keyBytes), iv);
  decipher.setAuthTag(tag);

  const dec1 = decipher.update(data);
  const dec2 = decipher.final();

  return Buffer.concat([dec1, dec2]);
}
