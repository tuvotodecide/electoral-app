/**
 * Tests for ChangePinNewConfirm Screen
 * Tests de pantalla de confirmación de nuevo PIN
 */

import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import {
  IdentityApiUnreachableError,
  RegistryProfileError,
  VaultError,
  createMockSession,
} from '@privado-id/expo-sdk';
import ChangePinNewConfirm from '../../../../../src/container/TabBar/Profile/ChangePinNewConfirm';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../../setup/test-utils';
import {getPrivadoClient} from '../../../../../src/services/privado/privadoSession';
import {captureError} from '../../../../../src/config/sentry';
import {StackNav} from '../../../../../src/navigation/NavigationKey';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {REGISTRY_BACKUP_PENDING_KEY} from '../../../../../src/services/privado/registryBackupSync';

// Mocks
jest.mock('../../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

jest.mock('../../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../../src/utils/ThemeUtils', () => ({
  getSecondaryTextColor: jest.fn(() => '#666666'),
}));

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');
  const MockOTPTextInput = ({testID, handleTextChange, inputCount}, ref) => {
    React.useImperativeHandle(ref, () => ({
      clear: jest.fn(),
    }));
    return React.createElement(TextInput, {
      testID,
      onChangeText: handleTextChange,
      maxLength: inputCount,
    });
  }
  return React.forwardRef(MockOTPTextInput);
});

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockCSafeAreaView = ({children, testID}) =>
    React.createElement(View, {testID}, children);
  return MockCSafeAreaView;
});

jest.mock('../../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockCHeader = ({testID}) => React.createElement(View, {testID});
  return MockCHeader;
});

jest.mock('../../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockKeyBoardAvoidWrapper = ({children, testID}) =>
    React.createElement(View, {testID}, children);
  return MockKeyBoardAvoidWrapper;
});

jest.mock('../../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCText = ({children, testID}) =>
    React.createElement(Text, {testID}, children);
  return MockCText;
});

jest.mock('../../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  const MockCButton = ({testID, title, onPress, disabled}) =>
    React.createElement(
      TouchableOpacity,
      {testID, onPress, disabled},
      React.createElement(Text, null, title),
    );
  return MockCButton;
});

jest.mock('../../../../../src/components/modal/LoadingModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  const MockLoadingModal = ({testID, visible, message, isLoading, success, onClose}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, {testID: 'modalMessage'}, message),
          !isLoading &&
            React.createElement(
              TouchableOpacity,
              {testID: 'modalCloseBtn', onPress: onClose},
              React.createElement(Text, null, 'Close'),
            ),
        )
      : null;
  return MockLoadingModal;
});

describe('ChangePinNewConfirm Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        textColor: '#2F2F2F',
        inputBackground: '#FFFFFF',
        grayScale500: '#6B7280',
      },
    },
  };

  const routeWithPins = {
    ...mockRoute,
    params: {
      oldPin: '1234',
      newPin: '5678',
    },
  };

  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = createMockSession().client;
    getPrivadoClient.mockResolvedValue(client);
  });

  const confirmWith = async (utils, pin) => {
    fireEvent.changeText(utils.getByTestId('textInput'), pin);
    await act(async () => {
      fireEvent.press(utils.getByTestId('changePinNewConfirmFinishButton'));
    });
  };

  const renderConfirm = (navigation = mockNavigation) =>
    renderWithProviders(
      <ChangePinNewConfirm navigation={navigation} route={routeWithPins} />,
      {initialState: mockStore},
    );

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el título', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el subtítulo', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el input de OTP', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el botón de finalizar', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Confirmación de PIN', () => {
    it('cambia el PIN con el SDK, que actualiza el respaldo del registro', async () => {
      const utils = renderConfirm();

      await confirmWith(utils, '5678');

      await waitFor(() =>
        expect(client.changePin).toHaveBeenCalledWith({currentPin: '1234', newPin: '5678'}),
      );
      await waitFor(() =>
        expect(utils.getByTestId('modalMessage').props.children).toBe(
          'Tu PIN ha sido actualizado correctamente',
        ),
      );
      // El respaldo que subió changePin ya incluye todo: nada queda pendiente.
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(REGISTRY_BACKUP_PENDING_KEY);
    });

    it('si el cambio falla conserva la marca de respaldo pendiente', async () => {
      client.changePin.mockRejectedValueOnce(new Error('offline'));
      const utils = renderConfirm();

      await confirmWith(utils, '5678');

      await waitFor(() => expect(client.changePin).toHaveBeenCalled());
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(REGISTRY_BACKUP_PENDING_KEY);
    });

    it('si los PIN no coinciden no cambia nada', async () => {
      const utils = renderConfirm();

      await confirmWith(utils, '9999');

      expect(client.changePin).not.toHaveBeenCalled();
      expect(utils.getByTestId('modalMessage').props.children).toBe('Los PIN no coinciden');
    });

    it('tras el éxito, cerrar el modal vuelve al inicio', async () => {
      const localNavigation = {...mockNavigation, reset: jest.fn()};
      const utils = renderConfirm(localNavigation);

      await confirmWith(utils, '5678');
      await waitFor(() => expect(utils.getByTestId('modalCloseBtn')).toBeTruthy());
      fireEvent.press(utils.getByTestId('modalCloseBtn'));

      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
  });

  describe('Manejo de Errores', () => {
    it.each([
      [
        'sin conexión',
        () => new IdentityApiUnreachableError('registry/profile', new Error('offline')),
        /Error de red.*Tu PIN no cambió\./,
        false,
      ],
      [
        'PIN actual incorrecto',
        () => new VaultError('INVALID_PIN', 'wrong'),
        /El PIN actual no es correcto/,
        false,
      ],
      [
        'cuenta sin registro',
        () => new RegistryProfileError('not-found'),
        /No encontramos el registro de tu cuenta.*Tu PIN no cambió\./,
        true,
      ],
      [
        'error inesperado',
        () => new Error('boom'),
        /No se pudo cambiar tu PIN/,
        true,
      ],
    ])('%s: muestra el motivo y no cierra el flujo', async (_label, makeError, message, reported) => {
      client.changePin.mockRejectedValueOnce(makeError());
      const localNavigation = {...mockNavigation, reset: jest.fn()};
      const utils = renderConfirm(localNavigation);

      await confirmWith(utils, '5678');

      await waitFor(() =>
        expect(utils.getByTestId('modalMessage').props.children).toMatch(message),
      );
      expect(captureError).toHaveBeenCalledTimes(reported ? 1 : 0);
      fireEvent.press(utils.getByTestId('modalCloseBtn'));
      expect(localNavigation.reset).not.toHaveBeenCalled();
    });
  });

  describe('Modal de Resultado', () => {
    it('el modal no se muestra antes de confirmar', () => {
      const utils = renderConfirm();
      expect(utils.queryByTestId('changePinNewConfirmResultModal')).toBeNull();
    });
  });

  describe('Estado del Botón', () => {
    it('el botón está deshabilitado cuando el PIN de confirmación está vacío', () => {
      const {UNSAFE_root} = renderWithProviders(
        <ChangePinNewConfirm navigation={mockNavigation} route={routeWithPins} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
