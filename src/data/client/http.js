import { BACKEND } from '@env';
import axios from 'axios';

import { addHttpBreadcrumb, getSafeUrl, reportAppError } from '../../config/sentry';
import { InternetCredentials } from './internetCredentials';
import { JWT_KEY_EXPO } from '../../common/constants';

const Axios = axios.create({
  baseURL: BACKEND,
  timeout: 30000, // Reducido de 50s a 30s
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
const AxiosMultipart = axios.create({
  baseURL: BACKEND,
  timeout: 30000, // Reducido de 50s a 30s  
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
  },
});

async function authHeader(config) {
  config.metadata = { startTime: Date.now() };
  const token = await InternetCredentials.getInternetCredentials(JWT_KEY_EXPO);
  if (token) config.headers.Authorization = `Bearer ${token.password}`;
  return config;
}

Axios.interceptors.request.use(authHeader);
AxiosMultipart.interceptors.request.use(authHeader);

const handleAxiosError = (error, clientName) => {
  const config = error?.config ?? {};
  const fullUrl = config ? `${config.baseURL || ''}${config.url || ''}` : 'URL no disponible';
  const duration = Date.now() - (config.metadata?.startTime || 0);
  const status = error.response?.status || 0;
  const safeUrl = getSafeUrl(fullUrl);
  const isTimeout = error.code === 'ECONNABORTED';
  const isNetworkError = error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || !error.response;
  const isServerError = status >= 500;
  const isClientError = status >= 400 && status < 500;

  addHttpBreadcrumb(
    config.method?.toUpperCase() || 'UNKNOWN',
    safeUrl,
    status,
    duration,
  );

  reportAppError(error, {
    flow: 'http_request',
    module: `src/data/client/http:${clientName}`,
    step: isTimeout ? 'timeout' : isNetworkError ? 'network_error' : `http_${status}`,
    critical: isServerError,
    endpoint: safeUrl,
    method: config.method,
    status,
    status_family: status ? `${Math.floor(status / 100)}xx` : 'network',
    timeout_ms: config.timeout,
    duration_ms: duration,
    is_timeout: isTimeout,
    is_network_error: isNetworkError,
    is_client_error: isClientError,
  });

  if (__DEV__) {
    console.error(`${clientName} Error Details:`, {
      message: error.message,
      code: error.code,
      status,
      statusText: error.response?.statusText,
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: safeUrl,
      timeout: config.timeout,
      method: config.method,
    });
  }

  error.fullUrl = safeUrl;
  return Promise.reject(error);
};

// Interceptor de respuesta para manejo global de errores
Axios.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config?.metadata?.startTime || 0);
    addHttpBreadcrumb(
      response.config?.method?.toUpperCase() || 'GET',
      getSafeUrl(`${response.config?.baseURL || ''}${response.config?.url || ''}`),
      response.status,
      duration,
    );
    return response;
  },
  (error) => handleAxiosError(error, 'Axios')
);

AxiosMultipart.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config?.metadata?.startTime || 0);
    addHttpBreadcrumb(
      response.config?.method?.toUpperCase() || 'GET',
      getSafeUrl(`${response.config?.baseURL || ''}${response.config?.url || ''}`),
      response.status,
      duration,
    );
    return response;
  },
  (error) => handleAxiosError(error, 'AxiosMultipart')
);

export class Http {
  static async get(url, params) {
    try {
      const response = await Axios.get(url, {params});
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP GET Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async post(url, data, options) {
    try {
      const response = await Axios.post(url, data, options);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP POST Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async postmultipart(url, data, options) {
    try {
      const response = await AxiosMultipart.post(url, data, options);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${AxiosMultipart.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP POST Multipart Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async put(url, data) {
    try {
      const response = await Axios.put(url, data);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP PUT Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async patch(url, data) {
    try {
      const response = await Axios.patch(url, data);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP PATCH Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async patchmultipart(url, data) {
    try {
      const response = await AxiosMultipart.patch(url, data);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${AxiosMultipart.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP PATCH Multipart Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async delete(url) {
    try {
      const response = await Axios.delete(url);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      if (__DEV__) console.error(`HTTP DELETE Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static getFormErrors(error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message;
    }
    return null;
  }
  static getFieldErrors(error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.errors;
    }
    return null;
  }
  static async getWhitId(url, id) {
    const response = await Axios.get(`${url}/${id}`);
    return response.data;
  }
  static async getWhitIdCrypto(url, id, period) {
    const response = await Axios.get(`${url}/${id}?period=${period}`);
    return response.data;
  }
}
