/**
 * Configuración para el sistema de logging de navegación
 */

export const NavigationLogConfig = {
  // Habilitar/deshabilitar logging global
  enabled: __DEV__, // Solo en desarrollo por defecto

  // Configuración de tipos de logs
  logs: {
    enabled: true,          // Habilitar/deshabilitar logs desde la configuración interna
    stateChanges: true,     // Cambios de estado de navegación
    componentMount: true,   // Montaje/desmontaje de componentes
    userActions: true,      // Acciones del usuario
    routeParams: false,     // Parámetros de las rutas (puede ser verbose)
    stackPath: true,        // Path completo del stack
  },

  // Configuración visual
  visual: {
    showOverlay: false,     // Mostrar overlay en pantalla
    overlayPosition: 'top-right', // Posición del overlay
  },
  
  // Prefijos para los logs
  prefixes: {
    navigation: '🚀 [NAVIGATION]',
    mount: '🎯 [MOUNT]',
    unmount: '🗑️ [UNMOUNT]',
    action: '⚡ [ACTION]',
    navigate: '🧭 [NAVIGATE]',
    screen: '📱 [SCREEN]',
    params: '📋 [PARAMS]',
    stack: '📍 [STACK]',
  }
};

/**
 * Función helper para logs condicionales
 */
const LOG_TYPE_ALIASES = {
  mount: 'componentMount',
  unmount: 'componentMount',
  action: 'userActions',
  navigate: 'userActions',
  params: 'routeParams',
  screen: 'componentMount',
  stack: 'stackPath',
};

export const navLog = (type, message, data = null) => {
  const config = NavigationLogConfig && typeof NavigationLogConfig === 'object'
    ? NavigationLogConfig
    : {};

  const logsConfig = config.logs && typeof config.logs === 'object'
    ? config.logs
    : {};

  const rootEnabled = typeof config.enabled === 'boolean' ? config.enabled : __DEV__;
  const nestedEnabled = typeof logsConfig.enabled === 'boolean' ? logsConfig.enabled : true;

  if (!rootEnabled || !nestedEnabled) {
    return;
  }

  const normalizedType = Object.prototype.hasOwnProperty.call(logsConfig, type)
    ? type
    : LOG_TYPE_ALIASES[type] || type;

  if (typeof logsConfig[normalizedType] === 'boolean' && logsConfig[normalizedType] === false) {
    return;
  }

  const prefixes = config.prefixes && typeof config.prefixes === 'object'
    ? config.prefixes
    : {};

  const prefix = prefixes[type] || prefixes[normalizedType] || '[LOG]';

  console.log(prefix, message, data ?? '');
};

/**
 * Función para actualizar configuración en runtime
 */
export const updateLogConfig = (newConfig) => {
  Object.assign(NavigationLogConfig, newConfig);
};
