/**
 * Tests completos para RegisterUser1 Component
 * Siguiendo las buenas prácticas de Jest y React Native Testing Library
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders, mockNavigation } from '../../../setup/test-utils';
import { AuthNav, StackNav } from '../../../../src/navigation/NavigationKey';

// Mock del componente bajo test
const RegisterUser1 = require('../../../../src/container/Auth/RegisterUser1').default;

// ===== MOCKS SETUP =====
// Mock de react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'MockedIonicons');

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
  return jest.fn(({ children, testID, onPress }) => 
    mockReact.createElement('Text', { 
      testID: testID || 'text', 
      onPress: onPress 
    }, children)
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

jest.mock('../../../../src/components/common/CIconText', () => {
  const mockReact = require('react');
  return jest.fn(({ testID, icon, text }) => 
    mockReact.createElement('View', { testID: testID || 'icon-text' }, [
      mockReact.createElement('View', { key: 'icon' }, icon),
      mockReact.createElement('View', { key: 'text' }, text)
    ])
  );
});

jest.mock('../../../../src/components/common/Icono', () => {
  const mockReact = require('react');
  return jest.fn(({ name, testID }) => 
    mockReact.createElement('View', { testID: testID || 'icon', 'data-name': name })
  );
});

jest.mock('../../../../src/components/common/CAlert', () => {
  const mockReact = require('react');
  return jest.fn(({ testID, status, message }) => 
    mockReact.createElement('View', { 
      testID: testID || 'alert',
      'data-status': status,
      'data-message': message
    })
  );
});

// Mock de APIs y utilidades
jest.mock('../../../../src/api/did', () => ({
  didFromEthAddress: jest.fn(() => 'mocked-did'),
}));

jest.mock('@noble/hashes/utils', () => ({
  bytesToHex: jest.fn(() => 'mocked-hex'),
}));

jest.mock('react-native-quick-crypto', () => ({
  randomBytes: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

// Mock de strings de internacionalización
jest.mock('../../../../src/i18n/String', () => ({
  titleReg: 'Registro de Usuario',
  connectItem1Reg: 'Conecta tu identidad',
  connectItem2Reg: 'Toma una foto',
  termsPrefix: 'Acepto los ',
  termsLink: 'términos y condiciones',
  termsSuffix: ' de uso',
  infoMessage: 'Información importante',
  continueButton: 'Continuar',
}));

// ===== TESTS =====
describe('RegisterUser1 Component - Tests Consolidados', () => {
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
        <RegisterUser1 navigation={mockNavigation} />
      );

      expect(getByTestId('registerUser1Container')).toBeTruthy();
    });

    it('debe renderizar todos los componentes principales', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      expect(getByTestId('registerUser1Container')).toBeTruthy();
      expect(getByTestId('registerUser1StepIndicator')).toBeTruthy();
      expect(getByTestId('registerUser1Header')).toBeTruthy();
      expect(getByTestId('registerUser1KeyboardWrapper')).toBeTruthy();
      expect(getByTestId('registerUser1MainContent')).toBeTruthy();
      expect(getByTestId('registerUser1BottomSection')).toBeTruthy();
    });

    it('debe renderizar el título y los pasos de registro', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      expect(getByTestId('registerUser1Title')).toBeTruthy();
      expect(getByTestId('registerUser1Step1Icon')).toBeTruthy();
      expect(getByTestId('registerUser1Step1Text')).toBeTruthy();
      expect(getByTestId('registerUser1Step2Icon')).toBeTruthy();
      expect(getByTestId('registerUser1Step2Text')).toBeTruthy();
    });

    it('debe renderizar la sección de términos y condiciones', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      expect(getByTestId('termsCheckboxContainer')).toBeTruthy();
      expect(getByTestId('termsCheckbox')).toBeTruthy();
      expect(getByTestId('termsCheckboxIcon')).toBeTruthy();
      expect(getByTestId('termsText')).toBeTruthy();
      expect(getByTestId('termsLink')).toBeTruthy();
      expect(getByTestId('termsSuffix')).toBeTruthy();
    });

    it('debe renderizar el botón continuar y la alerta informativa', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      expect(getByTestId('registerUser1ContinueButton')).toBeTruthy();
      expect(getByTestId('registerUser1InfoAlert')).toBeTruthy();
    });
  });

  // ===== GRUPO 2: INTERACCIONES CON CHECKBOX =====
  describe('☑️ Interacciones con Checkbox de Términos', () => {
    it('debe cambiar el estado del checkbox al presionarlo', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      const checkboxIcon = getByTestId('termsCheckboxIcon');

      // Estado inicial - no marcado
      expect(checkboxIcon.props.name).toBe('square-outline');

      // Presionar checkbox
      fireEvent.press(checkbox);

      // Estado después de presionar - marcado
      expect(checkboxIcon.props.name).toBe('checkbox');
    });

    it('debe alternar entre estados marcado/desmarcado con múltiples presiones', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      const checkboxIcon = getByTestId('termsCheckboxIcon');

      // Estado inicial
      expect(checkboxIcon.props.name).toBe('square-outline');

      // Primera presión - marcar
      fireEvent.press(checkbox);
      expect(checkboxIcon.props.name).toBe('checkbox');

      // Segunda presión - desmarcar
      fireEvent.press(checkbox);
      expect(checkboxIcon.props.name).toBe('square-outline');

      // Tercera presión - marcar de nuevo
      fireEvent.press(checkbox);
      expect(checkboxIcon.props.name).toBe('checkbox');
    });

    it('debe afectar el estado del botón continuar según el checkbox', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      const continueButton = getByTestId('registerUser1ContinueButton');

      // Estado inicial - botón deshabilitado
      expect(continueButton.props.disabled).toBe(true);

      // Marcar checkbox - botón habilitado
      fireEvent.press(checkbox);
      expect(continueButton.props.disabled).toBe(false);

      // Desmarcar checkbox - botón deshabilitado de nuevo
      fireEvent.press(checkbox);
      expect(continueButton.props.disabled).toBe(true);
    });
  });

  // ===== GRUPO 3: NAVEGACIÓN =====
  describe('🧭 Comportamiento de Navegación', () => {
    it('debe navegar a RegisterUser2 al presionar continuar con términos aceptados', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      const continueButton = getByTestId('registerUser1ContinueButton');

      // Aceptar términos
      fireEvent.press(checkbox);

      // Presionar continuar
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser2);
    });

    it('debe navegar a TermsAndCondition al presionar el enlace de términos', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const termsLink = getByTestId('termsLink');
      fireEvent.press(termsLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith(StackNav.TermsAndCondition);
    });

    it('no debe navegar si el botón continuar está deshabilitado', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const continueButton = getByTestId('registerUser1ContinueButton');

      // Intentar presionar botón deshabilitado
      fireEvent.press(continueButton);

      // No debe navegar
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });
  });

  // ===== GRUPO 4: SISTEMA DE LOGGING =====
  describe('📊 Sistema de Logging', () => {
    it('debe inicializar navigation logger correctamente', () => {
      renderWithProviders(<RegisterUser1 navigation={mockNavigation} />);

      expect(require('../../../../src/hooks/useNavigationLogger').useNavigationLogger)
        .toHaveBeenCalledWith('RegisterUser1', true);
    });
  });

  // ===== GRUPO 5: INTEGRACIÓN REDUX =====
  describe('🎭 Integración con Redux', () => {
    it('debe funcionar con tema claro', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#007AFF',
            grayScale50: '#F8F9FA',
            colorText: '#000000',
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />,
        { initialState }
      );

      expect(getByTestId('registerUser1Container')).toBeTruthy();
    });

    it('debe funcionar con tema oscuro', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#0A84FF',
            grayScale50: '#1C1C1E',
            colorText: '#FFFFFF',
            dark: true,
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />,
        { initialState }
      );

      expect(getByTestId('registerUser1Container')).toBeTruthy();
    });

    it('debe manejar colores del tema en el checkbox correctamente', () => {
      const initialState = {
        theme: {
          theme: {
            primary: '#FF5722',
            grayScale50: '#E0E0E0',
          }
        }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />,
        { initialState }
      );

      const checkbox = getByTestId('termsCheckbox');
      const checkboxIcon = getByTestId('termsCheckboxIcon');

      // Estado inicial - color grayScale50
      expect(checkboxIcon.props.color).toBe('#E0E0E0');

      // Marcar checkbox - color primary
      fireEvent.press(checkbox);
      expect(checkboxIcon.props.color).toBe('#FF5722');
    });
  });

  // ===== GRUPO 6: STEP INDICATOR =====
  describe('📊 Step Indicator', () => {
    it('debe mostrar step 1 correctamente', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const stepIndicator = getByTestId('registerUser1StepIndicator');
      expect(stepIndicator.props['data-step']).toBe(1);
    });
  });

  // ===== GRUPO 7: ACCESIBILIDAD =====
  describe('♿ Accesibilidad', () => {
    it('debe tener testIDs apropiados para automatización', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const requiredTestIds = [
        'registerUser1Container',
        'registerUser1StepIndicator',
        'registerUser1Header',
        'registerUser1KeyboardWrapper',
        'registerUser1MainContent',
        'registerUser1Title',
        'registerUser1Step1Icon',
        'registerUser1Step1Text',
        'registerUser1Step2Icon',
        'registerUser1Step2Text',
        'registerUser1BottomSection',
        'termsCheckboxContainer',
        'termsCheckbox',
        'termsCheckboxIcon',
        'termsText',
        'termsLink',
        'termsSuffix',
        'registerUser1InfoAlert',
        'registerUser1ContinueButton'
      ];

      requiredTestIds.forEach(testId => {
        expect(getByTestId(testId)).toBeTruthy();
      });
    });
  });

  // ===== GRUPO 8: CASOS DE USO REALES =====
  describe('🎯 Casos de Uso Reales', () => {
    it('debe simular flujo completo de registro de usuario', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      // Usuario ve la pantalla de registro
      expect(getByTestId('registerUser1Container')).toBeTruthy();
      expect(getByTestId('registerUser1Title')).toBeTruthy();

      // Usuario lee los pasos del proceso
      expect(getByTestId('registerUser1Step1Icon')).toBeTruthy();
      expect(getByTestId('registerUser1Step2Icon')).toBeTruthy();

      // Usuario lee términos y condiciones
      const termsLink = getByTestId('termsLink');
      fireEvent.press(termsLink);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(StackNav.TermsAndCondition);

      // Usuario acepta términos
      const checkbox = getByTestId('termsCheckbox');
      fireEvent.press(checkbox);

      // Usuario presiona continuar
      const continueButton = getByTestId('registerUser1ContinueButton');
      expect(continueButton.props.disabled).toBe(false);
      fireEvent.press(continueButton);

      // Navega al siguiente paso
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser2);
    });

    it('debe simular usuario que no acepta términos', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const continueButton = getByTestId('registerUser1ContinueButton');

      // Usuario intenta continuar sin aceptar términos
      expect(continueButton.props.disabled).toBe(true);
      fireEvent.press(continueButton);

      // No debe navegar
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('debe simular usuario que cambia de opinión sobre términos', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      const continueButton = getByTestId('registerUser1ContinueButton');

      // Usuario acepta términos
      fireEvent.press(checkbox);
      expect(continueButton.props.disabled).toBe(false);

      // Usuario cambia de opinión y desacepta
      fireEvent.press(checkbox);
      expect(continueButton.props.disabled).toBe(true);

      // Usuario vuelve a aceptar
      fireEvent.press(checkbox);
      expect(continueButton.props.disabled).toBe(false);

      // Usuario finalmente continúa
      fireEvent.press(continueButton);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser2);
    });
  });

  // ===== GRUPO 9: EDGE CASES =====
  describe('🛡️ Edge Cases', () => {
    it('debe manejar presiones múltiples del botón continuar', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      const continueButton = getByTestId('registerUser1ContinueButton');

      // Aceptar términos
      fireEvent.press(checkbox);

      // Presiones múltiples rápidas
      fireEvent.press(continueButton);
      fireEvent.press(continueButton);
      fireEvent.press(continueButton);

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(3);
    });

    it('debe manejar presiones múltiples del enlace de términos', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const termsLink = getByTestId('termsLink');

      // Presiones múltiples
      fireEvent.press(termsLink);
      fireEvent.press(termsLink);

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(2);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(StackNav.TermsAndCondition);
    });

    it('debe manejar tema faltante gracefully', () => {
      const initialState = {
        theme: { theme: {} }
      };

      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />,
        { initialState }
      );

      expect(getByTestId('registerUser1Container')).toBeTruthy();
    });
  });

  // ===== GRUPO 10: PERFORMANCE =====
  describe('⚡ Performance', () => {
    it('debe renderizar eficientemente', () => {
      const startTime = performance.now();
      
      renderWithProviders(<RegisterUser1 navigation={mockNavigation} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('debe manejar cambios de estado del checkbox eficientemente', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const checkbox = getByTestId('termsCheckbox');
      
      const startTime = performance.now();
      
      // Múltiples cambios rápidos
      for (let i = 0; i < 10; i++) {
        fireEvent.press(checkbox);
      }
      
      const changeTime = performance.now() - startTime;
      expect(changeTime).toBeLessThan(50);
    });
  });

  // ===== GRUPO 11: INTEGRACIÓN DE COMPONENTES =====
  describe('🔗 Integración de Componentes', () => {
    it('debe integrar correctamente con todos los componentes mockeados', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      // Verificar integración con componentes comunes
      expect(getByTestId('registerUser1Container')).toBeTruthy(); // CSafeAreaViewAuth
      expect(getByTestId('registerUser1Header')).toBeTruthy(); // CHeader
      expect(getByTestId('registerUser1KeyboardWrapper')).toBeTruthy(); // KeyBoardAvoidWrapper
      expect(getByTestId('registerUser1StepIndicator')).toBeTruthy(); // StepIndicator
      expect(getByTestId('registerUser1InfoAlert')).toBeTruthy(); // CAlert
      
      // Verificar que los botones usan componentes correctos
      expect(getByTestId('registerUser1ContinueButton')).toBeTruthy(); // CButton
      expect(getByTestId('registerUser1Step1Icon')).toBeTruthy(); // CIconText
      expect(getByTestId('registerUser1Step2Icon')).toBeTruthy(); // CIconText
    });

    it('debe verificar configuración correcta de la alerta informativa', () => {
      const { getByTestId } = renderWithProviders(
        <RegisterUser1 navigation={mockNavigation} />
      );

      const alert = getByTestId('registerUser1InfoAlert');
      expect(alert.props['data-status']).toBe('info');
      expect(alert.props['data-message']).toBe('Información importante');
    });
  });
});
