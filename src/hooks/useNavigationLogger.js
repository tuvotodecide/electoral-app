import { useCallback, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationLogConfig, navLog } from '../config/navigationLogConfig';

const LOG_TYPE_ALIASES = {
  mount: 'componentMount',
  unmount: 'componentMount',
  params: 'routeParams',
  action: 'userActions',
  navigate: 'userActions',
  screen: 'componentMount',
  stack: 'stackPath',
};

const DEFAULT_NAVIGATION_LOG_CONFIG = {
  enabled: true,
  logs: {
    enabled: true,
    componentMount: true,
    userActions: true,
    routeParams: false,
    stateChanges: true,
    stackPath: true,
  },
};

const NO_OP = () => {};

const getResolvedConfig = () => {
  if (NavigationLogConfig && typeof NavigationLogConfig === 'object') {
    return NavigationLogConfig;
  }
  return DEFAULT_NAVIGATION_LOG_CONFIG;
};

const getLogsConfig = (config) => {
  if (config && config.logs && typeof config.logs === 'object') {
    return config.logs;
  }
  return DEFAULT_NAVIGATION_LOG_CONFIG.logs;
};

const isGlobalLoggingEnabled = (config, logsConfig) => {
  const rootEnabled = typeof (config && config.enabled) === 'boolean'
    ? config.enabled
    : DEFAULT_NAVIGATION_LOG_CONFIG.enabled;

  const logsEnabled = typeof (logsConfig && logsConfig.enabled) === 'boolean'
    ? logsConfig.enabled
    : true;

  return rootEnabled && logsEnabled;
};

const resolveLogTypeKey = (type, logsConfig) => {
  if (logsConfig && Object.prototype.hasOwnProperty.call(logsConfig, type)) {
    return type;
  }
  const alias = LOG_TYPE_ALIASES[type];
  if (alias && logsConfig && Object.prototype.hasOwnProperty.call(logsConfig, alias)) {
    return alias;
  }
  return type;
};

const safeInvokeNavLog = (type, message, data) => {
  const config = getResolvedConfig();
  const logsConfig = getLogsConfig(config);

  if (!isGlobalLoggingEnabled(config, logsConfig)) {
    return;
  }

  const normalizedType = resolveLogTypeKey(type, logsConfig);

  const typeValue = logsConfig?.[normalizedType];
  if (typeof typeValue === 'boolean' && typeValue === false) {
    return;
  }

  const logger = typeof navLog === 'function' ? navLog : NO_OP;

  try {
    logger(type, message, data ?? null);
  } catch (error) {
    console.warn('[NavigationLogger] Error al registrar evento', error);
  }
};

/**
 * Hook personalizado para logging de navegación en componentes específicos
 * @param {string} screenName - Nombre de la pantalla (opcional, se auto-detecta)
 * @param {boolean} logParams - Si debe loggear parámetros (default: false)
 * @param {boolean} logMount - Si debe loggear al montar el componente (default: true)
 */
export const useNavigationLogger = (screenName = null, logParams = false, logMount = true) => {
  const navigation = useNavigation();
  const route = useRoute();

  const currentScreenName = screenName || route?.name || 'UnknownScreen';

  const logSafely = useCallback((type, message, data) => {
    if (!type || !message) {
      return;
    }
    safeInvokeNavLog(type, message, data);
  }, []);

  useEffect(() => {
    if (logMount) {
      logSafely('mount', `${currentScreenName} - Componente montado`);

      if (logParams && route?.params) {
        logSafely('params', `${currentScreenName}:`, route.params);
      }
    }

    // Cleanup cuando se desmonte el componente
    return () => {
      if (logMount) {
        logSafely('unmount', `${currentScreenName} - Componente desmontado`);
      }
    };
  }, [currentScreenName, logMount, logParams, logSafely, route?.params]);

  // Función helper para loggear acciones personalizadas
  const logAction = useCallback((action, data = null) => {
    if (!action) {
      return;
    }
    logSafely('action', `${currentScreenName} - ${action}`, data ?? null);
  }, [currentScreenName, logSafely]);

  // Función helper para loggear navegación desde el componente
  const logNavigation = useCallback((targetScreen, params = null) => {
    if (!targetScreen) {
      return;
    }
    logSafely('navigate', `${currentScreenName} -> ${targetScreen}`, params ?? null);
  }, [currentScreenName, logSafely]);

  return {
    currentScreenName,
    logAction,
    logNavigation,
    route,
    navigation
  };
};

/**
 * Hook simplificado solo para logging básico
 * @param {string} screenName - Nombre de la pantalla
 */
export const useScreenLogger = (screenName) => {
  useEffect(() => {
    if (!screenName) {
      return;
    }

    safeInvokeNavLog('screen', `${screenName} - Activa`);
  }, [screenName]);
};
