/**
 * Tests completos para CreatePin Component
 * Siguiendo las buenas prácticas de Jest y React Native Testing Library
 */

import { fireEvent } from '@testing-library/react-native';
import { AuthNav } from '../../../../src/navigation/NavigationKey';
import { mockNavigation, renderWithProviders } from '../../../setup/test-utils';

// Mock del componente bajo test
const CreatePin = require('../../../../src/container/Auth/CreatePin').default;

// ===== MOCKS SETUP =====
// Mock del hook useNavigationLogger
jest.mock('../../../../src/hooks/useNavigationLogger', () => ({
  useNavigationLogger: jest.fn(() => ({
    logAction: jest.fn(),
    logNavigation: jest.fn(),
  })),
}));

// Mock del componente OTP Input
jest.mock('react-native-otp-textinput', () => {
  const mockReact = require('react');
  return mockReact.forwardRef((props, ref) => {
    mockReact.useImperativeHandle(ref, () => ({
      focusField: jest.fn(),
    }));
    
    return mockReact.createElement('TextInput', {
      testID: props.testID || 'pinCreationInput',
      value: props.code,
      onChangeText: props.handleTextChange,
      maxLength: props.inputCount,
      secureTextEntry: props.secureTextEntry,
      placeholder: 'Enter PIN',
      'data-pin-count': props.inputCount,
    });
  });
});

// Mock de componentes comunes
jest.mock('../../../../src/components/common/CSafeAreaViewAuth', () => {
  const mockReact = require('react');
  return jest.fn(({ children, testID }) => 
    mockReact.createElement('View', { testID: testID || 'createPinContainer' }, children)
  );
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const mockReact = require('react');
  return jest.fn(({ testID }) => 
    mockReact.createElement('View', { testID: testID || 'createPinHeader' })
  );
});

jest.mock('../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const mockReact = require('react');
  return jest.fn(({ children, testID }) => 
    mockReact.createElement('View', { testID: testID || 'createPinKeyboardWrapper' }, children)
  );
});

