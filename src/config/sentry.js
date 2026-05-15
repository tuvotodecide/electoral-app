import { SENTRY_DSN_KEY, SENTRY_TESTFLIGHT_SMOKE_TEST } from '@env';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';


// ============================================================================
// CONFIGURACION SENTRY - App Electoral
// ============================================================================

const SENTRY_TESTFLIGHT_SMOKE_ENABLED =true
    // String(SENTRY_TESTFLIGHT_SMOKE_TEST || '').toLowerCase() === 'true';
const isSentryDsnConfigured = () => !!String(SENTRY_DSN_KEY || '').trim();
let sentryInitialized = false;
let sentrySmokeTestSent = false;

const SENSITIVE_KEYS = [
    'authorization',
    'bearer',
    'credential',
    'dni',
    'document',
    'nationalid',
    'password',
    'pin',
    'privkey',
    'privatekey',
    'secret',
    'token',
    'vc',
];

const getBuildProfile = () =>
    (typeof process !== 'undefined' ? process.env?.EAS_BUILD_PROFILE : null) ||
    Constants.expoConfig?.extra?.buildProfile ||
    (__DEV__ ? 'development' : 'production');

const getAppDiagnostics = () => ({
    platform: Platform.OS,
    sentry_dsn_configured: isSentryDsnConfigured(),
    sentry_testflight_smoke_enabled: SENTRY_TESTFLIGHT_SMOKE_ENABLED,
    app_version:
        Constants.nativeApplicationVersion ||
        Constants.expoConfig?.version ||
        'unknown',
    build_number:
        Constants.nativeBuildVersion ||
        Constants.expoConfig?.ios?.buildNumber ||
        Constants.expoConfig?.android?.versionCode ||
        'unknown',
    environment: __DEV__ ? 'development' : 'production',
    build_profile: getBuildProfile(),
    execution_environment: Constants.executionEnvironment || 'unknown',
    app_ownership: Constants.appOwnership || 'unknown',
});

const redactValue = (key, value) => {
    const normalizedKey = String(key || '').toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(k => normalizedKey.includes(k));

    if (isSensitive) {
        return '[redacted]';
    }

    if (typeof value === 'string') {
        return value
            .replace(/(token|authorization|password|pin|secret)=([^&\s]+)/gi, '$1=[redacted]')
            .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]');
    }

    return value;
};

export const sanitizeForSentry = (value, depth = 0) => {
    if (value == null) {
        return value;
    }

    if (depth > 4) {
        return '[max-depth]';
    }

    if (Array.isArray(value)) {
        return value.slice(0, 20).map(item => sanitizeForSentry(item, depth + 1));
    }

    if (typeof value === 'object') {
        const safe = {};
        Object.keys(value).slice(0, 50).forEach(key => {
            safe[key] = sanitizeForSentry(redactValue(key, value[key]), depth + 1);
        });
        return safe;
    }

    return redactValue('', value);
};

const toError = (error, fallbackMessage = 'Unknown application error') => {
    if (error instanceof Error) {
        return error;
    }

    if (typeof error === 'string') {
        return new Error(error);
    }

    const wrapped = new Error(fallbackMessage);
    wrapped.originalError = sanitizeForSentry(error);
    return wrapped;
};

const safeSetContext = (name, context) => {
    if (sentryInitialized && typeof Sentry.setContext === 'function') {
        Sentry.setContext(name, context);
    }
};

const safeSetTag = (name, value) => {
    if (sentryInitialized && typeof Sentry.setTag === 'function') {
        Sentry.setTag(name, value);
    }
};

const safeAddBreadcrumb = (breadcrumb) => {
    if (sentryInitialized && typeof Sentry.addBreadcrumb === 'function') {
        Sentry.addBreadcrumb(breadcrumb);
    }
};

export const getSafeUrl = (url = '') =>
    String(url || '')
        .replace(/([?&](dni|document|nationalId|token|authorization|pin|password|secret)=)[^&]+/gi, '$1[redacted]')
        .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]');

/**
 * Inicializa Sentry - DEBE llamarse antes de cualquier otro codigo
 */
