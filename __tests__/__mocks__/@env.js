// Mock para variables de entorno (@env)
const envConfig = {
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
  API_URL: 'https://test-api.com',
  APP_ENV: 'test',
};

// Export por defecto y named exports para mayor compatibilidad  
module.exports = envConfig;
module.exports.BACKEND_RESULT = 'https://test-backend.com';
module.exports.BACKEND_SECRET = 'test-secret';
module.exports.CHAIN = 'test-chain';
module.exports.API_URL = 'https://test-api.com';
module.exports.APP_ENV = 'test';

// También para imports ES6
module.exports.default = envConfig;