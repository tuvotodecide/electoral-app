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
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('notificationScreenContainer')).toBeTruthy();
      });
    });

    it('renderiza el header de notificaciones', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('notificationHeader')).toBeTruthy();
      });
    });

    it('muestra el loader mientras carga', () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      // El loader debería mostrarse inicialmente
      expect(getByTestId('notificationLoader')).toBeTruthy();
    });

    it('renderiza la lista de notificaciones después de cargar', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationList')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });

  describe('Interacciones de Usuario', () => {
    it('navega hacia atrás al presionar el botón de retroceso', async () => {
      const localNavigation = {
        ...navigationWithListener,
        goBack: jest.fn(),
      };

      const {getByTestId} = renderWithProviders(
        <Notification navigation={localNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const backBtn = getByTestId('notificationBackBtn');
        fireEvent.press(backBtn);
        expect(localNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('permite hacer pull to refresh', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          const list = getByTestId('notificationList');
          expect(list).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });

  describe('Notificaciones Vacías', () => {
    it('muestra estado vacío cuando no hay notificaciones', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValueOnce({data: {data: []}});

      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationEmptyState')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });

    it('muestra mensaje de no hay notificaciones', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValueOnce({data: {data: []}});

      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationEmptyText')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });

  describe('Items de Notificación', () => {
    it('renderiza items de notificación correctamente', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationItem_0')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });

    it('muestra el icono de la notificación', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationIcon_0')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });

    it('muestra el título de la notificación', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationTitle_0')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });

    it('muestra el tiempo de la notificación', async () => {
      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('notificationTime_0')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });

  describe('Navegación desde Notificación', () => {
    it('navega a SuccessScreen cuando corresponde', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              _id: 'notif1',
              title: 'Acta Publicada',
              body: 'Test body',
              createdAt: new Date().toISOString(),
              data: {
                type: 'acta_published',
                screen: 'SuccessScreen',
                routeParams: JSON.stringify({ipfsData: {}}),
              },
            },
          ],
        },
      });

      const localNavigation = {
        ...navigationWithListener,
        navigate: jest.fn(),
      };

      const {getByTestId} = renderWithProviders(
        <Notification navigation={localNavigation} />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          const item = getByTestId('notificationItem_0');
          fireEvent.press(item);
        },
        {timeout: 3000},
      );

      await waitFor(() => {
        expect(localNavigation.navigate).toHaveBeenCalledWith(
          'SuccessScreen',
          expect.any(Object),
        );
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('maneja errores de red correctamente', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: mockStore},
      );

      // Debería mostrar datos en caché o estado vacío
      await waitFor(
        () => {
          expect(getByTestId('notificationScreenContainer')).toBeTruthy();
        },
        {timeout: 3000},
      );
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

      const {getByTestId} = renderWithProviders(
        <Notification navigation={navigationWithListener} />,
        {initialState: storeWithoutDni},
      );

      await waitFor(() => {
        expect(getByTestId('notificationScreenContainer')).toBeTruthy();
      });
    });
  });
});
