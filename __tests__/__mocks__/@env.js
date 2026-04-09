// Mock para variables de entorno (@env)
const envConfig = {
  BACKEND_RESULT: 'https://test-backend.com',
  FRONTEND_RESULTS: 'https://frontend-results.example',
  BACKEND: 'https://test-backend.com/',
  BACKEND_URL: 'https://test-backend.com/api',
  BACKEND_SECRET: 'test-secret',
  BACKEND_IDENTITY: 'https://identity.example',
  BACKEND_BLOCKCHAIN: 'https://blockchain.example',
  PROVIDER_NAME: 'test-provider',
  CRED_TYPE: 'test-credential',
  CRED_EXP_DAYS: '365',
  CHAIN: 'arbitrum-sepolia',
  SPONSORSHIP_POLICY: 'test-policy',
  FACTORY: '0x0000000000000000000000000000000000000001',
  BUNDLER: 'https://bundler.test',
  BUNDLER_ARBITRUM: 'https://bundler.test',
  BUNDLER_MAIN: 'https://bundler.test',
  BUNDLER_MAIN_ARBITRUM: 'https://bundler.test',
  API_URL: 'https://test-api.com',
  CIRCUITS_URL: 'https://circuits.example',
  GATEWAY_BASE: 'https://gateway.example',
  TERMS_URL: 'https://terms.example',
  PRIVACY_URL: 'https://privacy.example',
  VERIFIER_REQUEST_ENDPOINT: 'https://verifier.example/request',
  APP_ENV: 'test',
  APP_FLOW: 'attestation',
};

// Export por defecto y named exports para mayor compatibilidad  
module.exports = envConfig;
module.exports.BACKEND_RESULT = 'https://test-backend.com';
module.exports.FRONTEND_RESULTS = 'https://frontend-results.example';
module.exports.BACKEND = 'https://test-backend.com/';
module.exports.BACKEND_URL = 'https://test-backend.com/api';
module.exports.BACKEND_SECRET = 'test-secret';
module.exports.BACKEND_IDENTITY = 'https://identity.example';
module.exports.BACKEND_BLOCKCHAIN = 'https://blockchain.example';
module.exports.PROVIDER_NAME = 'test-provider';
module.exports.CRED_TYPE = 'test-credential';
module.exports.CRED_EXP_DAYS = '365';
module.exports.CHAIN = 'arbitrum-sepolia';
module.exports.SPONSORSHIP_POLICY = 'test-policy';
module.exports.FACTORY = '0x0000000000000000000000000000000000000001';
module.exports.BUNDLER = 'https://bundler.test';
module.exports.BUNDLER_ARBITRUM = 'https://bundler.test';
module.exports.BUNDLER_MAIN = 'https://bundler.test';
module.exports.BUNDLER_MAIN_ARBITRUM = 'https://bundler.test';
module.exports.API_URL = 'https://test-api.com';
module.exports.CIRCUITS_URL = 'https://circuits.example';
module.exports.GATEWAY_BASE = 'https://gateway.example';
module.exports.TERMS_URL = 'https://terms.example';
module.exports.PRIVACY_URL = 'https://privacy.example';
module.exports.VERIFIER_REQUEST_ENDPOINT = 'https://verifier.example/request';
module.exports.APP_ENV = 'test';
module.exports.APP_FLOW = 'attestation';

// También para imports ES6
module.exports.default = envConfig;