export const initSentry = () => {
    if (!isSentryDsnConfigured()) {
        sentryInitialized = false;
        if (__DEV__) {
            console.warn('[Sentry] SENTRY_DSN_KEY is missing. Runtime events will not be sent.');
        }
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN_KEY,

        // Entorno para filtrar en dashboard
        environment: __DEV__ ? 'development' : 'production',
        release: `${Constants.expoConfig?.slug || 'electoral-app-expo'}@${getAppDiagnostics().app_version}`,
        dist: String(getAppDiagnostics().build_number),

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
            event.extra = sanitizeForSentry(event.extra);
            event.contexts = sanitizeForSentry(event.contexts);


            // No permitir PII en prod aunque alguien lo setee por error
            if (!__DEV__ && event.contexts?.user_pii) {
                delete event.contexts.user_pii;
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
    sentryInitialized = true;

    const diagnostics = getAppDiagnostics();
    safeSetContext('app_diagnostics', diagnostics);
    safeSetTag('platform', diagnostics.platform);
    safeSetTag('build_profile', diagnostics.build_profile);
    safeSetTag('app_version', diagnostics.app_version);
    safeSetTag('build_number', String(diagnostics.build_number));

    safeAddBreadcrumb({
        category: 'app.startup',
        message: 'Sentry initialized',
        level: 'info',
        data: diagnostics,
    });

    if (!__DEV__ && Platform.OS === 'ios' && SENTRY_TESTFLIGHT_SMOKE_ENABLED && !sentrySmokeTestSent) {
        sentrySmokeTestSent = true;
        Sentry.withScope((scope) => {
            scope.setTag('flow', 'sentry_smoke_test');
            scope.setTag('platform', 'ios');
            scope.setTag('build_profile', diagnostics.build_profile);
            scope.setLevel('warning');
            scope.setContext('smoke_test', {
                purpose: 'Validate runtime Sentry events from iOS/TestFlight',
                remove_or_disable_after_validation: true,
                dsn_configured: isSentryDsnConfigured(),
                app_version: diagnostics.app_version,
                build_number: diagnostics.build_number,
                environment: diagnostics.environment,
                platform: diagnostics.platform,
            });
            Sentry.captureException(new Error('Sentry iOS TestFlight smoke test'));
        });
        Sentry.flush(2000).catch(() => {});
    }
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
    if (!sentryInitialized) {
        return;
    }

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
    if (!sentryInitialized) {
        return;
    }

    Sentry.setUser(null);
    Sentry.setContext('user_context', null);
    Sentry.setContext('electoral_location', null);
};

/**
 * Setear contexto de ubicacion electoral
 * @param {Object} data - Datos de ubicacion
 */
export const setElectoralContext = (data) => {
    if (!sentryInitialized) {
        return;
    }

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

    safeAddBreadcrumb({
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
    safeAddBreadcrumb({
        category: 'user.action',
        message: action,
        level: 'info',
        data: sanitizeForSentry(data),
    });
};

export const addAppBreadcrumb = (message, data = {}, level = 'info') => {
    safeAddBreadcrumb({
        category: 'app.startup',
        message,
        level,
        data: sanitizeForSentry(data),
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
    const cleanUrl = getSafeUrl(url);

    safeAddBreadcrumb({
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
    safeAddBreadcrumb({
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
 * @param {boolean} context.allowPii - (solo dev) permite adjuntar PII en contexto debug
 * @param {string} context.dni
 *
 * @example
 * captureError(error, {
 *   flow: 'offline_queue',
 *   critical: true,
 *   step: 'upload_certificate',
 *   tableCode: '12345'
 * });
 */
export const reportAppError = (error, context = {}) => {
    const normalizedError = toError(error);
    const diagnostics = getAppDiagnostics();

    if (!sentryInitialized) {
        if (__DEV__ && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
            console.error(`[${context.flow || 'ERROR'}]`, normalizedError.message, sanitizeForSentry(context));
        }
        return;
    }

    Sentry.withScope((scope) => {
        const allowPii = __DEV__ && context.allowPii === true;
        // Tags para filtrar en dashboard
        if (context.flow) scope.setTag('flow', context.flow);
        if (context.critical) scope.setTag('critical', 'true');
        if (context.step) scope.setTag('step', context.step);
        if (context.tableCode) scope.setTag('table_code', context.tableCode);
        if (context.chain) scope.setTag('blockchain_chain', context.chain);
        if (context.module) scope.setTag('module', context.module);
        if (context.endpoint) scope.setTag('endpoint', getSafeUrl(context.endpoint));
        scope.setTag('platform', diagnostics.platform);
        scope.setTag('build_profile', diagnostics.build_profile);
        scope.setTag('app_version', diagnostics.app_version);
        scope.setTag('build_number', String(diagnostics.build_number));

        // Nivel segun criticidad
        scope.setLevel(context.critical ? 'error' : 'warning');

        // Contexto extra (sin PII)
        const safeContext = sanitizeForSentry({ ...context });
        delete safeContext.allowPii;

        scope.setContext('error_context', {
            ...safeContext,
            timestamp: new Date().toISOString(),
        });

        scope.setContext('app_diagnostics', diagnostics);

        // Adjuntar PII solo en desarrollo y cuando se solicite explicitamente
        if (allowPii) {
            scope.setContext('user_pii', {
                dni: context.dni ?? null,
            });
        }

        // Si hay info de API debug, agregarla
        if (normalizedError.apiDebug) {
            scope.setContext('api_debug', sanitizeForSentry({
                url: getSafeUrl(normalizedError.apiDebug.url),
                method: normalizedError.apiDebug.method,
                status: normalizedError.apiDebug.status,
                code: normalizedError.apiDebug.code,
                timeout: normalizedError.apiDebug.timeout,
                statusText: normalizedError.apiDebug.statusText,
                responseData: normalizedError.apiDebug.responseData,
            }));
        }

        Sentry.captureException(normalizedError);
    });

    // Mantener console.error en dev para debugging local
    if (__DEV__ && (typeof process === 'undefined' || process.env?.NODE_ENV !== 'test')) {
        console.error(`[${context.flow || 'ERROR'}]`, normalizedError.message, sanitizeForSentry(context));
    }
};

export const captureError = reportAppError;

/**
 * Capturar mensaje informativo o warning (sin excepcion)
 * @param {string} message - Mensaje a capturar
 * @param {'info'|'warning'|'error'} level - Nivel del mensaje
 * @param {Object} context - Contexto adicional
 */
export const captureMessage = (message, level = 'info', context = {}) => {
    if (!sentryInitialized) {
        return;
    }

    Sentry.withScope((scope) => {
        if (context.flow) scope.setTag('flow', context.flow);

        scope.setContext('message_context', context);

        Sentry.captureMessage(message, level);
    });
};

/**
 * Fuerza el envio de eventos pendientes.
 * Util en etapas tempranas del arranque.
 */
export const flushSentry = async (timeoutMs = 2000) => {
    if (!sentryInitialized) {
        return false;
    }

    try {
        return await Sentry.flush(timeoutMs);
    } catch {
        return false;
    }
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
