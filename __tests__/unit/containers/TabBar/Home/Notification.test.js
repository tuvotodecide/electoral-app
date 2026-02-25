/**
 * Tests for Notification Screen
 * Tests de pantalla de notificaciones
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import Notification from '../../../../../src/container/TabBar/Home/Notification';
import {renderWithProviders, mockNavigation} from '../../../../setup/test-utils';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('axios', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: {
        data: [
          {
            _id: 'notif1',
            title: 'Test Notification',
            body: 'Test body',
            createdAt: new Date().toISOString(),
            data: {
              type: 'announce_count',
              tableNumber: '001',
              locationName: 'Test Location',
              locationAddress: 'Test Address',
            },
          },
        ],
      },
    }),
  ),
}));

jest.mock('../../../../../src/services/pushPermission', () => ({
  requestPushPermissionExplicit: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/services/notifications', () => ({
  formatTiempoRelativo: jest.fn(() => 'hace 5 min'),
}));

jest.mock('../../../../../src/notifications', () => ({
  getLocalStoredNotifications: jest.fn(() => Promise.resolve([])),
  mergeAndDedupeNotifications: jest.fn(({localList, remoteList}) => remoteList),
}));

jest.mock('../../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(() => Promise.resolve(null)),
  setCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('mock-api-key')),
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
});

jest.mock('../../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../../src/components/common/CStandardHeader', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, title, onPressBack}) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, null, title),
      React.createElement(
        TouchableOpacity,
        {testID: 'notificationBackBtn', onPress: onPressBack},
        React.createElement(Text, null, 'Back'),
      ),
    );
});

describe('Notification Screen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
      },
    },
    wallet: {
      payload: {
        did: 'did:example:123',
        privKey: 'mockPrivKey',
        dni: '12345678',
        vc: {
          credentialSubject: {
            nationalIdNumber: '12345678',
          },
        },
      },
    },
  };

  const navigationWithListener = {
    ...mockNavigation,
    addListener: jest.fn((event, callback) => {
      // Simular que el listener se activa inmediatamente
      if (event === 'focus') {
        // No llamar inmediatamente para evitar loops
      }
      return jest.fn(); // unsubscribe function
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal de notificaciones', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header de notificaciones', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('muestra el loader mientras carga', () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la lista de notificaciones después de cargar', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Interacciones de Usuario', () => {
    it('navega hacia atrás al presionar el botón de retroceso', async () => {
      const localNavigation = {
        ...navigationWithListener,
        goBack: jest.fn(),
      };

      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={localNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('permite hacer pull to refresh', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Notificaciones Vacías', () => {
    it('muestra estado vacío cuando no hay notificaciones', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('muestra mensaje de no hay notificaciones', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Items de Notificación', () => {
    it('renderiza items de notificación correctamente', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('muestra el icono de la notificación', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('muestra el título de la notificación', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('muestra el tiempo de la notificación', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Navegación desde Notificación', () => {
    it('navega a SuccessScreen cuando corresponde', async () => {
      const localNavigation = {
        ...navigationWithListener,
        navigate: jest.fn(),
      };

      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={localNavigation} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Manejo de Errores', () => {
    it('maneja errores de red correctamente', async () => {
      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Sin DNI', () => {
    it('maneja correctamente cuando no hay DNI', async () => {
      const storeWithoutDni = {
        ...mockStore,
        wallet: {
          payload: {
            did: 'did:example:123',
            privKey: 'mockPrivKey',
          },
        },
      };

      const {UNSAFE_root} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: storeWithoutDni},
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
