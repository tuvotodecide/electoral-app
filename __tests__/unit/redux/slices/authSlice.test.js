/**
 * Tests comprehensivos para authSlice
 * 
 * Este archivo contiene tests que verifican:
 * - Estado inicial del slice
 * - Todos los reducers y acciones
 * - Mutaciones de estado
 * - Edge cases y validaciones
 * - Tipos de datos y estructura del estado
 * - Inmutabilidad del estado
 */

import authSlice, { 
  setAuthenticated, 
  setPendingNav, 
  clearAuth 
} from '../../../../src/redux/slices/authSlice';

describe('authSlice - Tests Comprehensivos', () => {
  
  describe('🏗️ Estado Inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      const initialState = authSlice(undefined, { type: 'unknown' });
      
      expect(initialState).toEqual({
        isAuthenticated: false,
        pendingNav: null,
      });
    });

    it('debe mantener tipos correctos en estado inicial', () => {
      const initialState = authSlice(undefined, { type: 'unknown' });
      
      expect(typeof initialState.isAuthenticated).toBe('boolean');
      expect(initialState.pendingNav).toBe(null);
    });

    it('debe ser inmutable el estado inicial', () => {
      const initialState = authSlice(undefined, { type: 'unknown' });
      const originalState = { ...initialState };
      
      // Intentar mutar (esto no debería afectar el estado real)
      initialState.isAuthenticated = true;
      
      const newState = authSlice(undefined, { type: 'unknown' });
      expect(newState).toEqual(originalState);
    });
  });

  describe('🔐 Acción setAuthenticated', () => {
    it('debe establecer autenticación como true', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      const action = setAuthenticated(true);
      const newState = authSlice(initialState, action);

      expect(newState.isAuthenticated).toBe(true);
      expect(newState.pendingNav).toBe(null); // No debe cambiar
    });

    it('debe establecer autenticación como false', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: 'SomeScreen',
      };

      const action = setAuthenticated(false);
      const newState = authSlice(initialState, action);

      expect(newState.isAuthenticated).toBe(false);
      expect(newState.pendingNav).toBe('SomeScreen'); // No debe cambiar
    });

    it('debe manejar valores truthy/falsy correctamente', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      // Valores truthy
      expect(authSlice(initialState, setAuthenticated(1)).isAuthenticated).toBe(1);
      expect(authSlice(initialState, setAuthenticated('yes')).isAuthenticated).toBe('yes');
      expect(authSlice(initialState, setAuthenticated({})).isAuthenticated).toEqual({});

      // Valores falsy
      expect(authSlice(initialState, setAuthenticated(0)).isAuthenticated).toBe(0);
      expect(authSlice(initialState, setAuthenticated('')).isAuthenticated).toBe('');
      expect(authSlice(initialState, setAuthenticated(null)).isAuthenticated).toBe(null);
    });

    it('debe preservar inmutabilidad del estado', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      const action = setAuthenticated(true);
      const newState = authSlice(initialState, action);

      // El estado original no debe cambiar
      expect(initialState.isAuthenticated).toBe(false);
      
      // El nuevo estado debe ser diferente objeto
      expect(newState).not.toBe(initialState);
      expect(newState.isAuthenticated).toBe(true);
    });

    it('debe crear la acción correcta', () => {
      const action = setAuthenticated(true);
      
      expect(action).toEqual({
        type: 'auth/setAuthenticated',
        payload: true,
      });
    });
  });

  describe('🧭 Acción setPendingNav', () => {
    it('debe establecer navegación pendiente con string', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      const action = setPendingNav('HomeScreen');
      const newState = authSlice(initialState, action);

      expect(newState.pendingNav).toBe('HomeScreen');
      expect(newState.isAuthenticated).toBe(false); // No debe cambiar
    });

    it('debe establecer navegación pendiente como null', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: 'SomeScreen',
      };

      const action = setPendingNav(null);
      const newState = authSlice(initialState, action);

      expect(newState.pendingNav).toBe(null);
      expect(newState.isAuthenticated).toBe(true); // No debe cambiar
    });

    it('debe manejar diferentes tipos de datos', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      // String
      expect(authSlice(initialState, setPendingNav('Screen1')).pendingNav).toBe('Screen1');
      
      // Object
      const navObject = { screen: 'Home', params: { id: 1 } };
      expect(authSlice(initialState, setPendingNav(navObject)).pendingNav).toEqual(navObject);
      
      // Array
      const navArray = ['Screen1', 'Screen2'];
      expect(authSlice(initialState, setPendingNav(navArray)).pendingNav).toEqual(navArray);
      
      // Number
      expect(authSlice(initialState, setPendingNav(123)).pendingNav).toBe(123);
      
      // Boolean
      expect(authSlice(initialState, setPendingNav(false)).pendingNav).toBe(false);
    });

    it('debe sobrescribir navegación pendiente existente', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: 'OldScreen',
      };

      const action = setPendingNav('NewScreen');
      const newState = authSlice(initialState, action);

      expect(newState.pendingNav).toBe('NewScreen');
    });

    it('debe preservar inmutabilidad del estado', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: null,
      };

      const action = setPendingNav('TestScreen');
      const newState = authSlice(initialState, action);

      // El estado original no debe cambiar
      expect(initialState.pendingNav).toBe(null);
      
      // El nuevo estado debe ser diferente objeto
      expect(newState).not.toBe(initialState);
      expect(newState.pendingNav).toBe('TestScreen');
    });

    it('debe crear la acción correcta', () => {
      const screenName = 'ProfileScreen';
      const action = setPendingNav(screenName);
      
      expect(action).toEqual({
        type: 'auth/setPendingNav',
        payload: screenName,
      });
    });
  });

  describe('🗑️ Acción clearAuth', () => {
    it('debe limpiar completamente el estado de autenticación', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: 'SomeScreen',
      };

      const action = clearAuth();
      const newState = authSlice(initialState, action);

      expect(newState).toEqual({
        isAuthenticated: false,
        pendingNav: null,
      });
    });

    it('debe funcionar cuando el estado ya está limpio', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      const action = clearAuth();
      const newState = authSlice(initialState, action);

      expect(newState).toEqual({
        isAuthenticated: false,
        pendingNav: null,
      });
    });

    it('debe resetear sin importar el estado previo', () => {
      const complexState = {
        isAuthenticated: true,
        pendingNav: {
          screen: 'ComplexScreen',
          params: { userId: 123, data: [1, 2, 3] }
        },
      };

      const action = clearAuth();
      const newState = authSlice(complexState, action);

      expect(newState).toEqual({
        isAuthenticated: false,
        pendingNav: null,
      });
    });

    it('debe preservar inmutabilidad del estado', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: 'TestScreen',
      };

      const action = clearAuth();
      const newState = authSlice(initialState, action);

      // El estado original no debe cambiar
      expect(initialState.isAuthenticated).toBe(true);
      expect(initialState.pendingNav).toBe('TestScreen');
      
      // El nuevo estado debe ser diferente objeto
      expect(newState).not.toBe(initialState);
    });

    it('debe crear la acción correcta sin payload', () => {
      const action = clearAuth();
      
      expect(action).toEqual({
        type: 'auth/clearAuth',
        payload: undefined,
      });
    });
  });

  describe('🔗 Acciones Encadenadas', () => {
    it('debe manejar secuencia de setAuthenticated -> setPendingNav', () => {
      let state = authSlice(undefined, { type: 'unknown' });
      
      // Autenticar usuario
      state = authSlice(state, setAuthenticated(true));
      expect(state.isAuthenticated).toBe(true);
      
      // Establecer navegación pendiente
      state = authSlice(state, setPendingNav('Dashboard'));
      expect(state.pendingNav).toBe('Dashboard');
      expect(state.isAuthenticated).toBe(true); // Debe mantenerse
    });

    it('debe manejar secuencia setPendingNav -> setAuthenticated', () => {
      let state = authSlice(undefined, { type: 'unknown' });
      
      // Establecer navegación antes de autenticar
      state = authSlice(state, setPendingNav('Profile'));
      expect(state.pendingNav).toBe('Profile');
      expect(state.isAuthenticated).toBe(false);
      
      // Autenticar usuario
      state = authSlice(state, setAuthenticated(true));
      expect(state.isAuthenticated).toBe(true);
      expect(state.pendingNav).toBe('Profile'); // Debe mantenerse
    });

    it('debe manejar múltiples cambios y clearAuth final', () => {
      let state = authSlice(undefined, { type: 'unknown' });
      
      // Secuencia de cambios
      state = authSlice(state, setAuthenticated(true));
      state = authSlice(state, setPendingNav('Screen1'));
      state = authSlice(state, setPendingNav('Screen2'));
      state = authSlice(state, setAuthenticated(false));
      state = authSlice(state, setPendingNav('Screen3'));
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.pendingNav).toBe('Screen3');
      
      // Limpiar todo
      state = authSlice(state, clearAuth());
      expect(state).toEqual({
        isAuthenticated: false,
        pendingNav: null,
      });
    });
  });

  describe('🛡️ Edge Cases y Validaciones', () => {
    it('debe manejar acciones con payload undefined', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      // setAuthenticated con undefined
      const authAction = { type: 'auth/setAuthenticated', payload: undefined };
      const authState = authSlice(initialState, authAction);
      expect(authState.isAuthenticated).toBe(undefined);

      // setPendingNav con undefined
      const navAction = { type: 'auth/setPendingNav', payload: undefined };
      const navState = authSlice(initialState, navAction);
      expect(navState.pendingNav).toBe(undefined);
    });

    it('debe manejar acciones desconocidas', () => {
      const initialState = {
        isAuthenticated: true,
        pendingNav: 'TestScreen',
      };

      const unknownAction = { type: 'unknown/action', payload: 'test' };
      const newState = authSlice(initialState, unknownAction);

      // El estado no debe cambiar
      expect(newState).toEqual(initialState);
    });

    it('debe manejar estado inicial undefined', () => {
      const action = setAuthenticated(true);
      const newState = authSlice(undefined, action);

      expect(newState.isAuthenticated).toBe(true);
      expect(newState.pendingNav).toBe(null);
    });

    it('debe manejar payloads complejos', () => {
      const initialState = {
        isAuthenticated: false,
        pendingNav: null,
      };

      const complexPayload = {
        screen: 'DetailScreen',
        params: {
          id: 123,
          data: { user: { name: 'Test', roles: ['admin', 'user'] } },
          timestamp: new Date().toISOString(),
        },
        metadata: {
          source: 'deeplink',
          analytics: true,
        }
      };

      const action = setPendingNav(complexPayload);
      const newState = authSlice(initialState, action);

      expect(newState.pendingNav).toEqual(complexPayload);
    });
  });

  describe('🎯 Casos de Uso Reales', () => {
    it('debe simular flujo de login completo', () => {
      let state = authSlice(undefined, { type: 'unknown' });
      
      // 1. Usuario intenta acceder a pantalla protegida
      state = authSlice(state, setPendingNav('ProtectedScreen'));
      expect(state.isAuthenticated).toBe(false);
      expect(state.pendingNav).toBe('ProtectedScreen');
      
      // 2. Usuario se autentica exitosamente
      state = authSlice(state, setAuthenticated(true));
      expect(state.isAuthenticated).toBe(true);
      expect(state.pendingNav).toBe('ProtectedScreen');
      
      // 3. Navegar a pantalla pendiente y limpiar
      state = authSlice(state, setPendingNav(null));
      expect(state.isAuthenticated).toBe(true);
      expect(state.pendingNav).toBe(null);
    });

    it('debe simular flujo de logout', () => {
      let state = {
        isAuthenticated: true,
        pendingNav: 'SomeScreen',
      };
      
      // Usuario hace logout
      state = authSlice(state, clearAuth());
      
      expect(state).toEqual({
        isAuthenticated: false,
        pendingNav: null,
      });
    });

    it('debe simular navegación con deep linking', () => {
      let state = authSlice(undefined, { type: 'unknown' });
      
      // Deep link mientras usuario no está autenticado
      const deepLinkNav = {
        screen: 'UserProfile',
        params: { userId: 123 },
        source: 'deeplink'
      };
      
      state = authSlice(state, setPendingNav(deepLinkNav));
      expect(state.pendingNav).toEqual(deepLinkNav);
      
      // Usuario se autentica
      state = authSlice(state, setAuthenticated(true));
      expect(state.pendingNav).toEqual(deepLinkNav); // Debe mantenerse
    });

    it('debe simular recuperación de sesión', () => {
      let state = authSlice(undefined, { type: 'unknown' });
      
      // Simular carga de sesión guardada
      state = authSlice(state, setAuthenticated(true));
      
      // Si hay navegación pendiente de sesión anterior
      state = authSlice(state, setPendingNav('RestoreScreen'));
      
      expect(state.isAuthenticated).toBe(true);
      expect(state.pendingNav).toBe('RestoreScreen');
    });
  });
});
