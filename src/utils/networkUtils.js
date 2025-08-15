import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';
import {BACKEND, BACKEND_BLOCKCHAIN} from '@env';

/**
 * Verifica si hay conexión a internet
 */
export const checkInternetConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking internet connection:', error);
    return false;
  }
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
      console.log(`Testing connectivity to ${endpoint.name}: ${endpoint.url}`);
      
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
      console.error(`Failed to connect to ${endpoint.name}:`, error.message);
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
      console.log(`Retry attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
