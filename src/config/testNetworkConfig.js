// Configuración de Axios para modo test
// Este archivo intercepta y bloquea llamadas de red cuando está en modo test

import axios from 'axios';
import {TEST_CONFIG, testLog} from './testConfig';

// Función para configurar interceptores de test
export const setupTestInterceptors = () => {
  if (!TEST_CONFIG.DISABLE_NETWORK_CALLS) {
    return; // Solo aplicar si el flag está activado
  }

  testLog('Configurando interceptores de red para modo test...');

  // Interceptor para requests - bloquea llamadas reales
  axios.interceptors.request.use(
    config => {
      // Lista de URLs permitidas en modo test (puedes agregar más)
      const allowedUrls = [
        // Agregar aquí URLs que sí quieres que funcionen en test
      ];

      const isAllowed = allowedUrls.some(url => config.url?.includes(url));

      if (!isAllowed) {
        testLog('Bloqueando llamada de red en modo test:', config.url);

        // Rechazar la request con un error simulado
        return Promise.reject({
          isTestModeBlock: true,
          message: 'Network calls disabled in test mode',
          config,
        });
      }

      return config;
    },
    error => {
      return Promise.reject(error);
    },
  );

  // Interceptor para responses - maneja errores de test
  axios.interceptors.response.use(
    response => {
      return response;
    },
    error => {
      if (error.isTestModeBlock) {
        testLog('Llamada de red bloqueada exitosamente:', error.config?.url);

        // Retornar una respuesta mockeada en lugar de error
        return Promise.resolve({
          data: {
            ok: true,
            message: 'Test mode - network call blocked',
            isTestMode: true,
          },
          status: 200,
          statusText: 'OK (Test Mode)',
        });
      }

      return Promise.reject(error);
    },
  );

  testLog('Interceptores de test configurados exitosamente');
};

// Función para limpiar interceptores de test
export const clearTestInterceptors = () => {
  testLog('Limpiando interceptores de test...');

  // Limpiar todos los interceptors
  axios.interceptors.request.clear();
  axios.interceptors.response.clear();

  testLog('Interceptores de test removidos');
};

// Función helper para verificar si una llamada fue bloqueada
export const isTestModeResponse = response => {
  return response?.data?.isTestMode === true;
};