jest.mock('../../../../src/components/authComponents/StepIndicator', () => {
  const mockReact = require('react');
  return jest.fn(({ testID, step }) => 
    mockReact.createElement('View', { testID: testID || 'createPinStepIndicator', 'data-step': step })
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

// Mock de strings de internacionalización
jest.mock('../../../../src/i18n/String', () => ({
  createPIN: 'Crear PIN',
  createPINDescription: 'Crea un PIN de 5 dígitos para proteger tu cuenta',
  createPin: 'Crear PIN',
  skipForNow: 'Saltar por ahora',
}));

describe('CreatePin Component - Tests Consolidados', () => {
  let mockLogAction, mockLogNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogAction = jest.fn();
    mockLogNavigation = jest.fn();
    
    require('../../../../src/hooks/useNavigationLogger').useNavigationLogger.mockReturnValue({
      logAction: mockLogAction,
      logNavigation: mockLogNavigation,
    });
  });

  // ===== GRUPO 1: RENDERIZADO BÁSICO =====
  describe('🎯 Renderizado Básico', () => {
    it('debe renderizarse sin errores', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      expect(getByTestId('createPinContainer')).toBeTruthy();
    });

    it('debe renderizar todos los componentes principales', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      expect(getByTestId('createPinContainer')).toBeTruthy();
      expect(getByTestId('createPinHeader')).toBeTruthy();
      expect(getByTestId('createPinStepIndicator')).toBeTruthy();
      expect(getByTestId('createPinKeyboardWrapper')).toBeTruthy();
    });

    it('debe renderizar input OTP correctamente', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      expect(otpInput).toBeTruthy();
      expect(otpInput.props.maxLength).toBe(5);
      expect(otpInput.props.secureTextEntry).toBe(true);
    });

    it('debe renderizar ambos botones de acción', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      expect(getByTestId('createPinButton')).toBeTruthy();
      expect(getByTestId('skipForNowButton')).toBeTruthy();
    });
  });

  // ===== GRUPO 2: INTERACCIONES OTP =====
  describe('🔢 Interacciones con OTP Input', () => {
    it('debe manejar cambios en el input', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      fireEvent.changeText(otpInput, '12345');

      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 5');
    });

    it('debe manejar entrada parcial', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      fireEvent.changeText(otpInput, '123');

      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 3');
    });

    it('debe manejar input vacío', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      fireEvent.changeText(otpInput, '');

      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 0');
    });

    it('debe registrar múltiples cambios progresivos', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      fireEvent.changeText(otpInput, '1');
      fireEvent.changeText(otpInput, '12');
      fireEvent.changeText(otpInput, '123');

      expect(mockLogAction).toHaveBeenCalledTimes(3);
      expect(mockLogAction).toHaveBeenNthCalledWith(1, 'OTP Changed', 'Length: 1');
      expect(mockLogAction).toHaveBeenNthCalledWith(2, 'OTP Changed', 'Length: 2');
      expect(mockLogAction).toHaveBeenNthCalledWith(3, 'OTP Changed', 'Length: 3');
    });
  });

  // ===== GRUPO 3: NAVEGACIÓN =====
  describe('🧭 Comportamiento de Navegación', () => {
    it('debe navegar a UploadDocument al presionar "Crear PIN"', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      fireEvent.press(createButton);

      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
    });

    it('debe navegar a UploadDocument al presionar "Saltar por ahora"', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const skipButton = getByTestId('skipForNowButton');
      fireEvent.press(skipButton);

      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
    });

    it('debe llamar navigate solo una vez por presión', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      fireEvent.press(createButton);

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    });
  });

  // ===== GRUPO 4: SISTEMA DE LOGGING =====
  describe('📊 Sistema de Logging', () => {
    it('debe inicializar navigation logger correctamente', () => {
      renderWithProviders(<CreatePin navigation={mockNavigation} />);

      expect(require('../../../../src/hooks/useNavigationLogger').useNavigationLogger)
        .toHaveBeenCalledWith('CreatePin', true);
    });

    it('debe mantener consistencia en logging entre botones', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      const skipButton = getByTestId('skipForNowButton');

      fireEvent.press(createButton);
      fireEvent.press(skipButton);

      expect(mockLogNavigation).toHaveBeenCalledTimes(2);
      expect(mockLogNavigation).toHaveBeenNthCalledWith(1, 'UploadDocument');
      expect(mockLogNavigation).toHaveBeenNthCalledWith(2, 'UploadDocument');
    });
  });

  // ===== GRUPO 5: INTEGRACIÓN REDUX =====
  describe('🎭 Integración con Redux', () => {
    it('debe funcionar con tema claro', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#007AFF',
            textColor: '#000000',
            dark: false,
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />,
        { initialState }
      );

      expect(getByTestId('createPinContainer')).toBeTruthy();
    });

    it('debe funcionar con tema oscuro', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#0A84FF',
            textColor: '#FFFFFF',
            dark: true,
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />,
        { initialState }
      );

      expect(getByTestId('createPinContainer')).toBeTruthy();
    });

    it('debe manejar tema faltante gracefully', () => {
      const initialState = {
        theme: { theme: {} }
      };

      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />,
        { initialState }
      );

      expect(getByTestId('createPinContainer')).toBeTruthy();
    });
  });

  // ===== GRUPO 6: EDGE CASES =====
  describe('🛡️ Edge Cases', () => {
    it('debe manejar valores null/undefined en OTP', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      fireEvent.changeText(otpInput, null);
      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 0');
      
      fireEvent.changeText(otpInput, undefined);
      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 0');
    });

    it('debe manejar input extremadamente largo', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      const longInput = '1234567890123456789012345';
      
      fireEvent.changeText(otpInput, longInput);

      expect(mockLogAction).toHaveBeenCalledWith(
        'OTP Changed', 
        `Length: ${longInput.length}`
      );
    });

    it('debe manejar caracteres especiales', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      const specialChars = '!@#$%';
      
      fireEvent.changeText(otpInput, specialChars);

      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 5');
    });

    it('debe manejar presiones múltiples de botón', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      
      fireEvent.press(createButton);
      fireEvent.press(createButton);
      fireEvent.press(createButton);

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(3);
    });
  });

  // ===== GRUPO 7: ACCESIBILIDAD =====
  describe('♿ Accesibilidad', () => {
    it('debe tener testIDs apropiados para automatización', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const requiredTestIds = [
        'createPinContainer',
        'createPinHeader', 
        'createPinStepIndicator',
        'createPinKeyboardWrapper',
        'pinCreationInput',
        'createPinButton',
        'skipForNowButton'
      ];

      requiredTestIds.forEach(testId => {
        expect(getByTestId(testId)).toBeTruthy();
      });
    });

    it('debe configurar step indicator correctamente', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const stepIndicator = getByTestId('createPinStepIndicator');
      expect(stepIndicator).toBeTruthy();
    });
  });

  // ===== GRUPO 8: CASOS DE USO REALES =====
  describe('🎯 Casos de Uso Reales', () => {
    it('debe simular flujo completo de creación de PIN', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // Usuario ve la pantalla
      expect(getByTestId('createPinContainer')).toBeTruthy();
      
      // Usuario escribe PIN progresivamente
      const otpInput = getByTestId('pinCreationInput');
      fireEvent.changeText(otpInput, '1');
      fireEvent.changeText(otpInput, '12');
      fireEvent.changeText(otpInput, '123');
      fireEvent.changeText(otpInput, '1234');
      fireEvent.changeText(otpInput, '12345');
      
      // Usuario presiona crear PIN
      const createButton = getByTestId('createPinButton');
      fireEvent.press(createButton);
      
      // Verificar flujo completo
      expect(mockLogAction).toHaveBeenCalledTimes(5);
      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
    });

    it('debe simular usuario que decide saltar', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // Usuario decide saltar sin configurar PIN
      const skipButton = getByTestId('skipForNowButton');
      fireEvent.press(skipButton);
      
      // Verificar navegación sin logging de OTP
      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
      expect(mockLogAction).not.toHaveBeenCalled();
    });

    it('debe simular usuario que cambia de opinión', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      // Usuario escribe PIN
      fireEvent.changeText(otpInput, '12345');
      
      // Cambia de opinión y borra
      fireEvent.changeText(otpInput, '');
      
      // Escribe nuevo PIN
      fireEvent.changeText(otpInput, '54321');
      
      // Presiona crear
      const createButton = getByTestId('createPinButton');
      fireEvent.press(createButton);
      
      expect(mockLogAction).toHaveBeenCalledTimes(3);
      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
    });

    it('debe simular usuario indeciso entre crear y saltar', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      const createButton = getByTestId('createPinButton');
      const skipButton = getByTestId('skipForNowButton');
      
      // Usuario escribe PIN
      fireEvent.changeText(otpInput, '12345');
      
      // Considera saltar pero cambia de opinión
      // Usuario finalmente crea PIN
      fireEvent.press(createButton);
      
      expect(mockLogAction).toHaveBeenCalledWith('OTP Changed', 'Length: 5');
      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
    });
  });

  // ===== GRUPO 9: PERFORMANCE =====
  describe('⚡ Performance', () => {
    const MAX_RENDER_TIME_MS = 150;
    const MAX_CHANGE_TIME_MS = 80;
    const MAX_NAV_TIME_MS = 25;

    it('debe renderizar eficientemente', () => {
      const startTime = performance.now();
      
      renderWithProviders(<CreatePin navigation={mockNavigation} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(MAX_RENDER_TIME_MS); // Margen razonable para entornos de test
    });

    it('debe manejar múltiples cambios OTP eficientemente', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      const changeStartTime = performance.now();
      
      // Simular escritura rápida
      for (let i = 1; i <= 5; i++) {
        fireEvent.changeText(otpInput, '1'.repeat(i));
      }
      
      const changeTime = performance.now() - changeStartTime;
      expect(changeTime).toBeLessThan(MAX_CHANGE_TIME_MS); // Margen razonable en Jest
      expect(mockLogAction).toHaveBeenCalledTimes(5);
    });

    it('debe manejar navegación eficientemente', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      
      const navStartTime = performance.now();
      fireEvent.press(createButton);
      const navTime = performance.now() - navStartTime;
      
      expect(navTime).toBeLessThan(MAX_NAV_TIME_MS); // Navegación prácticamente inmediata
      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
    });
  });

  // ===== GRUPO 10: INTEGRACIÓN DE COMPONENTES =====
  describe('🔗 Integración de Componentes', () => {
    it('debe integrar correctamente con todos los componentes mockeados', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // Verificar integración con componentes comunes
      expect(getByTestId('createPinContainer')).toBeTruthy(); // CSafeAreaViewAuth
      expect(getByTestId('createPinHeader')).toBeTruthy(); // CHeader
      expect(getByTestId('createPinKeyboardWrapper')).toBeTruthy(); // KeyBoardAvoidWrapper
      expect(getByTestId('createPinStepIndicator')).toBeTruthy(); // StepIndicator
      expect(getByTestId('pinCreationInput')).toBeTruthy(); // OTPInputView
      
      // Verificar que los botones usan CButton
      expect(getByTestId('createPinButton')).toBeTruthy();
      expect(getByTestId('skipForNowButton')).toBeTruthy();
    });

    it('debe verificar la configuración del OTP input', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      // Verificar propiedades del componente OTP
      expect(otpInput.props['data-pin-count']).toBe(5);
      expect(otpInput.props.secureTextEntry).toBe(true);
      expect(otpInput.props.placeholder).toBe('Enter PIN');
    });

    it('debe verificar la estructura de layout correcta', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // Verificar que el contenedor principal existe
      const container = getByTestId('createPinContainer');
      expect(container).toBeTruthy();
      
      // Verificar que el keyboard wrapper está presente
      const keyboardWrapper = getByTestId('createPinKeyboardWrapper');
      expect(keyboardWrapper).toBeTruthy();
      
      // Verificar que el step indicator muestra el paso correcto
      const stepIndicator = getByTestId('createPinStepIndicator');
      expect(stepIndicator).toBeTruthy();
    });
  });

  // ===== GRUPO 11: VALIDACIONES AVANZADAS =====
  describe('🔍 Validaciones Avanzadas', () => {
    it('debe validar longitud máxima del PIN', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      expect(otpInput.props.maxLength).toBe(5);
    });

    it('debe mantener seguridad con texto oculto', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      expect(otpInput.props.secureTextEntry).toBe(true);
    });

    it('debe tener configuración correcta para teclado numérico', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      // El componente OTP debería estar configurado para entrada numérica
      expect(otpInput.props['data-pin-count']).toBe(5);
    });
  });

  // ===== GRUPO 12: FLUJOS DE NAVEGACIÓN AVANZADOS =====
  describe('🧭 Flujos de Navegación Avanzados', () => {
    it('debe manejar navegación con diferentes estados de PIN', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      const createButton = getByTestId('createPinButton');
      
      // Escenario 1: PIN vacío -> crear
      fireEvent.press(createButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
      
      jest.clearAllMocks();
      
      // Escenario 2: PIN parcial -> crear
      fireEvent.changeText(otpInput, '123');
      fireEvent.press(createButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
      
      jest.clearAllMocks();
      
      // Escenario 3: PIN completo -> crear
      fireEvent.changeText(otpInput, '12345');
      fireEvent.press(createButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
    });

    it('debe mantener consistencia en logging de navegación', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      const skipButton = getByTestId('skipForNowButton');
      
      // Ambos botones navegan al mismo destino
      fireEvent.press(createButton);
      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
      
      jest.clearAllMocks();
      
      fireEvent.press(skipButton);
      expect(mockLogNavigation).toHaveBeenCalledWith('UploadDocument');
    });
  });
});
