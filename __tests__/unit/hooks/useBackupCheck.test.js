/**
 * Tests for useBackupCheck hook
 * Tests del hook de verificación de backup
 */

import {renderHook, act, waitFor} from '@testing-library/react-native';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(callback => {
    // Ejecutar el callback inmediatamente para simular focus
    callback();
  }),
}));

describe('useBackupCheck hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Estado Inicial', () => {
    it('inicializa hasBackup como true por defecto', () => {
      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      // El valor inicial es true según el código
      expect(result.current.hasBackup).toBe(true);
    });

    it('retorna función checkBackupAsStored', () => {
      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      expect(typeof result.current.checkBackupAsStored).toBe('function');
    });
  });

  describe('Verificación de Backup', () => {
    it('establece hasBackup en true si existe backup', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce('true');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(true);
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('account_backup');
    });

    it('establece hasBackup en false si no existe backup', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(false);
      });
    });

    it('establece hasBackup en false si hay error al verificar', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking backup:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('checkBackupAsStored', () => {
    it('guarda backup y establece hasBackup en true', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await act(async () => {
        await result.current.checkBackupAsStored();
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('account_backup', 'true');
      expect(result.current.hasBackup).toBe(true);
    });

    it('maneja error al guardar backup', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await act(async () => {
        await result.current.checkBackupAsStored();
      });

      expect(result.current.hasBackup).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error setting backup:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('useFocusEffect', () => {
    it('verifica backup cuando la pantalla gana focus', () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const {useFocusEffect} = require('@react-navigation/native');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      renderHook(() => useBackupCheck());

      // useFocusEffect debería haber sido llamado
      expect(useFocusEffect).toHaveBeenCalled();

      // Y debería haber verificado el backup
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('account_backup');
    });
  });

  describe('Valores Truthy/Falsy', () => {
    it('trata string vacío como false', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce('');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(false);
      });
    });

    it('trata cualquier string no vacío como true', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce('any_value');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(true);
      });
    });
  });
});
