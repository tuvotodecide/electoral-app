/**
 * Tests for useFirebaseUserSetup hook
 * Tests del hook de configuración de usuario Firebase
 */

import {renderHook, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mocks
const mockInitializeUser = jest.fn();

jest.mock('../../../src/services/FirebaseNotificationService', () => ({
  FirebaseNotificationService: jest.fn().mockImplementation(() => ({
    initializeUser: mockInitializeUser,
  })),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('useFirebaseUserSetup hook', () => {
  const mockUserData = {
    address: '0x1234567890abcdef',
    nombre: 'Test User',
    direccion: 'Test Address',
    telefono: '+1234567890',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInitializeUser.mockResolvedValue({success: true});
  });

  const createWrapper = (initialState = {}) => {
    const store = configureStore({
      reducer: {
        wallet: (state = {payload: null}) => state,
      },
      preloadedState: initialState,
    });

    return ({children}) =>
      React.createElement(Provider, {store}, children);
  };

  describe('Inicialización', () => {
    it('inicializa el hook con valores por defecto', () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(null);

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      const {result} = renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.initializationError).toBeNull();
      expect(result.current.notificationService).toBeDefined();
    });

    it('no inicializa si userData es null', () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(null);

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      expect(mockInitializeUser).not.toHaveBeenCalled();
    });

    it('no inicializa si userData.address es undefined', () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue({nombre: 'Test'});

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      expect(mockInitializeUser).not.toHaveBeenCalled();
    });
  });

  describe('Inicialización Exitosa', () => {
    it('inicializa usuario cuando userData está disponible', async () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(mockUserData);

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      const {result} = renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockInitializeUser).toHaveBeenCalledWith(
          mockUserData.address,
          expect.objectContaining({
            nombre: mockUserData.nombre,
            direccion: mockUserData.direccion,
            telefono: mockUserData.telefono,
            email: mockUserData.email,
          }),
        );
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('usa truncado de address como nombre fallback', async () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue({
        address: '0x1234567890abcdef',
      });

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockInitializeUser).toHaveBeenCalledWith(
          '0x1234567890abcdef',
          expect.objectContaining({
            nombre: '0x123456...',
          }),
        );
      });
    });
  });

  describe('Manejo de Errores', () => {
    it('captura error de inicialización', async () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(mockUserData);
      mockInitializeUser.mockResolvedValue({
        success: false,
        error: 'Initialization failed',
      });

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      const {result} = renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.initializationError).toBe('Initialization failed');
      });
    });

    it('captura excepción durante inicialización', async () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(mockUserData);
      mockInitializeUser.mockRejectedValue(new Error('Network error'));

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      const {result} = renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.initializationError).toBe('Network error');
      });
    });
  });

  describe('Reinicialización', () => {
    it('no reinicializa si ya está inicializado', async () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(mockUserData);

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      const {result, rerender} = renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Limpiar conteo de llamadas
      mockInitializeUser.mockClear();

      // Re-render
      rerender();

      // No debería llamar de nuevo
      expect(mockInitializeUser).not.toHaveBeenCalled();
    });
  });

  describe('Instancia del Servicio', () => {
    it('retorna instancia del servicio de notificaciones', () => {
      const {useSelector} = require('react-redux');
      useSelector.mockReturnValue(null);

      const {useFirebaseUserSetup} = require('../../../src/hooks/useFirebaseUserSetup');
      const {result} = renderHook(() => useFirebaseUserSetup(), {
        wrapper: createWrapper(),
      });

      expect(result.current.notificationService).toBeDefined();
      expect(typeof result.current.notificationService.initializeUser).toBe(
        'function',
      );
    });
  });
});
