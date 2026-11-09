// Mock de expo-local-authentication: por defecto, sensor de huella con una
// huella registrada y autenticación correcta.
const AuthenticationType = {FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3};

module.exports = {
  __esModule: true,
  AuthenticationType,
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [AuthenticationType.FINGERPRINT]),
  authenticateAsync: jest.fn(async () => ({success: true})),
};
