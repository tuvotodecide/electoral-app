// Mock para variables de entorno (@env)
const envConfig = {
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  BACKEND_IDENTITY: 'did:example:backend',
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
  APP_ENV: 'test',
};

// Export por defecto y named exports para mayor compatibilidad  
module.exports = envConfig;
module.exports.BACKEND_RESULT = 'https://test-backend.com';
module.exports.BACKEND_SECRET = 'test-secret';
module.exports.BACKEND_IDENTITY = 'did:example:backend';
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
module.exports.APP_ENV = 'test';

// También para imports ES6
module.exports.default = envConfig;
