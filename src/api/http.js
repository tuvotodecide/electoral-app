import axios from 'axios';
import { BACKEND_IDENTITY } from '@env';
import { captureError, addHttpBreadcrumb } from '../config/sentry';


const formatDebugPayload = (payload) => {
  if (payload == null) {
    return null;
  }

  try {
    const serialized =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    if (serialized.length <= 500) {
      return serialized;
    }

    return `${serialized.slice(0, 500)}…(truncated)`;
  } catch (err) {
    return '[unserializable payload]';
  }
};

export const API = axios.create({
  baseURL: BACKEND_IDENTITY,
  timeout: 50000,
});

// ============================================================================
// Interceptor de REQUEST - agregar metadata para medir duracion
// ============================================================================
API.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// Interceptor de RESPONSE - capturar errores en Sentry
// ============================================================================

API.interceptors.response.use(
  (response) => {
    // Breadcrumb para requests exitosos
    const duration = Date.now() - (response.config?.metadata?.startTime || 0);
    addHttpBreadcrumb(
      response.config?.method?.toUpperCase() || 'GET',
      response.config?.url || '',
      response.status,
      duration
    );
    return response;
  },
  (e) => {
    const config = e?.config ?? {};
    const requestUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const duration = Date.now() - (config.metadata?.startTime || 0);
    const status = e?.response?.status || 0;

    // Breadcrumb del error HTTP
    addHttpBreadcrumb(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || '',
      status,
      duration
    );
    const debugPayload = {
      method: config.method,
      status: status,
      statusText: e?.response?.statusText,
      requestData: formatDebugPayload(config.data),
      responseData: formatDebugPayload(e?.response?.data),
    };
    
    // ========================================================================
    // SENTRY: Capturar errores HTTP significativos
    // ========================================================================
    const isServerError = status >= 500;
    const isTimeout = e.code === 'ECONNABORTED';
    const isNetworkError = e.message === 'Network Error';

    if (isServerError || isTimeout) {
      captureError(e, {
        flow: 'http_request',
        critical: isServerError,
        step: config.url,
        endpoint: config.url,
        method: config.method,
        status: status,
        duration_ms: duration,
        is_timeout: isTimeout,
        is_network_error: isNetworkError,
      });
    }
    // ========================================================================


    if (__DEV__) {
      console.warn(
        '[API] Error calling',
        requestUrl || '(URL no disponible)',
        debugPayload,
      );
    }

    const msg = e?.response?.data?.message || e.message || 'Network error';
    const normalizedError = new Error(msg);
    normalizedError.apiDebug = {
      url: requestUrl || null,
      ...debugPayload,
    };
    normalizedError.cause = e;

    return Promise.reject(normalizedError);
  },
);
