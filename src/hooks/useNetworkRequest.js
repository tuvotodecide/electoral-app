import {useState, useCallback} from 'react';
import {checkInternetConnection, retryWithBackoff, showNetworkErrorAlert} from '../utils/networkUtils';

/**
 * Hook personalizado para manejar requests HTTP con manejo de errores y retry
 */
export const useNetworkRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeRequest = useCallback(async (requestFn, options = {}) => {
    const {
      showAlert = true,
      maxRetries = 3,
      baseDelay = 1000,
      requireInternet = true,
    } = options;

    setLoading(true);
    setError(null);

    try {
      // Verificar conexión a internet si es necesario
      if (requireInternet) {
        const hasConnection = await checkInternetConnection();
        if (!hasConnection) {
          throw new Error('No hay conexión a internet disponible');
        }
      }

      // Ejecutar request con retry
      const result = await retryWithBackoff(requestFn, maxRetries, baseDelay);
      
      setLoading(false);
      return result;

    } catch (err) {
      console.error('Network request failed:', err);
      setError(err);
      setLoading(false);

      if (showAlert) {
        showNetworkErrorAlert(err, err.fullUrl);
      }

      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeRequest,
    clearError,
  };
};
