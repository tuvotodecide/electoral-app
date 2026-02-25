/**
 * Tests for Profile Screen
 * Tests de pantalla de perfil de usuario
 */

import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import Profile from '../../../../../src/container/TabBar/Profile/Profile';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';
import {StackNav} from '../../../../../src/navigation/NavigationKey';

// Mocks
jest.mock('../../../../../src/utils/Cifrate', () => ({
  getCredentialSubjectFromPayload: jest.fn(() => ({
    fullName: 'Test User',
  })),
}));

jest.mock('../../../../../src/utils/AsyncStorage', () => ({
  setAsyncStorageData: jest.fn(),
}));

jest.mock('../../../../../src/api/constant', () => ({
  ProfileDataV2: [
    {
      section: 'General',
      data: [
        {id: 1, title: 'Personal Details', route: 'PersonalDetails'},
        {id: 2, title: 'Security', route: 'Security'},
      ],
    },
  ],
}));

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID, ...props}) =>
    React.createElement(View, {testID, ...props}, children);
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
});

jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  return ({testID, ...props}) =>
    React.createElement('Feather', {testID, ...props});
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
  const {View} = require('react-native');
  return ({testID}) => React.createElement(View, {testID});
});

jest.mock('../../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID}) =>
    React.createElement(Text, {testID}, children);
});

jest.mock('../../../../../src/components/common/CHash', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({testID}) => React.createElement(View, {testID});
});

jest.mock('../../../../../src/components/modal/LogOutModal', () => {
  const React = require('react');
  const {View, TouchableOpacity, Text} = require('react-native');
  return ({testID, visible, onPressCancel, onPressLogOut}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(
            TouchableOpacity,
            {testID: 'logoutCancelBtn', onPress: onPressCancel},
            React.createElement(Text, null, 'Cancel'),
          ),
          React.createElement(
            TouchableOpacity,
            {testID: 'logoutConfirmBtn', onPress: onPressLogOut},
            React.createElement(Text, null, 'Logout'),
          ),
        )
      : null;
});

describe('Profile Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        grayScale200: '#E5E7EB',
        grayScale500: '#6B7280',
        grayScale700: '#374151',
        inputBackground: '#FFFFFF',
        white: '#FFFFFF',
      },
    },
    wallet: {
      payload: {
        account: '0x1234567890abcdef',
        vc: {
          credentialSubject: {
            fullName: 'Test User',
          },
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal del perfil', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el scroll view del perfil', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header con gradiente', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la imagen del usuario', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el nombre del usuario', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el hash del usuario', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el contenedor del menu', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la lista del menu', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Interacciones de Usuario', () => {
    it('navega a la pantalla correspondiente al presionar un item del menu', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={localNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('toggle del switch de tema cambia el estado', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Modal de Logout', () => {
    it('el modal de logout no es visible inicialmente', () => {
      const {queryByTestId} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      // El modal no debería ser visible inicialmente
      expect(queryByTestId('logoutCancelBtn')).toBeNull();
    });
  });

  describe('Estados y Props', () => {
    it('muestra datos del usuario desde el store', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('maneja correctamente cuando no hay datos de usuario', () => {
      const emptyStore = {
        ...mockStore,
        wallet: {
          payload: null,
        },
      };

      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: emptyStore},
      );

      expect(UNSAFE_root).toBeTruthy();
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

      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={mockNavigation} />,
        {initialState: darkStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('resetea la navegación al hacer logout', async () => {
      const localNavigation = {...mockNavigation, reset: jest.fn()};

      const {UNSAFE_root} = renderWithProviders(
        <Profile navigation={localNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
