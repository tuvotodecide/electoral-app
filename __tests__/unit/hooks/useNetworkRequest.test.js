/**
 * Tests for useNetworkRequest hook
 * Tests del hook de requests de red
 */

import {renderHook, act, waitFor} from '@testing-library/react-native';

// Mocks
jest.mock('../../../src/utils/networkUtils', () => ({
  checkInternetConnection: jest.fn(() => Promise.resolve(true)),
  retryWithBackoff: jest.fn((fn) => fn()),
  showNetworkErrorAlert: jest.fn(),
}));

describe('useNetworkRequest hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Estado Inicial', () => {
    it('inicializa con valores por defecto', () => {
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.executeRequest).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('executeRequest', () => {
    it('ejecuta request exitosamente', async () => {
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.resolve({data: 'test'}));

      let response;
      await act(async () => {
        response = await result.current.executeRequest(mockRequestFn);
      });

      expect(response).toEqual({data: 'test'});
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('maneja loading state correctamente', async () => {
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve({data: 'test'}), 100)),
      );

      let promise;
      act(() => {
        promise = result.current.executeRequest(mockRequestFn);
      });

      // Debería estar cargando
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await promise;
      });

      // Ya no debería estar cargando
      expect(result.current.loading).toBe(false);
    });

    it('verifica conexión a internet cuando requireInternet es true', async () => {
      const {checkInternetConnection} = require('../../../src/utils/networkUtils');
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.resolve({data: 'test'}));

      await act(async () => {
        await result.current.executeRequest(mockRequestFn, {requireInternet: true});
      });

      expect(checkInternetConnection).toHaveBeenCalled();
    });

    it('no verifica conexión cuando requireInternet es false', async () => {
      const {checkInternetConnection} = require('../../../src/utils/networkUtils');
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.resolve({data: 'test'}));

      await act(async () => {
        await result.current.executeRequest(mockRequestFn, {requireInternet: false});
      });

      expect(checkInternetConnection).not.toHaveBeenCalled();
    });

    it('usa retryWithBackoff para ejecutar request', async () => {
      const {retryWithBackoff} = require('../../../src/utils/networkUtils');
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.resolve({data: 'test'}));

      await act(async () => {
        await result.current.executeRequest(mockRequestFn, {
          maxRetries: 5,
          baseDelay: 2000,
        });
      });

      expect(retryWithBackoff).toHaveBeenCalledWith(mockRequestFn, 5, 2000);
    });
  });

  describe('Manejo de Errores', () => {
    it('captura error cuando no hay conexión a internet', async () => {
      const {checkInternetConnection, showNetworkErrorAlert} = require('../../../src/utils/networkUtils');
      checkInternetConnection.mockResolvedValueOnce(false);

      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.resolve({data: 'test'}));

      await act(async () => {
        try {
          await result.current.executeRequest(mockRequestFn);
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toBe(
        'No hay conexión a internet disponible',
      );
      expect(showNetworkErrorAlert).toHaveBeenCalled();
    });

    it('captura error de request', async () => {
      const {retryWithBackoff, showNetworkErrorAlert} = require('../../../src/utils/networkUtils');
      retryWithBackoff.mockRejectedValueOnce(new Error('Request failed'));

      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.reject(new Error('Request failed')));

      await act(async () => {
        try {
          await result.current.executeRequest(mockRequestFn);
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toBe('Request failed');
      expect(showNetworkErrorAlert).toHaveBeenCalled();
    });

    it('no muestra alerta si showAlert es false', async () => {
      const {retryWithBackoff, showNetworkErrorAlert} = require('../../../src/utils/networkUtils');
      retryWithBackoff.mockRejectedValueOnce(new Error('Request failed'));

      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.reject(new Error('Request failed')));

      await act(async () => {
        try {
          await result.current.executeRequest(mockRequestFn, {showAlert: false});
        } catch (e) {
          // Expected error
        }
      });

      expect(showNetworkErrorAlert).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('limpia el error', async () => {
      const {retryWithBackoff} = require('../../../src/utils/networkUtils');
      retryWithBackoff.mockRejectedValueOnce(new Error('Request failed'));

      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.reject(new Error('Request failed')));

      await act(async () => {
        try {
          await result.current.executeRequest(mockRequestFn, {showAlert: false});
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Opciones por Defecto', () => {
    it('usa valores por defecto correctos', async () => {
      const {retryWithBackoff} = require('../../../src/utils/networkUtils');
      const {useNetworkRequest} = require('../../../src/hooks/useNetworkRequest');
      const {result} = renderHook(() => useNetworkRequest());

      const mockRequestFn = jest.fn(() => Promise.resolve({data: 'test'}));

      await act(async () => {
        await result.current.executeRequest(mockRequestFn);
      });

      // Valores por defecto: maxRetries: 3, baseDelay: 1000
      expect(retryWithBackoff).toHaveBeenCalledWith(mockRequestFn, 3, 1000);
    });
  });
});
