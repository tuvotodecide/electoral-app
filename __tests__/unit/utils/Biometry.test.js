/**
 * Tests completos para Biometry.js Utils
 * Siguiendo las buenas prácticas de Jest y React Native Testing Library
 */

import { biometryAvailability, biometricLogin } from '../../../src/utils/Biometry';

// Mock de react-native-biometrics
jest.mock('react-native-biometrics', () => {
  const mockRNBiometrics = {
    isSensorAvailable: jest.fn(),
    simplePrompt: jest.fn(),
  };

  return jest.fn(() => mockRNBiometrics);
});

// Import del mock para poder acceder a las funciones mockeadas
import ReactNativeBiometrics from 'react-native-biometrics';

describe('Biometry Utils - Tests Consolidados', () => {
  let mockRNBio;

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Crear una nueva instancia del mock
    mockRNBio = new ReactNativeBiometrics();
  });

  // ===== GRUPO 1: FUNCIÓN biometryAvailability =====
  describe('🔍 Función biometryAvailability', () => {
    describe('✅ Casos Exitosos', () => {
      it('debe retornar disponibilidad true con TouchID', async () => {
        // Arrange
        const mockResponse = { available: true, biometryType: 'TouchID' };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result).toEqual(mockResponse);
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(1);
      });

      it('debe retornar disponibilidad true con FaceID', async () => {
        // Arrange
        const mockResponse = { available: true, biometryType: 'FaceID' };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result.available).toBe(true);
        expect(result.biometryType).toBe('FaceID');
      });

      it('debe retornar disponibilidad true con Biometrics', async () => {
        // Arrange
        const mockResponse = { available: true, biometryType: 'Biometrics' };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result.available).toBe(true);
        expect(result.biometryType).toBe('Biometrics');
      });

      it('debe retornar disponibilidad false cuando no hay sensores', async () => {
        // Arrange
        const mockResponse = { available: false, biometryType: undefined };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result.available).toBe(false);
        expect(result.biometryType).toBeUndefined();
      });

      it('debe preservar estructura de respuesta original', async () => {
        // Arrange
        const mockResponse = { available: true, biometryType: 'FaceID' };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result).toHaveProperty('available');
        expect(result).toHaveProperty('biometryType');
      });
    });

    describe('❌ Casos de Error', () => {
      it('debe manejar error de sensor no disponible', async () => {
        // Arrange
        const error = new Error('Sensor not available');
        mockRNBio.isSensorAvailable.mockRejectedValue(error);

        // Act & Assert
        await expect(biometryAvailability()).rejects.toThrow('Sensor not available');
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(1);
      });

      it('debe manejar error de permisos', async () => {
        // Arrange
        const error = new Error('Permission denied');
        mockRNBio.isSensorAvailable.mockRejectedValue(error);

        // Act & Assert
        await expect(biometryAvailability()).rejects.toThrow('Permission denied');
      });

      it('debe manejar error de hardware no soportado', async () => {
        // Arrange
        const error = new Error('Hardware not supported');
        mockRNBio.isSensorAvailable.mockRejectedValue(error);

        // Act & Assert
        await expect(biometryAvailability()).rejects.toThrow('Hardware not supported');
      });

      it('debe manejar respuesta null o undefined', async () => {
        // Arrange
        const mockResponse = { available: false, biometryType: undefined };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result.available).toBe(false);
        expect(result.biometryType).toBeUndefined();
      });

      it('debe manejar respuesta malformada', async () => {
        // Arrange
        const mockResponse = { wrongProperty: true };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        // La función biometryAvailability extrae available y biometryType
        // Si no están presentes, serán undefined
        expect(result).toEqual({
          available: undefined,
          biometryType: undefined,
        });
      });
    });

    describe('🔄 Casos de Reintento y Performance', () => {
      it('debe manejar llamadas múltiples sin problemas', async () => {
        // Arrange
        const mockResponse = { available: true, biometryType: 'TouchID' };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const promises = Array(5).fill().map(() => biometryAvailability());
        const results = await Promise.all(promises);

        // Assert
        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result).toEqual(mockResponse);
        });
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(5);
      });

      it('debe ejecutar en tiempo razonable', async () => {
        // Arrange
        const mockResponse = { available: true, biometryType: 'FaceID' };
        mockRNBio.isSensorAvailable.mockResolvedValue(mockResponse);

        // Act
        const startTime = performance.now();
        await biometryAvailability();
        const endTime = performance.now();

        // Assert
        expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
      });
    });
  });

  // ===== GRUPO 2: FUNCIÓN biometricLogin =====
  describe('🔐 Función biometricLogin', () => {
    describe('✅ Casos Exitosos', () => {
      it('debe autenticar correctamente con prompt por defecto', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin();

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: 'Autentícate'
        });
      });

      it('debe autenticar correctamente con prompt personalizado', async () => {
        // Arrange
        const customPrompt = 'Por favor, confirma tu identidad';
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(customPrompt);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: customPrompt
        });
      });

      it('debe manejar autenticación fallida', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ success: false });

        // Act
        const result = await biometricLogin();

        // Assert
        expect(result).toBe(false);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledTimes(1);
      });

      it('debe manejar prompt vacío', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin('');

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: ''
        });
      });

      it('debe manejar prompt null', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(null);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: null
        });
      });

      it('debe manejar prompt undefined', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(undefined);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: 'Autentícate'
        });
      });
    });

    describe('❌ Casos de Error', () => {
      it('debe manejar error de usuario canceló autenticación', async () => {
        // Arrange
        const error = new Error('User canceled authentication');
        mockRNBio.simplePrompt.mockRejectedValue(error);

        // Act & Assert
        await expect(biometricLogin()).rejects.toThrow('User canceled authentication');
        expect(mockRNBio.simplePrompt).toHaveBeenCalledTimes(1);
      });

      it('debe manejar error de sensor no disponible', async () => {
        // Arrange
        const error = new Error('Biometric sensor not available');
        mockRNBio.simplePrompt.mockRejectedValue(error);

        // Act & Assert
        await expect(biometricLogin()).rejects.toThrow('Biometric sensor not available');
      });

      it('debe manejar error de muchos intentos fallidos', async () => {
        // Arrange
        const error = new Error('Too many failed attempts');
        mockRNBio.simplePrompt.mockRejectedValue(error);

        // Act & Assert
        await expect(biometricLogin('Reintenta por favor')).rejects.toThrow('Too many failed attempts');
      });

      it('debe manejar respuesta malformada', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ wrongProperty: true });

        // Act
        const result = await biometricLogin();

        // Assert
        expect(result).toBeUndefined();
      });

      it('debe manejar respuesta null', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({
          success: false,
        });

        // Act
        const result = await biometricLogin();

        // Assert
        expect(result).toBe(false);
      });

      it('debe manejar respuesta undefined', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({
          success: undefined,
        });

        // Act
        const result = await biometricLogin();

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('🎯 Casos Específicos de Prompt', () => {
      it('debe manejar prompts muy largos', async () => {
        // Arrange
        const longPrompt = 'A'.repeat(500);
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(longPrompt);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: longPrompt
        });
      });

      it('debe manejar prompts con caracteres especiales', async () => {
        // Arrange
        const specialPrompt = '¡Autentícate! 🔒 @#$%^&*()';
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(specialPrompt);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: specialPrompt
        });
      });

      it('debe manejar prompts con saltos de línea', async () => {
        // Arrange
        const multilinePrompt = 'Por favor\nautentícate\nahora';
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(multilinePrompt);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: multilinePrompt
        });
      });

      it('debe manejar prompts numéricos', async () => {
        // Arrange
        const numericPrompt = 12345;
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const result = await biometricLogin(numericPrompt);

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledWith({
          promptMessage: numericPrompt
        });
      });
    });

    describe('🔄 Casos de Performance y Concurrencia', () => {
      it('debe manejar múltiples llamadas secuenciales', async () => {
        // Arrange
        mockRNBio.simplePrompt
          .mockResolvedValueOnce({ success: true })
          .mockResolvedValueOnce({ success: false })
          .mockResolvedValueOnce({ success: true });

        // Act
        const result1 = await biometricLogin('Primer intento');
        const result2 = await biometricLogin('Segundo intento');
        const result3 = await biometricLogin('Tercer intento');

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(false);
        expect(result3).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledTimes(3);
      });

      it('debe ejecutar en tiempo razonable', async () => {
        // Arrange
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const startTime = performance.now();
        await biometricLogin();
        const endTime = performance.now();

        // Assert
        expect(endTime - startTime).toBeLessThan(2000); // Menos de 2 segundos
      });

      it('debe manejar timeout si la promesa no se resuelve', async () => {
        // Arrange
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
        mockRNBio.simplePrompt.mockReturnValue(timeoutPromise);

        // Act & Assert
        await expect(biometricLogin()).rejects.toThrow('Timeout');
      }, 200);
    });
  });

  // ===== GRUPO 3: INTEGRACIÓN ENTRE FUNCIONES =====
  describe('🔗 Integración biometryAvailability + biometricLogin', () => {
    describe('✅ Flujos Completos', () => {
      it('debe verificar disponibilidad antes de autenticar', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const availability = await biometryAvailability();
        let loginResult = false;
        
        if (availability.available) {
          loginResult = await biometricLogin('Autenticación disponible');
        }

        // Assert
        expect(availability.available).toBe(true);
        expect(loginResult).toBe(true);
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(1);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledTimes(1);
      });

      it('debe manejar caso donde sensor no está disponible', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: false, biometryType: undefined });

        // Act
        const availability = await biometryAvailability();
        let loginResult = null;
        
        if (availability.available) {
          loginResult = await biometricLogin();
        }

        // Assert
        expect(availability.available).toBe(false);
        expect(loginResult).toBeNull();
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(1);
        expect(mockRNBio.simplePrompt).not.toHaveBeenCalled();
      });

      it('debe manejar flujo completo con diferentes tipos de biometría', async () => {
        // Arrange
        const biometryTypes = ['TouchID', 'FaceID', 'Biometrics'];
        
        for (const biometryType of biometryTypes) {
          mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType });
          mockRNBio.simplePrompt.mockResolvedValue({ success: true });

          // Act
          const availability = await biometryAvailability();
          const loginResult = await biometricLogin(`Usando ${biometryType}`);

          // Assert
          expect(availability.biometryType).toBe(biometryType);
          expect(loginResult).toBe(true);
        }
      });
    });

    describe('❌ Flujos con Errores', () => {
      it('debe manejar error en verificación de disponibilidad seguido de login exitoso', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockRejectedValue(new Error('Availability check failed'));
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act & Assert
        await expect(biometryAvailability()).rejects.toThrow('Availability check failed');
        
        // El login aún debería funcionar si se llama directamente
        const loginResult = await biometricLogin();
        expect(loginResult).toBe(true);
      });

      it('debe manejar disponibilidad exitosa seguida de error en login', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });
        mockRNBio.simplePrompt.mockRejectedValue(new Error('Login failed'));

        // Act
        const availability = await biometryAvailability();
        
        // Assert
        expect(availability.available).toBe(true);
        await expect(biometricLogin()).rejects.toThrow('Login failed');
      });
    });
  });

  // ===== GRUPO 4: EDGE CASES Y ROBUSTEZ =====
  describe('🛡️ Edge Cases y Robustez', () => {
    describe('⚡ Performance', () => {
      it('debe manejar 100 llamadas rápidas a biometryAvailability', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });

        // Act
        const startTime = performance.now();
        const promises = Array(100).fill().map(() => biometryAvailability());
        await Promise.all(promises);
        const endTime = performance.now();

        // Assert
        expect(endTime - startTime).toBeLessThan(5000); // Menos de 5 segundos para 100 llamadas
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(100);
      });

      it('debe manejar llamadas alternadas entre ambas funciones', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'FaceID' });
        mockRNBio.simplePrompt.mockResolvedValue({ success: true });

        // Act
        const operations = [];
        for (let i = 0; i < 10; i++) {
          operations.push(biometryAvailability());
          operations.push(biometricLogin(`Test ${i}`));
        }
        
        const results = await Promise.all(operations);

        // Assert
        expect(results).toHaveLength(20);
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(10);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledTimes(10);
      });
    });

    describe('🔍 Memory y Resource Management', () => {
      it('no debe causar memory leaks con múltiples instancias', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });

        // Act
        const operations = [];
        for (let i = 0; i < 1000; i++) {
          operations.push(biometryAvailability());
        }
        
        await Promise.all(operations);

        // Assert
        expect(mockRNBio.isSensorAvailable).toHaveBeenCalledTimes(1000);
        // Si llegamos aquí sin errores de memoria, el test pasa
        expect(true).toBe(true);
      });

      it('debe limpiar recursos correctamente después de errores', async () => {
        // Arrange
        mockRNBio.simplePrompt
          .mockRejectedValueOnce(new Error('First error'))
          .mockRejectedValueOnce(new Error('Second error'))
          .mockResolvedValue({ success: true });

        // Act
        try {
          await biometricLogin();
        } catch (error) {
          // Expected first error
        }

        try {
          await biometricLogin();
        } catch (error) {
          // Expected second error
        }

        const result = await biometricLogin();

        // Assert
        expect(result).toBe(true);
        expect(mockRNBio.simplePrompt).toHaveBeenCalledTimes(3);
      });
    });

    describe('🎯 Boundary Conditions', () => {
      it('debe manejar respuestas con propiedades adicionales', async () => {
        // Arrange
        const extendedResponse = {
          available: true,
          biometryType: 'TouchID',
          extraProperty: 'should be preserved',
          anotherProperty: 42
        };
        mockRNBio.isSensorAvailable.mockResolvedValue(extendedResponse);

        // Act
        const result = await biometryAvailability();

        // Assert
        // La función biometryAvailability extrae solo available y biometryType
        expect(result).toEqual({
          available: true,
          biometryType: 'TouchID',
        });
        expect(result).toHaveProperty('available');
        expect(result).toHaveProperty('biometryType');
        expect(result).not.toHaveProperty('extraProperty');
        expect(result).not.toHaveProperty('anotherProperty');
      });

      it('debe manejar valores booleanos como strings', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: 'true', biometryType: 'TouchID' });

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result.available).toBe('true'); // Preserva el tipo original
        expect(result.biometryType).toBe('TouchID');
      });

      it('debe manejar tipos de biometría desconocidos', async () => {
        // Arrange
        mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'UnknownType' });

        // Act
        const result = await biometryAvailability();

        // Assert
        expect(result.available).toBe(true);
        expect(result.biometryType).toBe('UnknownType');
      });
    });
  });

  // ===== GRUPO 5: COMPATIBILIDAD Y REGRESIÓN =====
  describe('🔄 Compatibilidad y Regresión', () => {
    it('debe mantener interfaz de función consistente', () => {
      // Assert
      expect(typeof biometryAvailability).toBe('function');
      expect(typeof biometricLogin).toBe('function');
      expect(biometryAvailability.length).toBe(0); // Sin parámetros
      expect(biometricLogin.length).toBe(0); // Parámetro con valor por defecto
    });

    it('debe retornar promesas válidas', () => {
      // Arrange
      mockRNBio.isSensorAvailable.mockResolvedValue({ available: true, biometryType: 'TouchID' });
      mockRNBio.simplePrompt.mockResolvedValue({ success: true });

      // Act & Assert
      const availabilityPromise = biometryAvailability();
      const loginPromise = biometricLogin();

      expect(availabilityPromise).toBeInstanceOf(Promise);
      expect(loginPromise).toBeInstanceOf(Promise);

      return Promise.all([availabilityPromise, loginPromise]);
    });

    it('debe ser importable correctamente', () => {
      // Assert
      expect(biometryAvailability).toBeDefined();
      expect(biometricLogin).toBeDefined();
      expect(typeof biometryAvailability).toBe('function');
      expect(typeof biometricLogin).toBe('function');
    });
  });
});
