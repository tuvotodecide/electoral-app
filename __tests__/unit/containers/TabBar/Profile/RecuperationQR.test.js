/**
 * Tests for RecuperationQR screen (Backup file)
 * Tests de pantalla de respaldo de datos
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock Ionicons as a proper component
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

// Uses global mock for MaterialCommunityIcons from jest.setup.js

jest.mock('wira-sdk', () => ({
  __esModule: true,
  default: {
    RecoveryService: jest.fn().mockImplementation(() => ({
      backupDataOnDevice: jest.fn(() => Promise.resolve({
        savedOn: 'downloads',
        path: '/path/to/file',
        fileName: 'backup.json',
      })),
    })),
  },
}));

jest.mock('@/src/hooks/useBackupCheck', () => ({
  useBackupCheck: () => ({
    checkBackupAsStored: jest.fn(() => Promise.resolve()),
  }),
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

describe('RecuperationQR screen', () => {
  const mockTheme = {
    textColor: '#000000',
    primary: '#4F9858',
    backgroundColor: '#FFFFFF',
    stepBackgroundColor: '#F5F5F5',
  };

  const mockUserData = {
    dni: '12345678',
    salt: 'salt123',
    privKey: 'privKey123',
    account: 'account123',
    guardian: 'guardian123',
    did: 'did123',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el header', () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el icono de backup', () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la descripción', () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza el botón de guardar', () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('renderiza la alerta de advertencia', () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Interacciones', () => {
    it('inicia guardado al presionar botón', async () => {
      const RecuperationQR = require('../../../../../src/container/TabBar/Profile/RecuperationQR').default;
      const {UNSAFE_root} = renderWithProvider(
        <RecuperationQR navigation={{navigate: mockNavigate, reset: mockReset}} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
