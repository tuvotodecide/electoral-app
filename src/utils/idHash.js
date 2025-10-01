import {keccak_256} from '@noble/hashes/sha3';
import {utf8ToBytes, bytesToHex} from '@noble/hashes/utils';

export function normalizeDni(dni) {
  return (dni || '').toString().trim().toLowerCase().replace(/\s+/g, '');
}

export function discoverableHashFromDni(dni) {
  const norm = normalizeDni(dni);
  const hash = keccak_256(utf8ToBytes(norm));
  return '0x' + bytesToHex(hash);
}
