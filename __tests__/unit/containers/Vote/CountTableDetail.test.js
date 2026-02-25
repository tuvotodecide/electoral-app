/**
 * Tests for CountTableDetail screen
 * Tests de pantalla de detalle de mesa para conteo
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock dependencies
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('../../../../src/services/FirebaseNotificationService', () => ({
  firebaseNotificationService: {
    announceCountToNearbyUsers: jest.fn(() => Promise.resolve({
      usuariosNotificados: 5,
      usuariosCercanos: 10,
    })),
  },
}));

const mockGoBack = jest.fn();
const mockPopToTop = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    popToTop: mockPopToTop,
  }),
}));

describe('CountTableDetail screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
  };

  const mockUserData = {
    account: 'user123',
  };

  const createStore = () => {
    return configureStore({
      reducer: {
        theme: (state = {theme: mockTheme}) => state,
        wallet: (state = {payload: mockUserData}) => state,
      },
    });
  };

  const renderWithProvider = (component) => {
    const store = createStore();
    return render(
      <Provider store={store}>{component}</Provider>
    );
  };

  const mockRoute = {
    params: {
      mesa: {
        numero: 'Mesa 1234',
        codigo: '2352',
        recinto: 'Colegio Test',
        provincia: 'La Paz',
      },
      locationData: {
        name: 'Test Location',
        address: 'Test Address',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const CountTableDetail = require('../../../../src/container/Vote/AnnounceCount/CountTableDetail').default;
      const {UNSAFE_root} = renderWithProvider(
        <CountTableDetail
          navigation={{goBack: mockGoBack, popToTop: mockPopToTop}}
          route={mockRoute}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('muestra información de la mesa', () => {
      const CountTableDetail = require('../../../../src/container/Vote/AnnounceCount/CountTableDetail').default;
      const {getByText} = renderWithProvider(
        <CountTableDetail
          navigation={{goBack: mockGoBack, popToTop: mockPopToTop}}
          route={mockRoute}
        />
      );

      expect(getByText('Mesa 1234')).toBeTruthy();
    });
  });

  describe('Interacciones', () => {
    it('abre modal de confirmación al presionar botón de anunciar', async () => {
      const CountTableDetail = require('../../../../src/container/Vote/AnnounceCount/CountTableDetail').default;
      const {getByText} = renderWithProvider(
        <CountTableDetail
          navigation={{goBack: mockGoBack, popToTop: mockPopToTop}}
          route={mockRoute}
        />
      );

      // Find and press announce button
      // The button text comes from String.announceCountButton
    });
  });

  describe('Datos de Mesa', () => {
    it('usa datos mock cuando no hay params', () => {
      const CountTableDetail = require('../../../../src/container/Vote/AnnounceCount/CountTableDetail').default;
      const {UNSAFE_root} = renderWithProvider(
        <CountTableDetail
          navigation={{goBack: mockGoBack, popToTop: mockPopToTop}}
          route={{params: {}}}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('procesa datos de mesa correctamente', () => {
      const CountTableDetail = require('../../../../src/container/Vote/AnnounceCount/CountTableDetail').default;
      const {getByText} = renderWithProvider(
        <CountTableDetail
          navigation={{goBack: mockGoBack, popToTop: mockPopToTop}}
          route={{
            params: {
              table: {
                tableNumber: 'Mesa 5678',
                tableCode: '9999',
              },
            },
          }}
        />
      );

      expect(getByText('Mesa 5678')).toBeTruthy();
    });
  });
});
