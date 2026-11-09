/**
 * Tests for Security Screen
 * Tests de pantalla de seguridad
 */

import React from 'react';
import {Alert} from 'react-native';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {VaultError, createMockVault} from '@privado-id/expo-sdk';
import Security from '../../../../../src/container/TabBar/Profile/Security';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';
import {getPrivadoVault} from '../../../../../src/services/privado/privadoSession';
import {VaultUnlockCancelledError} from '../../../../../src/services/privado/vaultUnlock';
import {captureError} from '../../../../../src/config/sentry';

// Mocks
jest.mock('../../../../../src/services/privado/privadoSession', () => ({
  getPrivadoVault: jest.fn(),
}));

jest.mock('../../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../../src/api/constant', () => ({
  SecuryData: [
    {
      section: 'Security',
      data: [
        {id: 1, title: 'Change PIN', route: 'ChangePinVerify', icon: 'lock'},
        {id: 2, title: 'Biometric', rightIcon: 'switch'},
      ],
    },
  ],
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const MockIonicons = ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
  return MockIonicons;
});

jest.mock('react-native-vector-icons/Entypo', () => {
  const React = require('react');
  const MockEntypo = ({testID, name, ...props}) =>
    React.createElement('Entypo', {testID, name, ...props});
  return MockEntypo;
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
  const {View, Text} = require('react-native');
  const MockCHeader = ({testID, title}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, title));
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

describe('Security Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        grayScale200: '#E5E7EB',
        grayScale300: '#D1D5DB',
        grayScale400: '#9CA3AF',
        grayScale500: '#6B7280',
        grayScale700: '#374151',
        inputBackground: '#FFFFFF',
        white: '#FFFFFF',
      },
    },
  };

  let vault;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    vault = createMockVault();
    getPrivadoVault.mockResolvedValue(vault);
  });

  const renderSecurity = () =>
    renderWithProviders(<Security navigation={mockNavigation} />, {
      initialState: mockStore,
    });

  const toggleTo = async (getByTestId, value) => {
    await waitFor(() => expect(vault.isBiometricsEnabled).toHaveBeenCalled());
    await act(async () => {
      fireEvent(getByTestId('securityBiometricSwitch'), 'valueChange', value);
    });
  };

  describe('Renderizado', () => {
    it('renderiza el contenedor principal de seguridad', () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('securityContainer')).toBeTruthy();
    });

    it('renderiza el header de seguridad', () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('securityHeader')).toBeTruthy();
    });

    it('renderiza el keyboard wrapper', () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('securityKeyboardWrapper')).toBeTruthy();
    });

    it('renderiza la lista de secciones', () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(getByTestId('securitySectionList')).toBeTruthy();
    });
  });

  describe('Biometría', () => {
    it('renderiza el switch de biometría', async () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('securityBiometricSwitch')).toBeTruthy();
      });
    });

    it('renderiza el label de biometría', async () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('securityBiometricLabel')).toBeTruthy();
      });
    });

    it('renderiza el icono de biometría', async () => {
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('securityBiometricIcon')).toBeTruthy();
      });
    });

    it('en iOS activarla confirma con la huella y habilita la biometría del vault', async () => {
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({promptMessage: 'Escanea tu huella dactilar'}),
      );
      expect(vault.enableBiometrics).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(getByTestId('securityBiometricSwitch').props.value).toBe(true),
      );
    });

    it('en Android no pide la confirmación previa: el sistema la pide al guardar', async () => {
      const {Platform} = require('react-native');
      const original = Platform.OS;
      Platform.OS = 'android';
      try {
        const {getByTestId} = renderSecurity();

        await toggleTo(getByTestId, true);

        expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
        expect(vault.enableBiometrics).toHaveBeenCalledTimes(1);
        await waitFor(() =>
          expect(getByTestId('securityBiometricSwitch').props.value).toBe(true),
        );
      } finally {
        Platform.OS = original;
      }
    });

    it('desactivarla borra el acceso biométrico del vault', async () => {
      vault.isBiometricsEnabled.mockResolvedValue(true);
      const {getByTestId} = renderSecurity();
      await waitFor(() =>
        expect(getByTestId('securityBiometricSwitch').props.value).toBe(true),
      );

      await toggleTo(getByTestId, false);

      expect(vault.disableBiometrics).toHaveBeenCalledTimes(1);
      expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
      expect(getByTestId('securityBiometricSwitch').props.value).toBe(false);
    });

    it('si el usuario cancela la huella no activa nada ni muestra alertas', async () => {
      LocalAuthentication.authenticateAsync.mockResolvedValueOnce({
        success: false,
        error: 'user_cancel',
      });
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(vault.enableBiometrics).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(getByTestId('securityBiometricSwitch').props.value).toBe(false);
    });

    it('si cancela el desbloqueo del vault deja el switch como estaba', async () => {
      vault.enableBiometrics.mockRejectedValueOnce(new VaultUnlockCancelledError());
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(captureError).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(getByTestId('securityBiometricSwitch').props.value).toBe(false),
      );
    });
  });

  describe('Interacciones de Usuario', () => {
    it('navega a la pantalla correspondiente al presionar un item', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <Security navigation={localNavigation} />,
        {initialState: mockStore},
      );

      const menuItem = getByTestId('securityMenuItem_1');
      fireEvent.press(menuItem);

      expect(localNavigation.navigate).toHaveBeenCalled();
    });
  });

  describe('Estados y Props', () => {
    it('maneja correctamente el estado inicial de biometría', async () => {
      vault.isBiometricsEnabled.mockResolvedValueOnce(true);

      const {getByTestId} = renderSecurity();

      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        expect(bioSwitch.props.value).toBe(true);
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('sin huella registrada avisa que la biometría no está disponible', async () => {
      LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(false);
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Biometría no disponible',
        'Actívala en Ajustes del sistema',
      );
      expect(vault.enableBiometrics).not.toHaveBeenCalled();
    });

    it('si el vault no puede usar la biometría también lo avisa', async () => {
      vault.enableBiometrics.mockRejectedValueOnce(
        new VaultError('BIOMETRICS_UNAVAILABLE', 'unavailable'),
      );
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Biometría no disponible',
        'Actívala en Ajustes del sistema',
      );
    });

    it('sin vault pide crear la cuenta primero', async () => {
      vault.enableBiometrics.mockRejectedValueOnce(
        new VaultError('VAULT_NOT_CREATED', 'no vault'),
      );
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Sin datos',
        'Crea tu cuenta/PIN antes de activar la biometría',
      );
    });

    it('si la huella falla lo indica y no activa nada', async () => {
      LocalAuthentication.authenticateAsync.mockResolvedValueOnce({
        success: false,
        error: 'authentication_failed',
      });
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Biometría',
        'La autenticación falló. Inténtalo de nuevo.',
      );
      expect(vault.enableBiometrics).not.toHaveBeenCalled();
    });

    it('un error inesperado se registra y se muestra', async () => {
      vault.enableBiometrics.mockRejectedValueOnce(new Error('boom'));
      const {getByTestId} = renderSecurity();

      await toggleTo(getByTestId, true);

      expect(captureError).toHaveBeenCalledWith(
        expect.objectContaining({message: 'boom'}),
        expect.objectContaining({flow: 'Security', step: 'toggleBio'}),
      );
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'boom');
      expect(getByTestId('securityBiometricSwitch').props.value).toBe(false);
    });
  });

  describe('Tema Oscuro', () => {
    it('renderiza correctamente con tema oscuro', () => {
      const darkStore = {
        ...mockStore,
        theme: {
          theme: {
            ...mockStore.theme.theme,
            dark: true,
          },
        },
      };

      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: darkStore},
      );

      expect(getByTestId('securityContainer')).toBeTruthy();
    });
  });
});
