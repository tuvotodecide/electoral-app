import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN_KEY } from '@env';

// ============================================================================
// CONFIGURACION SENTRY - App Electoral
// ============================================================================

// DSN de Sentry - Reemplazar con tu DSN real despues del paso 1
// Formato: https://xxx@xxx.ingest.sentry.io/xxx
const SENTRY_DSN = SENTRY_DSN_KEY;

/**
 * Inicializa Sentry - DEBE llamarse antes de cualquier otro codigo
 */
export const initSentry = () => {

  Sentry.init({
    dsn: SENTRY_DSN,

    // Entorno para filtrar en dashboard
    environment: __DEV__ ? 'development' : 'production',

    // Capturar transacciones (performance)
    // En dev 100%, en prod 20% para no sobrecargar
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // NO enviar PII (datos personales) por defecto
    sendDefaultPii: false,

    // Tracking de sesiones
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Adjuntar stack traces a todos los mensajes
    attachStacktrace: true,

    // Filtrar eventos antes de enviar
    beforeSend(event) {
      // Limpiar cualquier dato sensible que pudiera filtrarse
      if (event.extra) {
        delete event.extra.dni;
        delete event.extra.token;
        delete event.extra.privKey;
        delete event.extra.pin;
      }

      return event;
    },

    // Filtrar breadcrumbs sensibles
    beforeBreadcrumb(breadcrumb) {
      // No loggear requests a endpoints sensibles
      if (breadcrumb.category === 'http') {
        const url = breadcrumb.data?.url || '';
        if (url.includes('/auth') || url.includes('/login')) {
          // Remover body de requests de auth
          if (breadcrumb.data) {
            delete breadcrumb.data.request_body;
            delete breadcrumb.data.response_body;
          }
        }
      }
      return breadcrumb;
    },
  });
};

// ============================================================================
// HELPERS PARA CONTEXTO DE USUARIO (sin PII)
// ============================================================================

/**
 * Setear contexto del usuario autenticado
 * IMPORTANTE: No enviar DNI, nombre, telefono, etc.
 * @param {Object} userData - Datos del usuario
 */
export const setUserContext = (userData) => {
  if (!userData) {
    Sentry.setUser(null);
    return;
  }

  // Solo ID anonimo, nunca DNI real
  Sentry.setUser({
    id: userData.account || userData.did?.substring(0, 20) || 'anonymous',
  });

  // Contexto electoral sin PII
  Sentry.setContext('user_context', {
    user_role: userData.role || 'voter',
    has_wallet: !!userData.account,
    has_guardian: !!userData.guardian,
  });
};

/**
 * Limpiar contexto de usuario (logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
  Sentry.setContext('user_context', null);
  Sentry.setContext('electoral_location', null);
};

/**
 * Setear contexto de ubicacion electoral
 * @param {Object} data - Datos de ubicacion
 */
export const setElectoralContext = (data) => {
  Sentry.setContext('electoral_location', {
    province_code: data.provinceCode || data.province,
    table_code: data.tableCode,
    election_id: data.electionId,
    location_id: data.locationId || data.idRecinto,
  });
};

// ============================================================================
// BREADCRUMBS - Rastro de acciones del usuario
// ============================================================================

/**
 * Agregar breadcrumb de navegacion entre pantallas
 * @param {string} routeName - Nombre de la pantalla
 * @param {Object} params - Parametros de navegacion (solo seguros)
 */
