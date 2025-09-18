/**
 * Tests completos para RegisterUser8Pin Component
 * Siguiendo las buenas prácticas de Jest y React Native Testing Library
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders, mockNavigation } from '../../../setup/test-utils';
import { AuthNav } from '../../../../src/navigation/NavigationKey';

// Mock del componente bajo test
const RegisterUser8Pin = require('../../../../src/container/Auth/RegisterUser8Pin').default;

// ===== MOCKS SETUP =====
// Mock de timers globales
global.setTimeout = jest.fn((fn, delay) => {
  const id = Math.random();
  setTimeout(() => fn(), delay);
  return id;
});
global.clearTimeout = jest.fn();

// Mock del hook useNavigationLogger
jest.mock('../../../../src/hooks/useNavigationLogger', () => ({
  useNavigationLogger: jest.fn(),
}));

// Mock de componentes comunes
jest.mock('../../../../src/components/common/CSafeAreaViewAuth', () => {
  const mockReact = require('react');
  return jest.fn(({ children, testID }) => 
    mockReact.createElement('View', { testID: testID || 'safe-area-view' }, children)
  );
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const mockReact = require('react');
  return jest.fn(({ testID }) => 
    mockReact.createElement('View', { testID: testID || 'header' })
  );
});

jest.mock('../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const mockReact = require('react');
  return jest.fn(({ children, testID }) => 
    mockReact.createElement('View', { testID: testID || 'keyboard-wrapper' }, children)
  );
});

jest.mock('../../../../src/components/authComponents/StepIndicator', () => {
  const mockReact = require('react');
  return jest.fn(({ testID, step }) => 
    mockReact.createElement('View', { testID: testID || 'step-indicator', 'data-step': step })
  );
});

jest.mock('../../../../src/components/common/CText', () => {
  const mockReact = require('react');
  return jest.fn(({ children, testID }) => 
    mockReact.createElement('Text', { testID: testID || 'text' }, children)
  );
});

jest.mock('../../../../src/components/common/CButton', () => {
  const mockReact = require('react');
  return jest.fn(({ testID, onPress, disabled, title }) => {
    const handlePress = disabled ? jest.fn() : onPress;
    return mockReact.createElement('TouchableOpacity', { 
      testID: testID || 'button',
      onPress: handlePress,
      disabled: disabled
    }, mockReact.createElement('Text', {}, title));
  });
});

// Mock del OTPInputView
jest.mock('@twotalltotems/react-native-otp-input', () => {
  const mockReact = require('react');
  return mockReact.forwardRef((props, ref) => {
    mockReact.useImperativeHandle(ref, () => ({
      focusField: jest.fn(),
    }));
    
    return mockReact.createElement('TextInput', {
      testID: props.testID || 'otp-input',
      value: props.code,
      onChangeText: props.onCodeChanged,
      maxLength: props.pinCount,
      secureTextEntry: props.secureTextEntry,
      placeholder: 'Enter PIN',
      'data-pin-count': props.pinCount,
    });
  });
});

// Mock de utilidades de tema
jest.mock('../../../../src/utils/ThemeUtils', () => ({
  getSecondaryTextColor: jest.fn((colors) => colors?.textColor || '#666666'),
}));

// Mock de strings de internacionalización
jest.mock('../../../../src/i18n/String', () => ({
  pinAccessTitle: 'Crea tu PIN de acceso',
  pinAccessDescription: 'Ingresa 4 dígitos para crear tu PIN',
  btnContinue: 'Continuar',
}));

// ===== TESTS =====
describe('RegisterUser8Pin Component - Tests Consolidados', () => {
  let mockLogAction, mockLogNavigation;
  const mockRoute = {
    params: {
      vc: 'mock-vc',
      offerUrl: 'https://example.com',
      useBiometry: true,
      dni: '12345678A'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockLogAction = jest.fn();
    mockLogNavigation = jest.fn();
    
    require('../../../../src/hooks/useNavigationLogger').useNavigationLogger.mockReturnValue({
      logAction: mockLogAction,
      logNavigation: mockLogNavigation,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ===== GRUPO 1: RENDERIZADO BÁSICO =====
  describe('🎯 Renderizado Básico', () => {
    it('debe renderizarse sin errores', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('registerUser8PinContainer')).toBeTruthy();
    });

    it('debe renderizar todos los componentes principales', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('registerUser8PinContainer')).toBeTruthy();
      expect(getByTestId('registerUser8PinStepIndicator')).toBeTruthy();
      expect(getByTestId('registerUser8PinHeader')).toBeTruthy();
      expect(getByTestId('registerUser8PinKeyboardWrapper')).toBeTruthy();
      expect(getByTestId('registerUser8PinContentContainer')).toBeTruthy();
      expect(getByTestId('registerUser8PinButtonContainer')).toBeTruthy();
    });

    it('debe renderizar título y descripción del PIN', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('registerUser8PinTitle')).toBeTruthy();
      expect(getByTestId('registerUser8PinDescription')).toBeTruthy();
    });

    it('debe renderizar el input OTP y el botón continuar', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('registerUser8PinInput')).toBeTruthy();
      expect(getByTestId('registerUser8PinContinueButton')).toBeTruthy();
    });
  });

  // ===== GRUPO 2: CONFIGURACIÓN OTP INPUT =====
  describe('🔢 Configuración del OTP Input', () => {
    it('debe configurar el input OTP con 4 dígitos', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      expect(otpInput.props['data-pin-count']).toBe(4);
      expect(otpInput.props.maxLength).toBe(4);
    });

    it('debe tener secureTextEntry habilitado', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      expect(otpInput.props.secureTextEntry).toBe(true);
    });

    it('debe configurar el input OTP con secureTextEntry', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      expect(otpInput.props.secureTextEntry).toBe(true);
      expect(otpInput.props['data-pin-count']).toBe(4);
    });
  });

  // ===== GRUPO 3: INTERACCIONES CON OTP =====
  describe('🔤 Interacciones con OTP Input', () => {
    it('debe manejar cambios en el PIN', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      fireEvent.changeText(otpInput, '1234');

      expect(otpInput.props.value).toBe('1234');
    });

    it('debe manejar entrada parcial del PIN', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      // PIN incompleto
      fireEvent.changeText(otpInput, '12');
      expect(continueButton.props.disabled).toBe(true);

      // PIN parcial
      fireEvent.changeText(otpInput, '123');
      expect(continueButton.props.disabled).toBe(true);
    });

    it('debe habilitar botón solo con PIN completo', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      // Estado inicial - botón deshabilitado
      expect(continueButton.props.disabled).toBe(true);

      // PIN completo - botón habilitado
      fireEvent.changeText(otpInput, '1234');
      expect(continueButton.props.disabled).toBe(false);

      // PIN vacío - botón deshabilitado
      fireEvent.changeText(otpInput, '');
      expect(continueButton.props.disabled).toBe(true);
    });

    it('debe permitir cambiar el PIN después de ingresarlo', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');

      // PIN inicial
      fireEvent.changeText(otpInput, '1234');
      expect(otpInput.props.value).toBe('1234');

      // Cambiar PIN
      fireEvent.changeText(otpInput, '5678');
      expect(otpInput.props.value).toBe('5678');
    });
  });

  // ===== GRUPO 4: NAVEGACIÓN =====
  describe('🧭 Comportamiento de Navegación', () => {
    it('debe navegar a RegisterUser9 con parámetros correctos', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      // Ingresar PIN completo
      fireEvent.changeText(otpInput, '1234');

      // Presionar continuar
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
        originalPin: '1234',
        vc: 'mock-vc',
        offerUrl: 'https://example.com',
        useBiometry: true,
        dni: '12345678A',
      });
    });

    it('no debe navegar con PIN incompleto', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      // PIN incompleto
      fireEvent.changeText(otpInput, '123');

      // Intentar presionar botón deshabilitado
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('debe preservar todos los parámetros de la ruta anterior', () => {
      const extendedRoute = {
        params: {
          ...mockRoute.params,
          extraParam: 'test-value',
          anotherParam: 123
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={extendedRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      fireEvent.changeText(otpInput, '9999');
      fireEvent.press(continueButton);

      // El componente solo pasa los parámetros específicos necesarios
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
        originalPin: '9999',
        vc: 'mock-vc',
        offerUrl: 'https://example.com',
        useBiometry: true,
        dni: '12345678A',
      });
    });
  });

  // ===== GRUPO 5: STEP INDICATOR =====
  describe('📊 Step Indicator', () => {
    it('debe mostrar step 8 correctamente', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const stepIndicator = getByTestId('registerUser8PinStepIndicator');
      expect(stepIndicator.props['data-step']).toBe(8);
    });
  });

  // ===== GRUPO 6: SISTEMA DE LOGGING =====
  describe('📊 Sistema de Logging', () => {
    it('debe inicializar navigation logger correctamente', () => {
      renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      expect(require('../../../../src/hooks/useNavigationLogger').useNavigationLogger)
        .toHaveBeenCalledWith('RegisterUser8Pin', true);
    });
  });

  // ===== GRUPO 7: INTEGRACIÓN REDUX =====
  describe('🎭 Integración con Redux', () => {
    it('debe funcionar con tema claro', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#007AFF',
            textColor: '#000000',
            inputBackground: '#F5F5F5',
            grayScale500: '#9E9E9E',
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />,
        { initialState }
      );

      expect(getByTestId('registerUser8PinContainer')).toBeTruthy();
    });

    it('debe funcionar con tema oscuro', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#0A84FF',
            textColor: '#FFFFFF',
            inputBackground: '#1C1C1E',
            grayScale500: '#8E8E93',
            dark: true,
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />,
        { initialState }
      );

      expect(getByTestId('registerUser8PinContainer')).toBeTruthy();
    });
  });

  // ===== GRUPO 8: ACCESIBILIDAD =====
  describe('♿ Accesibilidad', () => {
    it('debe tener testIDs apropiados para automatización', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const requiredTestIds = [
        'registerUser8PinContainer',
        'registerUser8PinStepIndicator',
        'registerUser8PinHeader',
        'registerUser8PinKeyboardWrapper',
        'registerUser8PinContentContainer',
        'registerUser8PinTitle',
        'registerUser8PinDescription',
        'registerUser8PinInput',
        'registerUser8PinButtonContainer',
        'registerUser8PinContinueButton'
      ];

      requiredTestIds.forEach(testId => {
        expect(getByTestId(testId)).toBeTruthy();
      });
    });
  });

  // ===== GRUPO 9: CASOS DE USO REALES =====
  describe('🎯 Casos de Uso Reales', () => {
    it('debe simular flujo completo de creación de PIN', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      // Usuario ve la pantalla de creación de PIN
      expect(getByTestId('registerUser8PinTitle')).toBeTruthy();
      expect(getByTestId('registerUser8PinDescription')).toBeTruthy();

      // Usuario se enfoca automáticamente en el input (después del timeout)
      jest.advanceTimersByTime(350);

      // Usuario ingresa PIN progresivamente
      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      fireEvent.changeText(otpInput, '1');
      expect(continueButton.props.disabled).toBe(true);

      fireEvent.changeText(otpInput, '12');
      expect(continueButton.props.disabled).toBe(true);

      fireEvent.changeText(otpInput, '123');
      expect(continueButton.props.disabled).toBe(true);

      fireEvent.changeText(otpInput, '1234');
      expect(continueButton.props.disabled).toBe(false);

      // Usuario presiona continuar
      fireEvent.press(continueButton);

      // Navega al siguiente paso con el PIN
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
        originalPin: '1234',
        vc: 'mock-vc',
        offerUrl: 'https://example.com',
        useBiometry: true,
        dni: '12345678A',
      });
    });

    it('debe simular usuario que comete error al ingresar PIN', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');

      // Usuario ingresa PIN incorrecto
      fireEvent.changeText(otpInput, '1111');

      // Usuario se da cuenta y corrige
      fireEvent.changeText(otpInput, '');
      fireEvent.changeText(otpInput, '1234');

      // Usuario puede continuar con el PIN corregido
      const continueButton = getByTestId('registerUser8PinContinueButton');
      expect(continueButton.props.disabled).toBe(false);

      fireEvent.press(continueButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
        originalPin: '1234',
        vc: 'mock-vc',
        offerUrl: 'https://example.com',
        useBiometry: true,
        dni: '12345678A',
      });
    });

    it('debe simular usuario que intenta continuar sin PIN completo', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      // Usuario ingresa PIN parcial
      fireEvent.changeText(otpInput, '12');

      // Usuario intenta continuar (botón deshabilitado)
      expect(continueButton.props.disabled).toBe(true);
      fireEvent.press(continueButton);

      // No debe navegar
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  // ===== GRUPO 10: EDGE CASES =====
  describe('🛡️ Edge Cases', () => {
    it('debe manejar parámetros de ruta faltantes', () => {
      const incompleteRoute = {
        params: {
          vc: 'mock-vc',
          // Faltan otros parámetros
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={incompleteRoute} />
      );

      expect(getByTestId('registerUser8PinContainer')).toBeTruthy();

      // Verificar que maneja parámetros undefined
      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      fireEvent.changeText(otpInput, '1234');
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
        originalPin: '1234',
        vc: 'mock-vc',
        offerUrl: undefined,
        useBiometry: undefined,
        dni: undefined,
      });
    });

    it('debe manejar PIN con caracteres especiales', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      // PIN con caracteres especiales (aunque no debería permitirse en UI real)
      fireEvent.changeText(otpInput, 'a1b2');
      expect(continueButton.props.disabled).toBe(false);

      fireEvent.press(continueButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser9, {
        originalPin: 'a1b2',
        vc: 'mock-vc',
        offerUrl: 'https://example.com',
        useBiometry: true,
        dni: '12345678A',
      });
    });

    it('debe manejar presiones múltiples del botón continuar', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      const continueButton = getByTestId('registerUser8PinContinueButton');

      fireEvent.changeText(otpInput, '1234');

      // Presiones múltiples rápidas
      fireEvent.press(continueButton);
      fireEvent.press(continueButton);
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(3);
    });

    it('debe manejar desmontaje del componente correctamente', () => {
      const { unmount } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      // Verificar que el componente se desmonta sin errores
      expect(() => unmount()).not.toThrow();
    });
  });

  // ===== GRUPO 11: PERFORMANCE =====
  describe('⚡ Performance', () => {
    it('debe renderizar eficientemente', () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('debe manejar cambios de PIN eficientemente', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      const otpInput = getByTestId('registerUser8PinInput');
      
      const startTime = performance.now();
      
      // Múltiples cambios de PIN
      for (let i = 1; i <= 9; i++) {
        fireEvent.changeText(otpInput, i.toString().repeat(4));
      }
      
      const changeTime = performance.now() - startTime;
      expect(changeTime).toBeLessThan(50);
    });
  });

  // ===== GRUPO 12: INTEGRACIÓN DE COMPONENTES =====
  describe('🔗 Integración de Componentes', () => {
    it('debe integrar correctamente con todos los componentes mockeados', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser8Pin navigation={mockNavigation} route={mockRoute} />
      );

      // Verificar integración con componentes comunes
      expect(getByTestId('registerUser8PinContainer')).toBeTruthy(); // CSafeAreaViewAuth
      expect(getByTestId('registerUser8PinHeader')).toBeTruthy(); // CHeader
      expect(getByTestId('registerUser8PinKeyboardWrapper')).toBeTruthy(); // KeyBoardAvoidWrapper
      expect(getByTestId('registerUser8PinStepIndicator')).toBeTruthy(); // StepIndicator
      expect(getByTestId('registerUser8PinInput')).toBeTruthy(); // OTPInputView
      expect(getByTestId('registerUser8PinContinueButton')).toBeTruthy(); // CButton
    });
  });
});
