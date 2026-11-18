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
  FACTORY: '0x0000000000000000000000000000000000000001',
  API_URL: 'https://test-api.com',
  CIRCUITS_URL: 'https://circuits.example',
  TERMS_URL: 'https://terms.example',
  PRIVACY_URL: 'https://privacy.example',
  SUPPORT_EMAIL: 'support@example.com',
  VERIFIER_REQUEST_ENDPOINT: 'https://verifier.example/request',
  APP_ENV: 'test',
  APP_FLOW: 'attestation',
  IDENTITY_KEY: 'test-identity-key',
  PRIVADO_BLOCKCHAIN: 'base',
  PRIVADO_NETWORK: 'sepolia',
  PRIVADO_CHAIN_ID: '84532',
  PRIVADO_RPC_URL: 'https://rpc.example',
  PRIVADO_STATE_CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000003',
  PRIVADO_UNIVERSAL_VERIFIER_ADDRESS: '0x0000000000000000000000000000000000000004',
  PRIVADO_DID_RESOLVER_URL: 'https://resolver.example',
  PRIVADO_ISSUER_DID: 'did:iden3:base:sepolia:test-issuer',
  PRIVADO_ISSUER_BASE_URL: 'https://issuer.example',
  PRIVADO_CRED_TYPE: 'PersonCredential',
  PRIVADO_CRED_SCHEMA_URL: 'https://schema.example',
  PRIVADO_CRED_CONTEXT_URL: 'https://context.example',
  PRIVADO_IDENTITY_CREDENTIAL_TYPE: 'PersonCredential',
  PRIVADO_VOTE_CREDENTIAL_TYPE: 'SelectedVoter',
  PRIVADO_IPFS_GATEWAY_URL: 'https://ipfs.example/ipfs',
  PRIVADO_LOCK_ON_BACKGROUND: 'true',
  PRIVADO_IDLE_TIMEOUT_MINUTES: '5',
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
module.exports.FACTORY = '0x0000000000000000000000000000000000000001';
module.exports.API_URL = 'https://test-api.com';
module.exports.CIRCUITS_URL = 'https://circuits.example';
module.exports.TERMS_URL = 'https://terms.example';
module.exports.PRIVACY_URL = 'https://privacy.example';
module.exports.SUPPORT_EMAIL = 'support@example.com';
module.exports.VERIFIER_REQUEST_ENDPOINT = 'https://verifier.example/request';
module.exports.APP_ENV = 'test';
module.exports.APP_FLOW = 'attestation';

// También para imports ES6
module.exports.default = envConfig;
