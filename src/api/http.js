import axios from 'axios';
import {BACKEND_IDENTITY} from '@env';

export const API = axios.create({
  baseURL: BACKEND_IDENTITY,
  timeout: 50000,
});

API.interceptors.response.use(
  (r) => r,
  (e) => {
    const msg = e?.response?.data?.message || e.message || 'Network error';
    return Promise.reject(new Error(msg));
  },
);
