/**
 * Tests for Security Screen
 * Tests de pantalla de seguridad
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import Security from '../../../../../src/container/TabBar/Profile/Security';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';

// Mocks
jest.mock('wira-sdk', () => ({
  Biometric: {
    getBioFlag: jest.fn(() => Promise.resolve(false)),
  },
  toggleBiometricAuth: jest.fn(() => Promise.resolve()),
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
  return ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
});

jest.mock('react-native-vector-icons/Entypo', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('Entypo', {testID, name, ...props});
});

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, title}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, title));
});

jest.mock('../../../../../src/components/common/KeyBoardAvoidWrapper', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID}) =>
    React.createElement(Text, {testID}, children);
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
    wallet: {
      payload: {
        did: 'did:example:123',
        privKey: 'mockPrivKey',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    it('toggle de biometría llama a la función correspondiente', async () => {
      const wira = require('wira-sdk');
      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        fireEvent(bioSwitch, 'valueChange', true);
      });

      expect(wira.toggleBiometricAuth).toHaveBeenCalled();
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
      const wira = require('wira-sdk');
      wira.Biometric.getBioFlag.mockResolvedValueOnce(true);

      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        expect(bioSwitch.props.value).toBe(true);
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra alerta cuando biometría no está disponible', async () => {
      const wira = require('wira-sdk');
      const {Alert} = require('react-native');
      jest.spyOn(Alert, 'alert');

      wira.toggleBiometricAuth.mockRejectedValueOnce(
        new Error('Biometric authentication is not available'),
      );

      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        fireEvent(bioSwitch, 'valueChange', true);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Biometría no disponible',
          'Actívala en Ajustes del sistema',
        );
      });
    });

    it('muestra alerta cuando no hay datos de usuario', async () => {
      const wira = require('wira-sdk');
      const {Alert} = require('react-native');
      jest.spyOn(Alert, 'alert');

      wira.toggleBiometricAuth.mockRejectedValueOnce(
        new Error('User data is required to enable biometric authentication'),
      );

      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        fireEvent(bioSwitch, 'valueChange', true);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Sin datos',
          'Crea tu cuenta/PIN antes de activar la biometría',
        );
      });
    });

    it('maneja cancelación del usuario correctamente', async () => {
      const wira = require('wira-sdk');

      wira.toggleBiometricAuth.mockRejectedValueOnce(
        new Error('User cancelled biometric change'),
      );

      const {getByTestId} = renderWithProviders(
        <Security navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        fireEvent(bioSwitch, 'valueChange', true);
      });

      // El switch debería volver a false
      await waitFor(() => {
        const bioSwitch = getByTestId('securityBiometricSwitch');
        expect(bioSwitch.props.value).toBe(false);
      });
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
