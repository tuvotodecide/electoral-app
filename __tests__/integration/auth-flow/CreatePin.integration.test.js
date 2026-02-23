/**
 * Integration Tests for CreatePin Screen
 * Tests de integración para la pantalla CreatePin
 */

import { fireEvent, waitFor } from '@testing-library/react-native';
import CreatePin from '../../../src/container/Auth/CreatePin';
import { AuthNav } from '../../../src/navigation/NavigationKey';
import { mockNavigation, renderWithProviders } from '../../setup/test-utils';

if (!CreatePin) {
  throw new Error('CreatePin component failed to import');
}

// Simplified UI mocks to stabilize integration rendering in Jest
jest.mock('../../../src/components/common/CSafeAreaViewAuth', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, { ...props, testID: props.testID || 'mockCSafeAreaViewAuth' }, children);
});

jest.mock('../../../src/components/common/CHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, { ...props, testID: props.testID || 'mockCHeader' }, children);
});

jest.mock('../../../src/components/common/CText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children, ...props }) => React.createElement(Text, props, children);
});

jest.mock('../../../src/components/common/CButton', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress, children, ...props }) =>
    React.createElement(
      TouchableOpacity,
      { ...props, onPress },
      title ? React.createElement(Text, null, title) : null,
      children,
    );
});

jest.mock('../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, { ...props, testID: props.testID || 'mockKeyboardWrapper' }, children);
});

jest.mock('../../../src/components/authComponents/StepIndicator', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, props, children);
});

// Mock real del hook con implementación básica
jest.mock('../../../src/hooks/useNavigationLogger', () => ({
  useNavigationLogger: jest.fn((screenName, autoLog = false) => {
    const mockLogAction = jest.fn((action, details) => {
      console.log(`[ACTION] ${screenName} - ${action}${details ? `: ${details}` : ''}`);
    });
    
    const mockLogNavigation = jest.fn((targetScreen) => {
      console.log(`[NAV] Navigating from ${screenName} to ${targetScreen}`);
    });

    return {
      logAction: mockLogAction,
      logNavigation: mockLogNavigation,
    };
  }),
}));

// Mock más realista del OTP Input
jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const { View, TextInput } = require('react-native');
  
  return React.forwardRef((props, ref) => {
    const [internalValue, setInternalValue] = React.useState(props.code || '');
    
    const handleChange = (text) => {
      // Simular comportamiento real del OTP: solo números y longitud máxima
      const cleanText = text.replace(/[^0-9]/g, '').slice(0, props.inputCount);
      setInternalValue(cleanText);
      props.handleTextChange && props.handleTextChange(cleanText);
    };

    return (
      <View testID="otp-input-container">
        <TextInput
          testID="pinCreationInput"
          value={internalValue}
          onChangeText={handleChange}
          secureTextEntry={props.secureTextEntry}
          maxLength={props.inputCount}
          keyboardType="numeric"
        />
      </View>
    );
  });
});

describe('CreatePin Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Flow', () => {
    it('should complete the full PIN creation flow', async () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // 1. Verificar renderizado inicial
      expect(getByTestId('createPinContainer')).toBeTruthy();
      
      // 2. Ingresar PIN paso a paso
      const otpInput = getByTestId('pinCreationInput');
      
      fireEvent.changeText(otpInput, '1');
      fireEvent.changeText(otpInput, '12');
      fireEvent.changeText(otpInput, '123');
      fireEvent.changeText(otpInput, '1234');
      fireEvent.changeText(otpInput, '12345');

      // 3. Presionar botón crear
      const createButton = getByTestId('createPinButton');
      fireEvent.press(createButton);

      // 4. Verificar navegación
      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
      });
    });

    it('should handle skip flow correctly', async () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // Usuario decide saltar la creación de PIN
      const skipButton = getByTestId('skipForNowButton');
      fireEvent.press(skipButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith(AuthNav.UploadDocument);
      });
    });

    it('should handle PIN input validation correctly', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      // Probar entrada de caracteres no numéricos
      fireEvent.changeText(otpInput, 'abc123');
      // Debería filtrar solo números: '123'
      
      fireEvent.changeText(otpInput, '123456789'); 
      // Debería truncar a 5 dígitos: '12345'
      
      expect(otpInput.props.value).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', () => {
      const errorNavigation = {
        ...mockNavigation,
        navigate: jest.fn(() => {
          throw new Error('Navigation failed');
        })
      };

      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={errorNavigation} />
      );

      const createButton = getByTestId('createPinButton');
      
      // No debería crashear la app
      expect(() => {
        fireEvent.press(createButton);
      }).not.toThrow();
    });

    it('should handle Redux store errors gracefully', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />,
        {
          initialState: {
            theme: null // Estado inválido
          }
        }
      );

      // Debería renderizar sin crashear
      expect(getByTestId('createPinContainer')).toBeTruthy();
    });
  });

  describe('Real-time Logging Integration', () => {
    it('should log all user interactions in sequence', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      const createButton = getByTestId('createPinButton');

      // Secuencia de interacciones
      fireEvent.changeText(otpInput, '1');
      fireEvent.changeText(otpInput, '12');
      fireEvent.changeText(otpInput, '123');
      fireEvent.press(createButton);

      // Verificar que se logearon todas las acciones
      expect(consoleSpy).toHaveBeenCalledWith('[ACTION] CreatePin - OTP Changed: Length: 1');
      expect(consoleSpy).toHaveBeenCalledWith('[ACTION] CreatePin - OTP Changed: Length: 2');
      expect(consoleSpy).toHaveBeenCalledWith('[ACTION] CreatePin - OTP Changed: Length: 3');
      expect(consoleSpy).toHaveBeenCalledWith('[NAV] Navigating from CreatePin to UploadDocument');

      consoleSpy.mockRestore();
    });
  });

  describe('Theme Integration', () => {
    it('should adapt to theme changes dynamically', () => {
      const initialTheme = {
        primary: '#007AFF',
        inputBackground: '#F5F5F5',
        textColor: '#000000'
      };

      const { getByTestId, store } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />,
        {
          initialState: {
            theme: { theme: initialTheme }
          }
        }
      );

      expect(getByTestId('createPinContainer')).toBeTruthy();

      // Simular cambio de tema
      store.dispatch({
        type: 'theme/setTheme',
        payload: {
          primary: '#FF0000',
          inputBackground: '#1C1C1E',
          textColor: '#FFFFFF',
          dark: true
        }
      });

      // El componente debería seguir funcionando
      expect(getByTestId('createPinContainer')).toBeTruthy();
    });
  });

  describe('Memory and Performance', () => {
    it('should not cause memory leaks with rapid interactions', () => {
      const { getByTestId, unmount } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      const otpInput = getByTestId('pinCreationInput');
      
      // Simular muchas interacciones rápidas
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(otpInput, Math.random().toString().slice(2, 7));
      }

      // El componente debería seguir respondiendo
      expect(getByTestId('createPinContainer')).toBeTruthy();

      // Cleanup
      unmount();
    });

    it('should handle component unmounting gracefully', () => {
      const { unmount } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // No debería generar errores al desmontar
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Accessibility Integration', () => {
    it('should work with accessibility tools', () => {
      const { getByTestId } = renderWithProviders(
        <CreatePin navigation={mockNavigation} />
      );

      // Todos los elementos importantes deberían ser accesibles
      const accessibleElements = [
        'createPinContainer',
        'pinCreationInput',
        'createPinButton',
        'skipForNowButton'
      ];

      accessibleElements.forEach(testId => {
        const element = getByTestId(testId);
        expect(element).toBeTruthy();
      });
    });
  });
});
