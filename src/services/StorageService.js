import AsyncStorage from '@react-native-async-storage/async-storage';
import { reportAppError } from '../config/sentry';

const reportStorageError = (error, operation, keyOrKeys) => {
  reportAppError(error, {
    flow: 'local_storage',
    module: 'StorageService',
    step: operation,
    critical: false,
    storage_key:
      Array.isArray(keyOrKeys) ? keyOrKeys.map(String).slice(0, 20) : String(keyOrKeys || ''),
  });
};

/**
 * Liskov Substitution Principle (LSP):
 * Al definir un contrato consistente (getItem, setItem, removeItem, etc.),
 * nos aseguramos de que los módulos de orden superior (como useSplashInit o notifications)
 * no conozcan los detalles concretos de AsyncStorage de React Native.
 * Si mañana queremos sustituir (sustitución de Liskov) AsyncStorage por un motor
 * sincrónico más rápido como MMKV o SQLite, la aplicación ni se inmutará,
 * siempre que la nueva implementación respete esta firma.
 */
export const StorageService = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      reportStorageError(e, 'getItem', key);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      reportStorageError(e, 'setItem', key);
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      reportStorageError(e, 'removeItem', key);
    }
  },

  multiGet: async (keys) => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (e) {
      reportStorageError(e, 'multiGet', keys);
      return [];
    }
  }
};
