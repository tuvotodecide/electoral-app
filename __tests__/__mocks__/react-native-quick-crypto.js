/**
 * Mock para react-native-quick-crypto
 * Proporciona implementaciones mock para funciones criptográficas
 */

// Mock de randomBytes usando crypto-js o un generador simple
export const randomBytes = jest.fn((size) => {
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
});

// Mock del módulo QuickCrypto
export const QuickCrypto = {
  randomBytes: randomBytes,
  pbkdf2: jest.fn((password, salt, iterations, keylen, digest) => {
    return Promise.resolve(new Uint8Array(keylen));
  }),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => new Uint8Array(32)),
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => new Uint8Array(32)),
  })),
};

// Exportaciones adicionales
export const createHash = QuickCrypto.createHash;
export const createHmac = QuickCrypto.createHmac;
export const pbkdf2 = QuickCrypto.pbkdf2;

// Mock del módulo completo
const quickCryptoMock = {
  randomBytes,
  QuickCrypto,
  createHash,
  createHmac,
  pbkdf2,
};

export default quickCryptoMock;