export const addNavigationBreadcrumb = (routeName, params = {}) => {
  // Solo incluir params que no sean PII
  const safeParams = {};
  if (params.tableCode) safeParams.tableCode = params.tableCode;
  if (params.step) safeParams.step = params.step;
  if (params.electionId) safeParams.electionId = params.electionId;

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Screen: ${routeName}`,
    level: 'info',
    data: safeParams,
  });
};

/**
 * Agregar breadcrumb de accion del usuario
 * @param {string} action - Descripcion de la accion
 * @param {Object} data - Datos adicionales (sin PII)
 */
export const addActionBreadcrumb = (action, data = {}) => {
  Sentry.addBreadcrumb({
    category: 'user.action',
    message: action,
    level: 'info',
    data,
  });
};

/**
 * Agregar breadcrumb de request HTTP
 * @param {string} method - GET, POST, etc
 * @param {string} url - URL del endpoint (sin query params sensibles)
 * @param {number} statusCode - Codigo HTTP de respuesta
 * @param {number} duration - Duracion en ms
 */
export const addHttpBreadcrumb = (method, url, statusCode, duration) => {
  // Limpiar URL de posibles datos sensibles
  const cleanUrl = url
    .replace(/dni=[^&]+/gi, 'dni=***')
    .replace(/token=[^&]+/gi, 'token=***');

  Sentry.addBreadcrumb({
    category: 'http',
    message: `${method} ${cleanUrl}`,
    level: statusCode >= 400 ? 'error' : 'info',
    data: {
      method,
      url: cleanUrl,
      status_code: statusCode,
      duration_ms: duration,
    },
  });
};

/**
 * Agregar breadcrumb de operacion blockchain
 * @param {string} operation - Nombre de la operacion
 * @param {Object} data - Datos de contexto
 */
export const addBlockchainBreadcrumb = (operation, data = {}) => {
  Sentry.addBreadcrumb({
    category: 'blockchain',
    message: `Blockchain: ${operation}`,
    level: 'info',
    data: {
      operation,
      chain: data.chain,
      success: data.success,
    },
  });
};

// ============================================================================
// CAPTURA DE ERRORES
// ============================================================================

/**
 * Capturar error con contexto adicional
 * Usar en todos los catch blocks de flujos criticos
 *
 * @param {Error} error - El error a capturar
 * @param {Object} context - Contexto adicional
 * @param {string} context.flow - Flujo donde ocurrio (ej: 'offline_queue', 'vote_upload')
 * @param {boolean} context.critical - Si es critico para el usuario
 * @param {string} context.step - Paso especifico (ej: 'upload_ipfs', 'oracle_call')
 * @param {string} context.tableCode - Codigo de mesa (si aplica)
 *
 * @example
 * captureError(error, {
 *   flow: 'offline_queue',
 *   critical: true,
 *   step: 'upload_certificate',
 *   tableCode: '12345'
 * });
 */
export const captureError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Tags para filtrar en dashboard
    if (context.flow) scope.setTag('flow', context.flow);
    if (context.critical) scope.setTag('critical', 'true');
    if (context.step) scope.setTag('step', context.step);
    if (context.tableCode) scope.setTag('table_code', context.tableCode);
    if (context.chain) scope.setTag('blockchain_chain', context.chain);

    // Nivel segun criticidad
    scope.setLevel(context.critical ? 'error' : 'warning');

    // Contexto extra (sin PII)
    const safeContext = { ...context };
    delete safeContext.dni;
    delete safeContext.token;
    delete safeContext.privKey;

    scope.setContext('error_context', {
      ...safeContext,
      timestamp: new Date().toISOString(),
    });

    // Si hay info de API debug, agregarla
    if (error.apiDebug) {
      scope.setContext('api_debug', {
        url: error.apiDebug.url,
        method: error.apiDebug.method,
        status: error.apiDebug.status,
      });
    }

    Sentry.captureException(error);
  });

  // Mantener console.error en dev para debugging local
  if (__DEV__) {
    console.error(`[${context.flow || 'ERROR'}]`, error.message, context);
  }
};

/**
 * Capturar mensaje informativo o warning (sin excepcion)
 * @param {string} message - Mensaje a capturar
 * @param {'info'|'warning'|'error'} level - Nivel del mensaje
 * @param {Object} context - Contexto adicional
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.withScope((scope) => {
    if (context.flow) scope.setTag('flow', context.flow);

    scope.setContext('message_context', context);

    Sentry.captureMessage(message, level);
  });
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Wrapper para funciones async que captura errores automaticamente
 * @param {Function} fn - Funcion async a ejecutar
 * @param {Object} context - Contexto para el error
 * @returns {Function} Funcion wrapped
 */
export const withErrorCapture = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error, context);
      throw error; // Re-throw para que el caller pueda manejarlo
    }
  };
};

/**
 * Forzar un crash para testing (solo usar en desarrollo)
 */
export const testCrash = () => {
  if (!__DEV__) {
    console.warn('testCrash solo debe usarse en desarrollo');
    return;
  }
  throw new Error('Sentry Test Crash - Ignorar este error');
};

export default Sentry;
