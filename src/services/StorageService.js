import AsyncStorage from '@react-native-async-storage/async-storage';

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
    } catch (_) {
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (_) {
      // Ignorar manejo de errores bajo nivel
    }
  },

  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (_) {
      // Ignorar errores
    }
  },

  multiGet: async (keys) => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (_) {
      return [];
    }
  }
};
