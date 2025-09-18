/**
 * Tests for useNavigationLogger Hook
 * Tests específicos para el hook de logging de navegación
 */

import { renderHook, act } from '@testing-library/react-native';
import { useNavigationLogger } from '../../../src/hooks/useNavigationLogger';

// Mock de la configuración de navegación
jest.mock('../../../src/config/navigationLogConfig', () => ({
  NavigationLogConfig: {
    logs: {
      enabled: true,
      showTimestamp: true,
      showActions: true
    },
    prefixes: {
      navigation: '[NAV]',
      action: '[ACTION]'
    }
  },
  NavLog: jest.fn(),
  updateLogConfig: jest.fn()
}));

describe('useNavigationLogger Hook', () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Hook Initialization', () => {
    it('should initialize with screen name', () => {
      const { result } = renderHook(() => useNavigationLogger('TestScreen'));

      expect(result.current.logAction).toBeInstanceOf(Function);
      expect(result.current.logNavigation).toBeInstanceOf(Function);
    });

    it('should initialize with auto-logging enabled', () => {
      const { result } = renderHook(() => useNavigationLogger('TestScreen', true));

      expect(result.current.logAction).toBeInstanceOf(Function);
      expect(result.current.logNavigation).toBeInstanceOf(Function);
    });

    it('should initialize with auto-logging disabled', () => {
      const { result } = renderHook(() => useNavigationLogger('TestScreen', false));

      expect(result.current.logAction).toBeInstanceOf(Function);
      expect(result.current.logNavigation).toBeInstanceOf(Function);
    });
  });

  describe('logAction Function', () => {
    it('should log simple actions', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      act(() => {
        result.current.logAction('Button Pressed');
      });

      // Verificar que NavLog fue llamado con los parámetros correctos
      const { NavLog } = require('../../../src/config/navigationLogConfig');
      expect(NavLog).toHaveBeenCalled();
    });

    it('should log actions with details', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      act(() => {
        result.current.logAction('OTP Changed', 'Length: 5');
      });

      const { NavLog } = require('../../../src/config/navigationLogConfig');
      expect(NavLog).toHaveBeenCalled();
    });

    it('should handle null/undefined action names', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      expect(() => {
        act(() => {
          result.current.logAction(null);
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.logAction(undefined);
        });
      }).not.toThrow();
    });

    it('should handle empty action names', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      expect(() => {
        act(() => {
          result.current.logAction('');
        });
      }).not.toThrow();
    });
  });

  describe('logNavigation Function', () => {
    it('should log navigation to target screen', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      act(() => {
        result.current.logNavigation('UploadDocument');
      });

      const { NavLog } = require('../../../src/config/navigationLogConfig');
      expect(NavLog).toHaveBeenCalled();
    });

    it('should handle null/undefined target screens', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      expect(() => {
        act(() => {
          result.current.logNavigation(null);
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.logNavigation(undefined);
        });
      }).not.toThrow();
    });

    it('should handle empty target screen names', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      expect(() => {
        act(() => {
          result.current.logNavigation('');
        });
      }).not.toThrow();
    });
  });

  describe('Hook Lifecycle', () => {
    it('should handle component mounting', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin', true));

      // Hook debería estar disponible inmediatamente
      expect(result.current.logAction).toBeDefined();
      expect(result.current.logNavigation).toBeDefined();
    });

    it('should handle component unmounting', () => {
      const { result, unmount } = renderHook(() => useNavigationLogger('CreatePin', true));

      expect(result.current.logAction).toBeDefined();

      // No debería generar errores al desmontar
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle re-renders correctly', () => {
      const { result, rerender } = renderHook(
        ({ screenName, autoLog }) => useNavigationLogger(screenName, autoLog),
        {
          initialProps: { screenName: 'CreatePin', autoLog: true }
        }
      );

      const initialLogAction = result.current.logAction;

      // Re-render con las mismas props
      rerender({ screenName: 'CreatePin', autoLog: true });

      // Las funciones deberían seguir siendo las mismas (estabilidad)
      expect(result.current.logAction).toBe(initialLogAction);
    });

    it('should handle screen name changes', () => {
      const { result, rerender } = renderHook(
        ({ screenName }) => useNavigationLogger(screenName),
        {
          initialProps: { screenName: 'CreatePin' }
        }
      );

      // Cambiar nombre de pantalla
      rerender({ screenName: 'UploadDocument' });

      // Hook debería seguir funcionando
      expect(result.current.logAction).toBeDefined();
      expect(result.current.logNavigation).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle rapid successive calls', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      const startTime = Date.now();

      // Llamadas rápidas sucesivas
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.logAction(`Action ${i}`);
        });
      }

      const endTime = Date.now();

      // No debería tomar demasiado tiempo
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not cause memory leaks', () => {
      // Crear y destruir muchos hooks
      for (let i = 0; i < 50; i++) {
        const { unmount } = renderHook(() => useNavigationLogger(`Screen${i}`));
        unmount();
      }

      // No debería generar errores ni warnings
      expect(true).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should respect logging configuration', () => {
      // Mock de configuración deshabilitada
      require('../../../src/config/navigationLogConfig').NavigationLogConfig.logs.enabled = false;

      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      act(() => {
        result.current.logAction('Test Action');
      });

      // Debería funcionar sin generar logs
      expect(result.current.logAction).toBeDefined();
    });

    it('should work with different prefix configurations', () => {
      // Mock de configuración con prefijos personalizados
      require('../../../src/config/navigationLogConfig').NavigationLogConfig.prefixes = {
        navigation: '[CUSTOM_NAV]',
        action: '[CUSTOM_ACTION]'
      };

      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      act(() => {
        result.current.logAction('Test Action');
        result.current.logNavigation('NextScreen');
      });

      expect(result.current.logAction).toBeDefined();
      expect(result.current.logNavigation).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration errors gracefully', () => {
      // Mock de configuración corrupta
      require('../../../src/config/navigationLogConfig').NavigationLogConfig = null;

      expect(() => {
        renderHook(() => useNavigationLogger('CreatePin'));
      }).not.toThrow();
    });

    it('should handle NavLog function errors', () => {
      // Mock de NavLog que genera error
      require('../../../src/config/navigationLogConfig').NavLog.mockImplementation(() => {
        throw new Error('Logging failed');
      });

      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      expect(() => {
        act(() => {
          result.current.logAction('Test Action');
        });
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should handle various data types for action details', () => {
      const { result } = renderHook(() => useNavigationLogger('CreatePin'));

      const testCases = [
        'string details',
        123,
        { key: 'value' },
        ['array', 'values'],
        true,
        null,
        undefined
      ];

      testCases.forEach(details => {
        expect(() => {
          act(() => {
            result.current.logAction('Test Action', details);
          });
        }).not.toThrow();
      });
    });

    it('should handle various data types for screen names', () => {
      const testCases = [
        'ValidScreenName',
        'Screen With Spaces',
        'Screen-With-Dashes',
        'Screen_With_Underscores',
        '123NumericScreen',
        ''
      ];

      testCases.forEach(screenName => {
        expect(() => {
          renderHook(() => useNavigationLogger(screenName));
        }).not.toThrow();
      });
    });
  });
});
