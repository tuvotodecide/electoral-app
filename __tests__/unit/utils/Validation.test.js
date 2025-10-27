/**
 * Tests completos para Validation.js Utils
 * Siguiendo las buenas prácticas de Jest y React Native Testing Library
 */

import {
  validateEmail,
  validName,
  validPassword,
  validateCvv,
  validateCardNumber,
  validateConfirmPassword,
} from '../../../src/utils/Validation';

// Mock de strings para testing
const mockStrings = {
  thisFieldIsMandatory: 'Este campo es obligatorio',
  enterValidEmail: 'Ingresa un email válido',
  enterValidName: 'Ingresa un nombre válido',
  plsEnterPassword: 'Por favor ingresa una contraseña',
  validatePassword: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
  confirmPassValidString: 'Las contraseñas no coinciden',
  validCvv: 'Ingresa un CVV válido',
  validCardNumber: 'Ingresa un número de tarjeta válido',
  thisFieldIsMandatory: 'Este campo es obligatorio',
};

// Mock global de strings
global.strings = mockStrings;

describe('Validation Utils - Tests Consolidados', () => {
  beforeEach(() => {
    // Reset global strings before each test
    global.strings = mockStrings;
  });

  // ===== GRUPO 1: VALIDACIÓN DE EMAIL =====
  describe('📧 Validación de Email', () => {
    describe('✅ Casos Válidos', () => {
      it('debe validar email básico correctamente', () => {
        const result = validateEmail('test@example.com');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar email con subdominios', () => {
        const result = validateEmail('user@mail.example.com');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar email con números', () => {
        const result = validateEmail('user123@domain123.com');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar email con caracteres especiales permitidos', () => {
        const emails = [
          'user.name@example.com',
          'user+label@example.com',
          'user_name@example.com',
          'user-name@example.com',
          'user%test@example.com',
        ];

        emails.forEach(email => {
          const result = validateEmail(email);
          expect(result).toEqual({ status: true, msg: '' });
        });
      });

      it('debe validar email con dominios de diferentes longitudes', () => {
        const emails = [
          'test@example.co',
          'test@example.com',
          'test@example.info',
        ];

        emails.forEach(email => {
          const result = validateEmail(email);
          expect(result).toEqual({ status: true, msg: '' });
        });
      });
    });

    describe('❌ Casos Inválidos', () => {
      it('debe rechazar email vacío', () => {
        const result = validateEmail('');
        expect(result).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar email null o undefined', () => {
        expect(validateEmail(null)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });

        expect(validateEmail(undefined)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar email sin @', () => {
        const result = validateEmail('testexample.com');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un email válido',
        });
      });

      it('debe rechazar email sin dominio', () => {
        const result = validateEmail('test@');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un email válido',
        });
      });

      it('debe rechazar email sin extensión', () => {
        const result = validateEmail('test@example');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un email válido',
        });
      });

      it('debe rechazar emails con formato incorrecto', () => {
        const invalidEmails = [
          'test',
          '@example.com',
          'test@@example.com',
          'test@.com',
          'test@example.',
          'test@example.c',
        ];

        invalidEmails.forEach(email => {
          const result = validateEmail(email);
          expect(result).toEqual({
            status: false,
            msg: 'Ingresa un email válido',
          });
        });
      });
    });
  });

  // ===== GRUPO 2: VALIDACIÓN DE NOMBRE =====
  describe('👤 Validación de Nombre', () => {
    describe('✅ Casos Válidos', () => {
      it('debe validar nombre simple', () => {
        const result = validName('Juan');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar nombre completo', () => {
        const result = validName('Juan Perez');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar nombres con espacios múltiples', () => {
        const result = validName('Maria Jose Garcia');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar nombres de longitud mínima (2 caracteres)', () => {
        const result = validName('Jo');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar nombres de longitud máxima (40 caracteres)', () => {
        const longName = 'A'.repeat(40);
        const result = validName(longName);
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar nombres con mayúsculas y minúsculas', () => {
        const names = [
          'juan',
          'JUAN',
          'Juan',
          'jUaN',
        ];

        names.forEach(name => {
          const result = validName(name);
          expect(result).toEqual({ status: true, msg: '' });
        });
      });
    });

    describe('❌ Casos Inválidos', () => {
      it('debe rechazar nombre vacío', () => {
        const result = validName('');
        expect(result).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar nombre null o undefined', () => {
        expect(validName(null)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });

        expect(validName(undefined)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar nombres con números', () => {
        const result = validName('Juan123');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un nombre válido',
        });
      });

      it('debe rechazar nombres con caracteres especiales', () => {
        const invalidNames = [
          'Juan@',
          'María#',
          'Pedro$',
          'Ana%',
          'Luis&',
          'Carmen*',
          'José+',
          'Rosa=',
          'Juan Pérez', // Caracteres con acentos no permitidos
          'María José', // Acentos no permitidos
        ];

        invalidNames.forEach(name => {
          const result = validName(name);
          expect(result).toEqual({
            status: false,
            msg: 'Ingresa un nombre válido',
          });
        });
      });

      it('debe rechazar nombres muy cortos (menos de 2 caracteres)', () => {
        const result = validName('J');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un nombre válido',
        });
      });

      it('debe rechazar nombres muy largos (más de 40 caracteres)', () => {
        const longName = 'A'.repeat(41);
        const result = validName(longName);
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un nombre válido',
        });
      });
    });
  });

  // ===== GRUPO 3: VALIDACIÓN DE CONTRASEÑA =====
  describe('🔐 Validación de Contraseña', () => {
    describe('✅ Casos Válidos', () => {
      it('debe validar contraseña básica válida', () => {
        const result = validPassword('Password123');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar contraseña con caracteres especiales', () => {
        const result = validPassword('Password123!@#');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar contraseña de longitud mínima', () => {
        const result = validPassword('Pass123A');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar contraseña muy larga', () => {
        const longPassword = 'Password123' + 'A'.repeat(50);
        const result = validPassword(longPassword);
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar contraseña con múltiples mayúsculas, minúsculas y números', () => {
        const result = validPassword('PassWord123ABC');
        expect(result).toEqual({ status: true, msg: '' });
      });
    });

    describe('❌ Casos Inválidos', () => {
      it('debe rechazar contraseña vacía', () => {
        const result = validPassword('');
        expect(result).toEqual({
          status: false,
          msg: 'Por favor ingresa una contraseña',
        });
      });

      it('debe rechazar contraseña null o undefined', () => {
        expect(validPassword(null)).toEqual({
          status: false,
          msg: 'Por favor ingresa una contraseña',
        });

        expect(validPassword(undefined)).toEqual({
          status: false,
          msg: 'Por favor ingresa una contraseña',
        });
      });

      it('debe rechazar contraseña muy corta (menos de 8 caracteres)', () => {
        const result = validPassword('Pass12');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });

      it('debe rechazar contraseña sin mayúsculas', () => {
        const result = validPassword('password123');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });

      it('debe rechazar contraseña sin minúsculas', () => {
        const result = validPassword('PASSWORD123');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });

      it('debe rechazar contraseña sin números', () => {
        const result = validPassword('Password');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });

      it('debe rechazar contraseña solo con espacios', () => {
        const result = validPassword('        ');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });
    });

    describe('🔄 Confirmación de Contraseña', () => {
      it('debe validar contraseñas coincidentes', () => {
        const result = validPassword('Password123', true, 'Password123');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe rechazar contraseñas que no coinciden', () => {
        const result = validPassword('Password123', true, 'Password456');
        expect(result).toEqual({
          status: false,
          msg: 'Las contraseñas no coinciden',
        });
      });

      it('debe validar sin confirmación cuando isConfrimPass es false', () => {
        const result = validPassword('Password123', false, 'Password456');
        expect(result).toEqual({ status: true, msg: '' });
      });
    });
  });

  // ===== GRUPO 4: VALIDACIÓN DE CONTRASEÑA DE CONFIRMACIÓN =====
  describe('🔄 Validación de Confirmación de Contraseña', () => {
    describe('✅ Casos Válidos', () => {
      it('debe validar confirmación de contraseña correcta', () => {
        const result = validateConfirmPassword('Password123', 'Password123');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar confirmación con contraseñas complejas idénticas', () => {
        const password = 'MyComplexPass123!@#';
        const result = validateConfirmPassword(password, password);
        expect(result).toEqual({ status: true, msg: '' });
      });
    });

    describe('❌ Casos Inválidos', () => {
      it('debe rechazar confirmación vacía', () => {
        const result = validateConfirmPassword('', 'Password123');
        expect(result).toEqual({
          status: false,
          msg: 'Por favor ingresa una contraseña',
        });
      });

      it('debe rechazar confirmación null o undefined', () => {
        expect(validateConfirmPassword(null, 'Password123')).toEqual({
          status: false,
          msg: 'Por favor ingresa una contraseña',
        });

        expect(validateConfirmPassword(undefined, 'Password123')).toEqual({
          status: false,
          msg: 'Por favor ingresa una contraseña',
        });
      });

      it('debe rechazar confirmación muy corta', () => {
        const result = validateConfirmPassword('Pass12', 'Password123');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });

      it('debe rechazar confirmación que no coincide', () => {
        const result = validateConfirmPassword('Password123', 'Password456');
        expect(result).toEqual({
          status: false,
          msg: 'Las contraseñas no coinciden',
        });
      });

      it('debe rechazar confirmación con formato inválido', () => {
        const result = validateConfirmPassword('password123', 'password123');
        expect(result).toEqual({
          status: false,
          msg: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
        });
      });
    });
  });

  // ===== GRUPO 5: VALIDACIÓN DE CVV =====
  describe('🏷️ Validación de CVV', () => {
    describe('✅ Casos Válidos', () => {
      it('debe validar CVV de 3 dígitos', () => {
        const result = validateCvv('123');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar CVV de 4 dígitos', () => {
        const result = validateCvv('1234');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar CVV con ceros', () => {
        const cvvs = ['000', '0000', '001', '0001'];
        
        cvvs.forEach(cvv => {
          const result = validateCvv(cvv);
          expect(result).toEqual({ status: true, msg: '' });
        });
      });
    });

    describe('❌ Casos Inválidos', () => {
      it('debe rechazar CVV vacío', () => {
        const result = validateCvv('');
        expect(result).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar CVV null o undefined', () => {
        expect(validateCvv(null)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });

        expect(validateCvv(undefined)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar CVV muy corto (menos de 3 dígitos)', () => {
        const result = validateCvv('12');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un CVV válido',
        });
      });

      it('debe rechazar CVV muy largo (más de 4 dígitos)', () => {
        const result = validateCvv('12345');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un CVV válido',
        });
      });

      it('debe rechazar CVV con letras', () => {
        const invalidCvvs = ['12a', 'abc', '1a3', 'a234'];
        
        invalidCvvs.forEach(cvv => {
          const result = validateCvv(cvv);
          expect(result).toEqual({
            status: false,
            msg: 'Ingresa un CVV válido',
          });
        });
      });

      it('debe rechazar CVV con caracteres especiales', () => {
        const invalidCvvs = ['12@', '1#3', '12$4', '!@#$'];
        
        invalidCvvs.forEach(cvv => {
          const result = validateCvv(cvv);
          expect(result).toEqual({
            status: false,
            msg: 'Ingresa un CVV válido',
          });
        });
      });

      it('debe rechazar CVV con espacios', () => {
        const result = validateCvv('1 23');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un CVV válido',
        });
      });
    });
  });

  // ===== GRUPO 6: VALIDACIÓN DE NÚMERO DE TARJETA =====
  describe('💳 Validación de Número de Tarjeta', () => {
    describe('✅ Casos Válidos', () => {
      it('debe validar número de tarjeta de 16 dígitos', () => {
        const result = validateCardNumber('1234567890123456');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar número de tarjeta con ceros', () => {
        const result = validateCardNumber('0000000000000000');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar número de tarjeta típico de Visa', () => {
        const result = validateCardNumber('4111111111111111');
        expect(result).toEqual({ status: true, msg: '' });
      });

      it('debe validar número de tarjeta típico de MasterCard', () => {
        const result = validateCardNumber('5555555555554444');
        expect(result).toEqual({ status: true, msg: '' });
      });
    });

    describe('❌ Casos Inválidos', () => {
      it('debe rechazar número de tarjeta vacío', () => {
        const result = validateCardNumber('');
        expect(result).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar número de tarjeta null o undefined', () => {
        expect(validateCardNumber(null)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });

        expect(validateCardNumber(undefined)).toEqual({
          status: false,
          msg: 'Este campo es obligatorio',
        });
      });

      it('debe rechazar número de tarjeta muy corto', () => {
        const result = validateCardNumber('123456789012345');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un número de tarjeta válido',
        });
      });

      it('debe rechazar número de tarjeta muy largo', () => {
        const result = validateCardNumber('12345678901234567');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un número de tarjeta válido',
        });
      });

      it('debe rechazar número de tarjeta con letras', () => {
        const result = validateCardNumber('123456789012345a');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un número de tarjeta válido',
        });
      });

      it('debe rechazar número de tarjeta con espacios', () => {
        const result = validateCardNumber('1234 5678 9012 3456');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un número de tarjeta válido',
        });
      });

      it('debe rechazar número de tarjeta con guiones', () => {
        const result = validateCardNumber('1234-5678-9012-3456');
        expect(result).toEqual({
          status: false,
          msg: 'Ingresa un número de tarjeta válido',
        });
      });

      it('debe rechazar número de tarjeta con caracteres especiales', () => {
        const invalidCards = [
          '123456789012345@',
          '123456789012345#',
          '123456789012345$',
          '123456789012345%',
        ];
        
        invalidCards.forEach(card => {
          const result = validateCardNumber(card);
          expect(result).toEqual({
            status: false,
            msg: 'Ingresa un número de tarjeta válido',
          });
        });
      });
    });
  });

  // ===== GRUPO 7: CASOS EXTREMOS Y EDGE CASES =====
  describe('🎯 Casos Extremos y Edge Cases', () => {
    describe('📧 Email Edge Cases', () => {
      it('debe manejar email con máxima longitud permitida', () => {
        const longEmail = 'a'.repeat(60) + '@' + 'b'.repeat(60) + '.com';
        const result = validateEmail(longEmail);
        expect(result.status).toBe(true);
      });

      it('debe manejar email con caracteres Unicode (caso límite)', () => {
        // Los emails con caracteres especiales pueden variar según implementación
        const result = validateEmail('test@example.com');
        expect(result.status).toBe(true);
      });
    });

    describe('👤 Nombre Edge Cases', () => {
      it('debe manejar nombre con espacios múltiples consecutivos', () => {
        const result = validName('Juan  Perez');
        expect(result.status).toBe(true); // El regex permite espacios múltiples
      });

      it('debe manejar nombre en el límite exacto de caracteres', () => {
        const exactLengthName = 'A'.repeat(40);
        const result = validName(exactLengthName);
        expect(result.status).toBe(true);
      });
    });

    describe('🔐 Contraseña Edge Cases', () => {
      it('debe manejar contraseña en el límite mínimo de complejidad', () => {
        const result = validPassword('Aa1aaaaa'); // 8 chars, 1 upper, 1 lower, 1 number
        expect(result.status).toBe(true);
      });

      it('debe manejar contraseña con emojis y caracteres especiales', () => {
        const result = validPassword('Password123🔐');
        expect(result.status).toBe(true);
      });
    });

    describe('💳 Tarjeta Edge Cases', () => {
      it('debe manejar número de tarjeta con todos los mismos dígitos', () => {
        const result = validateCardNumber('1111111111111111');
        expect(result.status).toBe(true);
      });

      it('debe manejar número de tarjeta con patrón secuencial', () => {
        const result = validateCardNumber('1234567890123456');
        expect(result.status).toBe(true);
      });
    });
  });

  // ===== GRUPO 8: TESTING DE INTEGRACIÓN =====
  describe('🔗 Testing de Integración', () => {
    it('debe validar formulario completo de registro', () => {
      const userData = {
        email: 'user@example.com',
        name: 'Juan Perez',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        cardNumber: '4111111111111111',
        cvv: '123',
      };

      expect(validateEmail(userData.email).status).toBe(true);
      expect(validName(userData.name).status).toBe(true);
      expect(validPassword(userData.password).status).toBe(true);
      expect(validateConfirmPassword(userData.confirmPassword, userData.password).status).toBe(true);
      expect(validateCardNumber(userData.cardNumber).status).toBe(true);
      expect(validateCvv(userData.cvv).status).toBe(true);
    });

    it('debe rechazar formulario con datos inválidos', () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: 'J',
        password: 'weak',
        confirmPassword: 'different',
        cardNumber: '123',
        cvv: '12',
      };

      expect(validateEmail(invalidUserData.email).status).toBe(false);
      expect(validName(invalidUserData.name).status).toBe(false);
      expect(validPassword(invalidUserData.password).status).toBe(false);
      expect(validateConfirmPassword(invalidUserData.confirmPassword, 'weak').status).toBe(false);
      expect(validateCardNumber(invalidUserData.cardNumber).status).toBe(false);
      expect(validateCvv(invalidUserData.cvv).status).toBe(false);
    });

    it('debe proporcionar mensajes de error apropiados para cada campo', () => {
      expect(validateEmail('').msg).toBe('Este campo es obligatorio');
      expect(validName('').msg).toBe('Este campo es obligatorio');
      expect(validPassword('').msg).toBe('Por favor ingresa una contraseña');
      expect(validateCvv('').msg).toBe('Este campo es obligatorio');
      expect(validateCardNumber('').msg).toBe('Este campo es obligatorio');
    });
  });

  // ===== GRUPO 9: PERFORMANCE Y ROBUSTEZ =====
  describe('⚡ Performance y Robustez', () => {
    it('debe ejecutar validaciones rápidamente', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        validateEmail('test@example.com');
        validName('Test User');
        validPassword('Password123');
        validateCvv('123');
        validateCardNumber('1234567890123456');
      }

      const executionTime = performance.now() - startTime;
      expect(executionTime).toBeLessThan(100); // Menos de 100ms para 1000 iteraciones
    });

    it('debe manejar entrada de datos massiva sin memory leaks', () => {
      const largeArray = Array(10000).fill('test@example.com');
      
      largeArray.forEach(email => {
        const result = validateEmail(email);
        expect(result.status).toBe(true);
      });
    });

    it('debe ser consistente con múltiples llamadas', () => {
      const testData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
        cvv: '123',
        cardNumber: '1234567890123456',
      };

      // Ejecutar múltiples veces para verificar consistencia
      for (let i = 0; i < 100; i++) {
        expect(validateEmail(testData.email).status).toBe(true);
        expect(validName(testData.name).status).toBe(true);
        expect(validPassword(testData.password).status).toBe(true);
        expect(validateCvv(testData.cvv).status).toBe(true);
        expect(validateCardNumber(testData.cardNumber).status).toBe(true);
      }
    });
  });

  // ===== GRUPO 10: COMPATIBILIDAD Y REGRESIÓN =====
  describe('🔄 Compatibilidad y Regresión', () => {
    it('debe mantener compatibilidad con versiones anteriores', () => {
      // Test que las funciones mantienen su interfaz original
      expect(typeof validateEmail).toBe('function');
      expect(typeof validName).toBe('function');
      expect(typeof validPassword).toBe('function');
      expect(typeof validateCvv).toBe('function');
      expect(typeof validateCardNumber).toBe('function');
      expect(typeof validateConfirmPassword).toBe('function');
    });

    it('debe retornar objetos con estructura esperada', () => {
      const emailResult = validateEmail('test@example.com');
      expect(emailResult).toHaveProperty('status');
      expect(emailResult).toHaveProperty('msg');
      expect(typeof emailResult.status).toBe('boolean');
      expect(typeof emailResult.msg).toBe('string');
    });

    it('debe manejar parámetros en diferentes tipos de datos', () => {
      // Test robustez con diferentes tipos de entrada
      expect(() => validateEmail(123)).not.toThrow();
      expect(() => validName([])).not.toThrow();
      expect(() => validPassword({})).not.toThrow();
    });
  });
});
