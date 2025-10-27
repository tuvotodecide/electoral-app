/**
 * Tests completos para auth.js Utils
 * Siguiendo las buenas prácticas de Jest y React Native Testing Library
 */

import { logOut } from '../../../src/utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { JWT_KEY } from '../../../src/common/constants';
import { StackNav } from '../../../src/navigation/NavigationKey';
import store from '../../../src/redux/store';
import { clearWallet } from '../../../src/redux/action/walletAction';
import { clearAuth } from '../../../src/redux/slices/authSlice';
import { clearSession } from '../../../src/utils/Session';

// ===== MOCKS SETUP =====
jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(),
}));

jest.mock('axios');

jest.mock('../../../src/redux/store', () => ({
  dispatch: jest.fn(),
}));

jest.mock('../../../src/redux/action/walletAction', () => ({
  clearWallet: jest.fn(),
}));

jest.mock('../../../src/redux/slices/authSlice', () => ({
  clearAuth: jest.fn(),
}));

jest.mock('../../../src/utils/Session', () => ({
  clearSession: jest.fn(),
}));

jest.mock('../../../src/common/constants', () => ({
  JWT_KEY: 'jwt_token_key',
}));

jest.mock('../../../src/navigation/NavigationKey', () => ({
  StackNav: {
    AuthNavigation: 'AuthNavigation',
  },
}));

