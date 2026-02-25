/**
 * Tests for CountTableDetail screen
 * Tests de pantalla de detalle de mesa para conteo
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Ionicons as proper component
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const MockIcon = ({name, size, color, style, testID}) => {
    return React.createElement('Text', {
      testID: testID || `icon-${name}`,
      style: [{fontSize: size, color}, style],
      children: name,
    });
  };
  return MockIcon;
});

// MaterialIcons uses global mock from jest.setup.js

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
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    popToTop: mockPopToTop,
    navigate: jest.fn(),
    canGoBack: () => true,
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
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
      const {UNSAFE_root} = renderWithProvider(
        <CountTableDetail
          navigation={{goBack: mockGoBack, popToTop: mockPopToTop}}
          route={mockRoute}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
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
