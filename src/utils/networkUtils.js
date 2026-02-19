import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';
import {BACKEND, BACKEND_BLOCKCHAIN, BACKEND_RESULT} from '@env';

const NETWORK_TRACE_ENABLED = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const logNetworkTrace = (event, payload = {}) => {
  if (!NETWORK_TRACE_ENABLED) return;
  console.log(`[NETWORK] ${event}`, payload);
};

/**
 * Verifica si hay conexión a internet
 */
export const checkInternetConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    //console.error('Error checking internet connection:', error);
    return false;
  }
};

const buildHealthUrl = baseUrl => {
  const normalized = String(baseUrl || '').trim().replace(/\/+$/, '');
  return normalized ? `${normalized}/health` : '';
};

const classifyProbeError = error => {
  const code = String(error?.code || '').trim().toUpperCase();
  const name = String(error?.name || '').trim().toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (
    name === 'aborterror' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    message.includes('timeout') ||
    message.includes('aborted')
  ) {
    return 'NETWORK_TIMEOUT';
  }

  if (
    code === 'ERR_NETWORK' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('internet')
  ) {
    return 'NETWORK_DOWN';
  }

  return 'UNKNOWN';
};

const PROBE_RESULT_WINDOW_MS = 1200;
const probeInflightByHealthUrl = new Map();
const probeRecentResultByHealthUrl = new Map();

export const backendProbe = async ({
  timeoutMs = 2000,
  baseUrl = BACKEND_RESULT || BACKEND,
} = {}) => {
  const startedAt = Date.now();
  const healthUrl = buildHealthUrl(baseUrl);

  if (!healthUrl) {
    logNetworkTrace('PROBE_FAIL', {
      healthUrl,
      timeoutMs,
      errorType: 'MISSING_BASE_URL',
    });
    return {
      ok: false,
      totalMs: Date.now() - startedAt,
      errorType: 'MISSING_BASE_URL',
      status: null,
    };
  }

  const now = Date.now();
  const recent = probeRecentResultByHealthUrl.get(healthUrl);
  if (recent && now - recent.at <= PROBE_RESULT_WINDOW_MS) {
    logNetworkTrace('PROBE_CACHE_HIT', {
      healthUrl,
      timeoutMs,
      ageMs: now - recent.at,
    });
    return {
      ...recent.result,
      totalMs: Date.now() - startedAt,
    };
  }

  const inflightProbe = probeInflightByHealthUrl.get(healthUrl);
  if (inflightProbe) {
    logNetworkTrace('PROBE_JOIN', {
      healthUrl,
      timeoutMs,
    });
    const joined = await inflightProbe;
    return {
      ...joined,
      totalMs: Date.now() - startedAt,
    };
  }

  logNetworkTrace('PROBE_START', {
    healthUrl,
    timeoutMs,
  });

  const executeProbe = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const totalMs = Date.now() - startedAt;

      if (response.ok) {
        const result = {
          ok: true,
          totalMs,
          errorType: null,
          status: response.status,
        };
        logNetworkTrace('PROBE_OK', {
          healthUrl,
          timeoutMs,
          status: response.status,
          totalMs,
        });
        probeRecentResultByHealthUrl.set(healthUrl, {
          at: Date.now(),
          result,
        });
        return result;
      }

      const status = Number(response.status || 0);
      const errorType =
        status === 429
          ? 'RATE_LIMIT'
          : status >= 500
            ? 'SERVER_5XX'
            : status === 401 || status === 403
              ? 'AUTH'
              : 'HTTP_ERROR';
      const result = {
        ok: false,
        totalMs,
        errorType,
        status,
      };
      logNetworkTrace('PROBE_FAIL', {
        healthUrl,
        timeoutMs,
        status,
        totalMs,
        errorType,
      });
      probeRecentResultByHealthUrl.set(healthUrl, {
        at: Date.now(),
        result,
      });
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      const errorType = classifyProbeError(error);
      const totalMs = Date.now() - startedAt;
      const result = {
        ok: false,
        totalMs,
        errorType,
        status: null,
      };
      logNetworkTrace('PROBE_FAIL', {
        healthUrl,
        timeoutMs,
        status: null,
        totalMs,
        errorType,
      });
      probeRecentResultByHealthUrl.set(healthUrl, {
        at: Date.now(),
        result,
      });
      return result;
    }
  };

  const probePromise = executeProbe().finally(() => {
    probeInflightByHealthUrl.delete(healthUrl);
  });
  probeInflightByHealthUrl.set(healthUrl, probePromise);
  return probePromise;
};

/**
 * Valida la conectividad con el backend
 */
export const validateBackendConnectivity = async () => {
  const endpoints = [
    {name: 'BACKEND', url: BACKEND},
    {name: 'BACKEND_BLOCKCHAIN', url: BACKEND_BLOCKCHAIN},
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${endpoint.url}health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
      });

    } catch (error) {
      //console.error(`Failed to connect to ${endpoint.name}:`, error.message);
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: null,
        ok: false,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Muestra alerta de error de conexión
 */
export const showNetworkErrorAlert = (error, url = null) => {
  let message = 'Error de conectividad detectado.';
  let title = 'Error de Conexión';
  
  // Intentar extraer URL del error si no se proporciona
  const errorUrl = url || error.config?.url || error.config?.baseURL || 'URL no disponible';
  
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    message = `No se puede conectar al servidor.\n\nURL: ${errorUrl}\n\nVerifica tu conexión a internet y intenta nuevamente.`;
  } else if (error.code === 'TIMEOUT') {
    message = `La solicitud ha tardado demasiado.\n\nURL: ${errorUrl}\n\nVerifica tu conexión e intenta nuevamente.`;
  } else if (error.response?.status >= 500) {
    message = `El servidor está experimentando problemas.\n\nURL: ${errorUrl}\nCódigo: ${error.response.status}\n\nIntenta nuevamente en unos minutos.`;
  } else if (error.response?.status === 404) {
    message = `El recurso solicitado no se encontró.\n\nURL: ${errorUrl}\nCódigo: 404`;
  } else {
    message = `Error de conexión.\n\nURL: ${errorUrl}\nDetalle: ${error.message || 'Error desconocido'}`;
  }

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Reintentar',
        onPress: () => {
          // Puedes agregar lógica de retry aquí
        }
      },
      {
        text: 'OK',
        style: 'cancel'
      }
    ]
  );
};

/**
 * Función de retry con backoff exponencial
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
