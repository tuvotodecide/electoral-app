module.exports = {
  __esModule: true,
  getRandomBytesAsync: jest.fn(async size => new Uint8Array(size)),
  digestStringAsync: jest.fn(async () => 'mock-digest'),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
};
