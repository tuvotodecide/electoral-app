
import {SHA256} from 'crypto-js';

export function makeQrPayload(bundle) {
  const data = JSON.stringify(bundle);
  return JSON.stringify({
    v: 1,
    data: bundle,
    sig: SHA256(data).toString(),
  });
}

export function parseQrPayload(str) {
  let obj;
  try { obj = JSON.parse(str); } catch { throw new Error('QR inválido'); }
  if (obj.v !== 1)           throw new Error('Versión no soportada');
  if (obj.sig !== SHA256(JSON.stringify(obj.data)).toString())
    throw new Error('QR corrupto');
  return obj.data;
}
