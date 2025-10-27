import axios from 'axios';
import {BACKEND} from '@env';

import * as Keychain from 'react-native-keychain';
import {JWT_KEY} from '../../common/constants';

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
  const token = await Keychain.getInternetCredentials(JWT_KEY);
  if (token) config.headers.Authorization = `Bearer ${token.password}`;
  return config;
}

Axios.interceptors.request.use(authHeader);
AxiosMultipart.interceptors.request.use(authHeader);

// Interceptor de respuesta para manejo global de errores
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'URL no disponible';
    
    console.error('Axios Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: fullUrl,
      timeout: error.config?.timeout,
      method: error.config?.method,
      data: error.config?.data,
    });
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error(`Network connectivity issue detected for URL: ${fullUrl}`);
    }
    
    // Agregar la URL completa al error para que esté disponible en los componentes
    error.fullUrl = fullUrl;
    
    return Promise.reject(error);
  }
);

AxiosMultipart.interceptors.response.use(
  (response) => response,
  (error) => {
    const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'URL no disponible';
    
    console.error('Axios Multipart Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: fullUrl,
    });
    
    // Agregar la URL completa al error
    error.fullUrl = fullUrl;
    
    return Promise.reject(error);
  }
);

export class Http {
  static async get(url, params) {
    try {
      const response = await Axios.get(url, {params});
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      console.error(`HTTP GET Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async post(url, data, options) {
    try {
      const response = await Axios.post(url, data, options);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      console.error(`HTTP POST Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async postmultipart(url, data, options) {
    try {
      const response = await AxiosMultipart.post(url, data, options);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${AxiosMultipart.defaults.baseURL}${url}`;
      console.error(`HTTP POST Multipart Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async put(url, data) {
    try {
      const response = await Axios.put(url, data);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      console.error(`HTTP PUT Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async patch(url, data) {
    try {
      const response = await Axios.patch(url, data);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      console.error(`HTTP PATCH Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async patchmultipart(url, data) {
    try {
      const response = await AxiosMultipart.patch(url, data);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${AxiosMultipart.defaults.baseURL}${url}`;
      console.error(`HTTP PATCH Multipart Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static async delete(url) {
    try {
      const response = await Axios.delete(url);
      return response.data;
    } catch (error) {
      const fullUrl = error.fullUrl || `${Axios.defaults.baseURL}${url}`;
      console.error(`HTTP DELETE Error for ${fullUrl}:`, error.message);
      throw error;
    }
  }
  static getFormErrors(error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data.message;
    }
    return null;
  }
  static getFieldErrors(error) {
    if (axios.isAxiosError(error)) {
      return error.response?.data.errors;
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
