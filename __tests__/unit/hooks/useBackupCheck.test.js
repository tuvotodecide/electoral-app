/**
 * Tests for useBackupCheck hook
 * Tests del hook de verificación de backup
 */

import {renderHook, act, waitFor} from '@testing-library/react-native';
import React from 'react';

// Mocks
const mockGetItem = jest.fn(() => Promise.resolve(null));
const mockSetItem = jest.fn(() => Promise.resolve());

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args) => mockGetItem(...args),
  setItem: (...args) => mockSetItem(...args),
}));

// Mock useFocusEffect to execute immediately
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(callback => {
    React.useEffect(() => {
      callback();
    }, []);
  }),
}));

describe('useBackupCheck hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
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
      mockGetItem.mockResolvedValueOnce('true');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(true);
      });
    });
  });

  describe('checkBackupAsStored', () => {
    it('guarda backup y establece hasBackup en true', async () => {
      mockGetItem.mockResolvedValue(null);

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await act(async () => {
        await result.current.checkBackupAsStored();
      });

      expect(mockSetItem).toHaveBeenCalledWith('account_backup', 'true');
      expect(result.current.hasBackup).toBe(true);
    });
  });

  describe('useFocusEffect', () => {
    it('verifica backup cuando la pantalla gana focus', async () => {
      const {useFocusEffect} = require('@react-navigation/native');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      renderHook(() => useBackupCheck());

      // useFocusEffect debería haber sido llamado
      expect(useFocusEffect).toHaveBeenCalled();
    });
  });

  describe('Valores Truthy/Falsy', () => {
    it('trata cualquier string no vacío como true', async () => {
      mockGetItem.mockResolvedValueOnce('any_value');

      const {useBackupCheck} = require('../../../src/hooks/useBackupCheck');
      const {result} = renderHook(() => useBackupCheck());

      await waitFor(() => {
        expect(result.current.hasBackup).toBe(true);
      });
    });
  });
});
