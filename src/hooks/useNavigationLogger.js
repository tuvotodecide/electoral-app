import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationLogConfig, navLog } from '../config/navigationLogConfig';

/**
 * Hook personalizado para logging de navegación en componentes específicos
 * @param {string} screenName - Nombre de la pantalla (opcional, se auto-detecta)
 * @param {boolean} logParams - Si debe loggear parámetros (default: false)
 * @param {boolean} logMount - Si debe loggear al montar el componente (default: true)
 */
export const useNavigationLogger = (screenName = null, logParams = false, logMount = true) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const currentScreenName = screenName || route.name;

  useEffect(() => {
    if (logMount && NavigationLogConfig.logs.componentMount) {
      navLog('mount', `${currentScreenName} - Componente montado`);
      
      if (logParams && route.params && NavigationLogConfig.logs.routeParams) {
        navLog('params', `${currentScreenName}:`, route.params);
      }
    }

    // Cleanup cuando se desmonte el componente
    return () => {
      if (NavigationLogConfig.logs.componentMount) {
        navLog('unmount', `${currentScreenName} - Componente desmontado`);
      }
    };
  }, []);

  // Función helper para loggear acciones personalizadas
  const logAction = (action, data = null) => {
    if (NavigationLogConfig.logs.userActions) {
      navLog('action', `${currentScreenName} - ${action}`, data || '');
    }
  };

  // Función helper para loggear navegación desde el componente
  const logNavigation = (targetScreen, params = null) => {
    if (NavigationLogConfig.logs.userActions) {
      navLog('navigate', `${currentScreenName} -> ${targetScreen}`, params || '');
    }
  };

  return {
    currentScreenName,
    logAction,
    logNavigation,
    route,
    navigation
  };
};

/**
 * Hook simplificado solo para logging básico
 * @param {string} screenName - Nombre de la pantalla
 */
export const useScreenLogger = (screenName) => {
  useEffect(() => {
    if (NavigationLogConfig.logs.componentMount) {
      navLog('screen', `${screenName} - Activa`);
    }
  }, [screenName]);
};