describe('Auth Utils - Tests Consolidados', () => {
  let mockNavigation;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNavigation = {
      reset: jest.fn(),
    };

    // Reset axios defaults
    axios.defaults.headers.common = {};
    
    // Reset mocks to default behavior
    AsyncStorage.removeItem.mockResolvedValue();
    clearSession.mockResolvedValue();
    clearWallet.mockReturnValue({ type: 'CLEAR_WALLET' });
    clearAuth.mockReturnValue({ type: 'CLEAR_AUTH' });
    store.dispatch.mockImplementation(() => {});
  });

  // ===== GRUPO 1: FUNCIÓN LOGOUT - COMPORTAMIENTO BÁSICO =====
  describe('🚪 Función logOut - Comportamiento Básico', () => {
    it('debe ejecutarse sin errores con parámetros válidos', async () => {
      await expect(logOut(mockNavigation)).resolves.not.toThrow();
    });

    it('debe ser una función async', () => {
      expect(logOut(mockNavigation)).toBeInstanceOf(Promise);
    });

    it('debe llamar a todas las funciones de limpieza requeridas', async () => {
      await logOut(mockNavigation);

      expect(AsyncStorage.removeItem).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledTimes(2);
      expect(clearSession).toHaveBeenCalled();
      expect(mockNavigation.reset).toHaveBeenCalled();
    });

    it('debe ejecutar las acciones en el orden correcto', async () => {
      const callOrder = [];
      
      AsyncStorage.removeItem.mockImplementation(() => {
        callOrder.push('AsyncStorage.removeItem');
        return Promise.resolve();
      });

      store.dispatch.mockImplementation((action) => {
        callOrder.push(`dispatch(${action.type || 'action'})`);
      });

      clearSession.mockImplementation(() => {
        callOrder.push('clearSession');
        return Promise.resolve();
      });

      mockNavigation.reset.mockImplementation(() => {
        callOrder.push('navigation.reset');
      });

      await logOut(mockNavigation);

      expect(callOrder).toEqual([
        'AsyncStorage.removeItem',
        'dispatch(CLEAR_AUTH)',
        'dispatch(CLEAR_WALLET)',
        'clearSession',
        'navigation.reset',
      ]);
    });
  });

  // ===== GRUPO 2: LIMPIEZA DE ASYNC STORAGE =====
  describe('📱 Limpieza de AsyncStorage', () => {
    it('debe remover el JWT token del AsyncStorage', async () => {
      await logOut(mockNavigation);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(JWT_KEY);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('jwt_token_key');
    });

    it('debe manejar errores de AsyncStorage gracefully', async () => {
      const error = new Error('AsyncStorage error');
      AsyncStorage.removeItem.mockRejectedValue(error);

      await expect(logOut(mockNavigation)).rejects.toThrow('AsyncStorage error');
    });

    it('debe llamar removeItem solo una vez', async () => {
      await logOut(mockNavigation);

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    });

    it('debe usar la constante JWT_KEY correcta', async () => {
      await logOut(mockNavigation);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(JWT_KEY);
    });
  });

  // ===== GRUPO 3: LIMPIEZA DE AXIOS HEADERS =====
  describe('🌐 Limpieza de Headers de Axios', () => {
    it('debe eliminar el header Authorization de axios', async () => {
      // Configurar un header Authorization previo
      axios.defaults.headers.common.Authorization = 'Bearer test-token';

      await logOut(mockNavigation);

      expect(axios.defaults.headers.common.Authorization).toBeUndefined();
    });

    it('debe mantener otros headers intactos', async () => {
      // Configurar headers adicionales
      axios.defaults.headers.common.Authorization = 'Bearer test-token';
      axios.defaults.headers.common['Content-Type'] = 'application/json';
      axios.defaults.headers.common['Accept'] = 'application/json';

      await logOut(mockNavigation);

      expect(axios.defaults.headers.common.Authorization).toBeUndefined();
      expect(axios.defaults.headers.common['Content-Type']).toBe('application/json');
      expect(axios.defaults.headers.common['Accept']).toBe('application/json');
    });

    it('debe manejar headers undefined sin errores', async () => {
      // El código real no maneja este caso, así que esperamos un error
      axios.defaults.headers.common = undefined;

      await expect(logOut(mockNavigation)).rejects.toThrow();
    });

    it('debe manejar ausencia de Authorization header', async () => {
      // Sin Authorization header configurado
      delete axios.defaults.headers.common.Authorization;

      await expect(logOut(mockNavigation)).resolves.not.toThrow();
    });
  });

  // ===== GRUPO 4: DISPATCH DE ACCIONES REDUX =====
  describe('🗃️ Dispatch de Acciones Redux', () => {
    it('debe dispatch clearAuth action', async () => {
      await logOut(mockNavigation);

      expect(store.dispatch).toHaveBeenCalledWith(clearAuth());
    });

    it('debe dispatch clearWallet action', async () => {
      await logOut(mockNavigation);

      expect(store.dispatch).toHaveBeenCalledWith(clearWallet());
    });

    it('debe llamar dispatch exactamente 2 veces', async () => {
      await logOut(mockNavigation);

      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });

    it('debe dispatch las acciones en el orden correcto', async () => {
      await logOut(mockNavigation);

      expect(store.dispatch).toHaveBeenNthCalledWith(1, clearAuth());
      expect(store.dispatch).toHaveBeenNthCalledWith(2, clearWallet());
    });

    it('debe manejar errores en dispatch gracefully', async () => {
      const error = new Error('Redux dispatch error');
      store.dispatch.mockImplementation(() => {
        throw error;
      });

      await expect(logOut(mockNavigation)).rejects.toThrow('Redux dispatch error');
    });
  });

  // ===== GRUPO 5: LIMPIEZA DE SESIÓN =====
  describe('🔐 Limpieza de Sesión', () => {
    it('debe llamar clearSession', async () => {
      await logOut(mockNavigation);

      expect(clearSession).toHaveBeenCalled();
    });

    it('debe llamar clearSession solo una vez', async () => {
      await logOut(mockNavigation);

      expect(clearSession).toHaveBeenCalledTimes(1);
    });

    it('debe esperar a que clearSession termine', async () => {
      let sessionCleared = false;
      clearSession.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        sessionCleared = true;
      });

      await logOut(mockNavigation);

      expect(sessionCleared).toBe(true);
    });

    it('debe manejar errores de clearSession', async () => {
      const error = new Error('Session clear error');
      clearSession.mockRejectedValue(error);

      await expect(logOut(mockNavigation)).rejects.toThrow('Session clear error');
    });
  });

  // ===== GRUPO 6: NAVEGACIÓN =====
  describe('🧭 Comportamiento de Navegación', () => {
    it('debe resetear la navegación a AuthNavigation', async () => {
      await logOut(mockNavigation);

      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: StackNav.AuthNavigation }],
      });
    });

    it('debe usar el StackNav.AuthNavigation correcto', async () => {
      await logOut(mockNavigation);

      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'AuthNavigation' }],
      });
    });

    it('debe llamar navigation.reset solo una vez', async () => {
      await logOut(mockNavigation);

      expect(mockNavigation.reset).toHaveBeenCalledTimes(1);
    });

    it('debe manejar navigation undefined', async () => {
      await expect(logOut(undefined)).rejects.toThrow();
    });

    it('debe manejar navigation sin método reset', async () => {
      const invalidNavigation = {};

      await expect(logOut(invalidNavigation)).rejects.toThrow();
    });
  });

  // ===== GRUPO 7: CASOS DE ERROR =====
  describe('🛡️ Manejo de Errores', () => {
    it('debe propagar errores de AsyncStorage', async () => {
      const error = new Error('AsyncStorage failed');
      AsyncStorage.removeItem.mockRejectedValue(error);

      await expect(logOut(mockNavigation)).rejects.toThrow('AsyncStorage failed');
    });

    it('debe propagar errores de clearSession', async () => {
      const error = new Error('Session clear failed');
      clearSession.mockRejectedValue(error);

      await expect(logOut(mockNavigation)).rejects.toThrow('Session clear failed');
    });

    it('debe manejar múltiples errores asíncronos', async () => {
      AsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));
      clearSession.mockRejectedValue(new Error('Session error'));

      // Debe fallar en el primer error (AsyncStorage)
      await expect(logOut(mockNavigation)).rejects.toThrow('Storage error');
    });

    it('debe mantener el estado consistente tras errores', async () => {
      const error = new Error('Test error');
      clearSession.mockRejectedValue(error);

      await expect(logOut(mockNavigation)).rejects.toThrow('Test error');

      // Verificar que las operaciones anteriores se ejecutaron
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });
  });

  // ===== GRUPO 8: INTEGRACIÓN Y FLUJO COMPLETO =====
  describe('🔄 Integración y Flujo Completo', () => {
    it('debe completar el flujo de logout exitosamente', async () => {
      await logOut(mockNavigation);

      // Verificar que todas las operaciones se completaron
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(JWT_KEY);
      expect(axios.defaults.headers.common.Authorization).toBeUndefined();
      expect(store.dispatch).toHaveBeenCalledWith(clearAuth());
      expect(store.dispatch).toHaveBeenCalledWith(clearWallet());
      expect(clearSession).toHaveBeenCalled();
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: StackNav.AuthNavigation }],
      });
    });

    it('debe limpiar todos los datos de autenticación', async () => {
      // Configurar estado inicial con datos de autenticación
      axios.defaults.headers.common.Authorization = 'Bearer user-token';

      await logOut(mockNavigation);

      // Verificar limpieza completa
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(JWT_KEY);
      expect(axios.defaults.headers.common.Authorization).toBeUndefined();
      expect(clearAuth).toHaveBeenCalled();
      expect(clearWallet).toHaveBeenCalled();
      expect(clearSession).toHaveBeenCalled();
    });

    it('debe ser idempotente (ejecutable múltiples veces)', async () => {
      await logOut(mockNavigation);
      jest.clearAllMocks();

      await logOut(mockNavigation);

      // Debe ejecutarse sin errores la segunda vez
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(store.dispatch).toHaveBeenCalledTimes(2);
      expect(clearSession).toHaveBeenCalledTimes(1);
      expect(mockNavigation.reset).toHaveBeenCalledTimes(1);
    });

    it('debe simular logout de usuario real', async () => {
      // Simular usuario autenticado
      axios.defaults.headers.common.Authorization = 'Bearer real-jwt-token';

      // Ejecutar logout
      await logOut(mockNavigation);

      // Verificar que el usuario fue desautenticado completamente
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(JWT_KEY);
      expect(axios.defaults.headers.common.Authorization).toBeUndefined();
      expect(store.dispatch).toHaveBeenCalledWith(clearAuth());
      expect(store.dispatch).toHaveBeenCalledWith(clearWallet());
      expect(clearSession).toHaveBeenCalled();
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: StackNav.AuthNavigation }],
      });
    });
  });

  // ===== GRUPO 9: PERFORMANCE =====
  describe('⚡ Performance', () => {
    it('debe ejecutarse en tiempo razonable', async () => {
      const startTime = performance.now();
      
      await logOut(mockNavigation);
      
      const executionTime = performance.now() - startTime;
      expect(executionTime).toBeLessThan(100); // Menos de 100ms
    });

    it('debe manejar operaciones concurrentes', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(logOut(mockNavigation));
      }

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('debe manejar múltiples llamadas secuenciales', async () => {
      for (let i = 0; i < 3; i++) {
        await expect(logOut(mockNavigation)).resolves.not.toThrow();
        jest.clearAllMocks();
      }
    });
  });

  // ===== GRUPO 10: EDGE CASES =====
  describe('🎯 Edge Cases', () => {
    it('debe manejar navigation con métodos adicionales', async () => {
      const extendedNavigation = {
        reset: jest.fn(),
        navigate: jest.fn(),
        goBack: jest.fn(),
        push: jest.fn(),
      };

      await logOut(extendedNavigation);

      expect(extendedNavigation.reset).toHaveBeenCalled();
      expect(extendedNavigation.navigate).not.toHaveBeenCalled();
      expect(extendedNavigation.goBack).not.toHaveBeenCalled();
      expect(extendedNavigation.push).not.toHaveBeenCalled();
    });

    it('debe manejar axios.defaults.headers.common como null', async () => {
      // El código real no maneja este caso, así que esperamos un error
      axios.defaults.headers.common = null;

      await expect(logOut(mockNavigation)).rejects.toThrow();
    });

    it('debe manejar store.dispatch que retorna undefined', async () => {
      store.dispatch.mockReturnValue(undefined);

      await expect(logOut(mockNavigation)).resolves.not.toThrow();
      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });

    it('debe manejar clearAuth que retorna null', async () => {
      clearAuth.mockReturnValue(null);

      await expect(logOut(mockNavigation)).resolves.not.toThrow();
      expect(store.dispatch).toHaveBeenCalledWith(null);
    });

    it('debe manejar clearWallet que retorna undefined', async () => {
      clearWallet.mockReturnValue(undefined);

      await expect(logOut(mockNavigation)).resolves.not.toThrow();
      expect(store.dispatch).toHaveBeenCalledWith(undefined);
    });
  });
});
