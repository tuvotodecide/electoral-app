import {renderHook} from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('../../../src/config/navigationLogConfig', () => {
  const NavigationLogConfig = {
    enabled: true,
    logs: {
      enabled: true,
      componentMount: true,
      userActions: true,
      routeParams: true,
      stateChanges: true,
      stackPath: true,
    },
  };

  return {
    NavigationLogConfig,
    navLog: jest.fn(),
    updateLogConfig: jest.fn(),
  };
});

const {useNavigation, useRoute} = require('@react-navigation/native');
const {useNavigationLogger} = require('../../../src/hooks/useNavigationLogger');
const configModule = require('../../../src/config/navigationLogConfig');

describe('useNavigationLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useNavigation.mockReturnValue({navigate: jest.fn()});
    useRoute.mockReturnValue({name: 'MockRoute', params: {}});

    configModule.NavigationLogConfig.enabled = true;
    configModule.NavigationLogConfig.logs = {
      enabled: true,
      componentMount: true,
      userActions: true,
      routeParams: true,
      stateChanges: true,
      stackPath: true,
    };
  });

  it('returns current screen name, route and navigation', () => {
    const navigationRef = {goBack: jest.fn()};
    const routeRef = {name: 'Connect', params: {from: 'test'}};

    useNavigation.mockReturnValue(navigationRef);
    useRoute.mockReturnValue(routeRef);

    const {result} = renderHook(() => useNavigationLogger(null, false, false));

    expect(result.current.currentScreenName).toBe('Connect');
    expect(result.current.navigation).toBe(navigationRef);
    expect(result.current.route).toBe(routeRef);
  });

  it('logs mount and unmount when logMount is true', () => {
    const {unmount} = renderHook(() => useNavigationLogger('CreatePin', false, true));

    expect(configModule.navLog).toHaveBeenCalledWith(
      'mount',
      'CreatePin - Componente montado',
      null,
    );

    unmount();

    expect(configModule.navLog).toHaveBeenCalledWith(
      'unmount',
      'CreatePin - Componente desmontado',
      null,
    );
  });

  it('logs params when enabled and params exist', () => {
    const routeWithParams = {name: 'OTPCode', params: {title: 'forgot'}};
    useRoute.mockReturnValue(routeWithParams);

    renderHook(() => useNavigationLogger(null, true, true));

    expect(configModule.navLog).toHaveBeenCalledWith('params', 'OTPCode:', routeWithParams.params);
  });

  it('does not log when logMount is false', () => {
    renderHook(() => useNavigationLogger('SilentScreen', true, false));

    expect(configModule.navLog).not.toHaveBeenCalled();
  });

  it('does not log when global logging is disabled', () => {
    configModule.NavigationLogConfig.enabled = false;

    renderHook(() => useNavigationLogger('DisabledScreen', true, true));

    expect(configModule.navLog).not.toHaveBeenCalled();
  });

  it('does not log mount events when componentMount config is disabled', () => {
    configModule.NavigationLogConfig.logs.componentMount = false;

    renderHook(() => useNavigationLogger('NoMountEvents', false, true));

    expect(configModule.navLog).not.toHaveBeenCalled();
  });

  it('handles navLog exceptions without throwing', () => {
    configModule.navLog.mockImplementation(() => {
      throw new Error('logger failed');
    });

    expect(() => {
      const {unmount} = renderHook(() => useNavigationLogger('SafeScreen', false, true));
      unmount();
    }).not.toThrow();
  });
});
