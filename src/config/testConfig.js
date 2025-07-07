// Configuración para el modo de desarrollo/testing

export const TEST_CONFIG = {
  // PIN de desarrollo - cambia este valor para usar un PIN diferente
  DEFAULT_TEST_PIN: '1234',

  // PINs válidos adicionales para testing
  VALID_TEST_PINS: ['1234', '0000', '1111', '2580'],

  // Usuario de prueba que se carga automáticamente
  MOCK_USER: {
    account: '0x1234567890abcdef1234567890abcdef12345678',
    guardian: '0xabcdef1234567890abcdef1234567890abcdef12',
    payloadQr: {
      account: '0x1234567890abcdef1234567890abcdef12345678',
      guardian: '0xabcdef1234567890abcdef1234567890abcdef12',
      privKey: 'mock_private_key_for_testing',
      streamId: 'mock_stream_id_12345',
    },
    vc: {
      credentialSubject: {
        id: 'did:test:user123',
        name: 'Usuario Test',
        email: 'test@wira.app',
        cedula: '12345678',
        telefono: '+591 70000000',
        direccion: 'La Paz, Bolivia',
        fechaNacimiento: '1990-01-01',
        nacionalidad: 'Boliviana',
      },
    },
  },

  // JWT mockeado para testing
  MOCK_JWT:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.mock_jwt_token_for_testing',

  // Configuración del flujo de test
  AUTO_NAVIGATE_DELAY: 1000, // Delay en ConnectTest antes de navegar al login
  SIMULATE_LOADING_DELAY: 500, // Delay para simular carga en verificación de PIN

  // Flags de comportamiento
  SHOW_TEST_INDICATORS: true, // Mostrar indicadores visuales de modo test
  ENABLE_TEST_LOGS: true, // Habilitar logs de depuración
  MAX_PIN_ATTEMPTS: 5, // Máximo número de intentos de PIN
  DISABLE_NETWORK_CALLS: true, // Deshabilitar todas las llamadas de red en modo test
};

// Función helper para logs de test
export const testLog = (message, ...args) => {
  if (TEST_CONFIG.ENABLE_TEST_LOGS) {
    console.log(`[TEST] ${message}`, ...args);
  }
};

// Función para verificar si un PIN es válido
export const isValidTestPin = pin => {
  return TEST_CONFIG.VALID_TEST_PINS.includes(pin);
};

// Función para obtener el usuario mockeado
export const getMockUser = () => {
  return TEST_CONFIG.MOCK_USER;
};

// Función para obtener el JWT mockeado
export const getMockJWT = () => {
  return TEST_CONFIG.MOCK_JWT;
};
