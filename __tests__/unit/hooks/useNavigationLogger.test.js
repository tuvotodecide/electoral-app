/**
 * Tests for useNavigationLogger Hook
 * Tests específicos para el hook de logging de navegación
 */

import { renderHook, act } from '@testing-library/react-native';

jest.mock('../../../src/config/navigationLogConfig', () => {
  const defaultLogs = {
    enabled: true,
    componentMount: true,
    userActions: true,
    routeParams: true,
    stateChanges: true,
    stackPath: true,
  };

  const defaultPrefixes = {
    navigation: '[NAV]',
    action: '[ACTION]',
    mount: '[MOUNT]',
    unmount: '[UNMOUNT]',
    navigate: '[NAVIGATE]',
    params: '[PARAMS]',
    screen: '[SCREEN]',
    stack: '[STACK]',
  };

  const navLog = jest.fn();

  return {
    __esModule: true,
    NavigationLogConfig: {
      enabled: true,
      logs: { ...defaultLogs },
      prefixes: { ...defaultPrefixes },
    },
    navLog,
    updateLogConfig: jest.fn(),
    __TEST_DEFAULTS__: {
      defaultLogs,
      defaultPrefixes,
    },
  };
});

const { useNavigationLogger } = require('../../../src/hooks/useNavigationLogger');
const configModule = require('../../../src/config/navigationLogConfig');
const mockNavLog = configModule.navLog;

describe('useNavigationLogger Hook', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavLog.mockClear();

    const defaults = configModule.__TEST_DEFAULTS__;
    configModule.NavigationLogConfig.enabled = true;
    configModule.NavigationLogConfig.logs = { ...defaults.defaultLogs };
    configModule.NavigationLogConfig.prefixes = { ...defaults.defaultPrefixes };
  });

  it('debe exponer funciones establecidas y retornar datos básicos', () => {
    const { result, rerender } = renderHook(() => useNavigationLogger('TestScreen'));

    expect(result.current.currentScreenName).toBe('TestScreen');
    expect(typeof result.current.logAction).toBe('function');
    expect(typeof result.current.logNavigation).toBe('function');

    const initialLogAction = result.current.logAction;
    const initialLogNavigation = result.current.logNavigation;

    // Re-render con mismas props mantiene referencias
    rerender();

    expect(result.current.logAction).toBe(initialLogAction);
    expect(result.current.logNavigation).toBe(initialLogNavigation);
  });

  it('debe loggear acciones y navegación cuando el logging está habilitado', () => {
    const { result } = renderHook(() => useNavigationLogger('CreatePin'));

    act(() => {
      result.current.logAction('OTP Changed', 'Length: 5');
      result.current.logNavigation('UploadDocument', { step: 2 });
    });

    expect(mockNavLog).toHaveBeenCalledWith('action', 'CreatePin - OTP Changed', 'Length: 5');
    expect(mockNavLog).toHaveBeenCalledWith('navigate', 'CreatePin -> UploadDocument', { step: 2 });
  });

  it('debe ignorar acciones o navegación vacías sin lanzar errores', () => {
    const { result } = renderHook(() => useNavigationLogger('CreatePin'));

    const initialCallCount = mockNavLog.mock.calls.length;

    expect(() => {
      act(() => {
        result.current.logAction(null);
        result.current.logAction(undefined);
        result.current.logAction('');
        result.current.logNavigation(null);
        result.current.logNavigation(undefined);
        result.current.logNavigation('');
      });
    }).not.toThrow();

    expect(mockNavLog.mock.calls.length).toBe(initialCallCount);
  });

  it('debe registrar eventos de montaje y desmontaje cuando logMount es true', () => {
    const { unmount } = renderHook(() => useNavigationLogger('CreatePin', true, true));

    expect(mockNavLog).toHaveBeenCalledWith('mount', 'CreatePin - Componente montado', null);

    act(() => {
      unmount();
    });

    expect(mockNavLog).toHaveBeenCalledWith('unmount', 'CreatePin - Componente desmontado', null);
  });

  it('debe loggear parámetros cuando logParams es true y existen params en la ruta', () => {
    const routeParams = { id: 123, source: 'deeplink' };

    const nativeModule = require('@react-navigation/native');
    const routeSpy = jest.spyOn(nativeModule, 'useRoute').mockReturnValue({
      name: 'CreatePin',
      params: routeParams,
    });

    try {
      renderHook(() => useNavigationLogger(null, true, true));
      expect(mockNavLog).toHaveBeenCalledWith('params', 'CreatePin:', routeParams);
    } finally {
      routeSpy.mockRestore();
    }
  });

  it('no debe loggear cuando los logs globales están deshabilitados', () => {
    configModule.NavigationLogConfig.enabled = false;

    const { result } = renderHook(() => useNavigationLogger('CreatePin'));

    act(() => {
      result.current.logAction('ShouldNotLog');
    });

    expect(mockNavLog).not.toHaveBeenCalled();
  });

  it('no debe loggear cuando logs.enabled es false', () => {
    configModule.NavigationLogConfig.logs.enabled = false;

    const { result } = renderHook(() => useNavigationLogger('CreatePin'));

    act(() => {
      result.current.logAction('ShouldNotLog');
    });

    expect(mockNavLog).not.toHaveBeenCalled();
  });

  it('debe manejar errores internos de navLog sin lanzar excepciones', () => {
    mockNavLog.mockImplementation(() => {
      throw new Error('Logging failed');
    });

    const { result } = renderHook(() => useNavigationLogger('CreatePin'));

    expect(() => {
      act(() => {
        result.current.logAction('SafeAction');
      });
    }).not.toThrow();
  });

  it('debe tolerar configuraciones corruptas o nulas', () => {
  configModule.NavigationLogConfig.logs = null;
  configModule.NavigationLogConfig.prefixes = null;

    const { result } = renderHook(() => useNavigationLogger('CreatePin'));

    act(() => {
      result.current.logAction('FallbackAction');
    });

    expect(mockNavLog).toHaveBeenCalledWith('action', 'CreatePin - FallbackAction', null);
  });
});
