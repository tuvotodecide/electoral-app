// Mock para variables de entorno (@env)
const envConfig = {
  BACKEND_RESULT: 'https://test-backend.com',
  API_URL: 'https://test-api.com',
  APP_ENV: 'test',
};

// Export por defecto y named exports para mayor compatibilidad  
module.exports = envConfig;
module.exports.BACKEND_RESULT = 'https://test-backend.com';
module.exports.API_URL = 'https://test-api.com';
module.exports.APP_ENV = 'test';

// También para imports ES6
module.exports.default = envConfig;