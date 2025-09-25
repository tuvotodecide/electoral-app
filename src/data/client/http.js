import axios from 'axios';
import {BACKEND} from '@env';

import * as Keychain from 'react-native-keychain';
import {JWT_KEY} from '../../common/constants';

const Axios = axios.create({
  baseURL: BACKEND,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});
const AxiosMultipart = axios.create({
  baseURL: BACKEND,

  timeout: 50000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

async function authHeader(config) {
  const token = await Keychain.getInternetCredentials(JWT_KEY);
  if (token) config.headers.Authorization = `Bearer ${token.password}`;
  return config;
}

Axios.interceptors.request.use(authHeader);
AxiosMultipart.interceptors.request.use(authHeader);

export class Http {
  static async get(url, params) {
    const response = await Axios.get(url, {params});
    return response.data;
  }
  static async post(url, data, options) {
    const response = await Axios.post(url, data, options);
    return response.data;
  }
  static async postmultipart(url, data, options) {
    const response = await AxiosMultipart.post(url, data, options);
    return response.data;
  }
  static async put(url, data) {
    const response = await Axios.put(url, data);
    return response.data;
  }
  static async patch(url, data) {
    const response = await Axios.patch(url, data);

    return response.data;
  }
  static async patchmultipart(url, data) {
    const response = await AxiosMultipart.patch(url, data);
    return response.data;
  }
  static async delete(url) {
    const response = await Axios.delete(url);
    return response.data;
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
