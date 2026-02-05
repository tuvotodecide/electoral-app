import axios from 'axios';
import {BACKEND_IDENTITY} from '@env';

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

API.interceptors.response.use(
  (r) => r,
  (e) => {
    const config = e?.config ?? {};
    const requestUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const debugPayload = {
      method: config.method,
      status: e?.response?.status,
      statusText: e?.response?.statusText,
      requestData: formatDebugPayload(config.data),
      responseData: formatDebugPayload(e?.response?.data),
    };

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
