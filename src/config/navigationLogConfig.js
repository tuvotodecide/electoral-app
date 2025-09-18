/**
 * Configuración para el sistema de logging de navegación
 */

export const NavigationLogConfig = {
  // Habilitar/deshabilitar logging global
  enabled: __DEV__, // Solo en desarrollo por defecto
  
  // Configuración de tipos de logs
  logs: {
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
export const navLog = (type, message, data = null) => {
  if (!NavigationLogConfig.enabled || !NavigationLogConfig.logs[type]) {
    return;
  }
  
  const prefix = NavigationLogConfig.prefixes[type] || '[LOG]';
  console.log(prefix, message, data || '');
};

/**
 * Función para actualizar configuración en runtime
 */
export const updateLogConfig = (newConfig) => {
  Object.assign(NavigationLogConfig, newConfig);
};
