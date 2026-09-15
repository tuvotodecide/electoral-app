import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigation from './type/StackNavigation';
import { navigationRef } from './RootNavigation';
import notifee from '@notifee/react-native';
import { handleNotificationPress } from '../notifications';
import { NavigationLogConfig, navLog } from '../config/navigationLogConfig';
import NavigationDebugOverlay from '../components/common/NavigationDebugOverlay';
import { addNavigationBreadcrumb } from '../config/sentry';
import {
  describeNav,
  notifNavLog,
  summarizeNotification,
} from '../utils/notifNavDebug';

export default function AppNavigator() {
  useEffect(() => {
    (async () => {
      const initial = await notifee.getInitialNotification();
      notifNavLog(
        'AppNavigator',
        'notifee.getInitialNotification',
        initial
          ? {
              pressActionId: initial.pressAction?.id ?? null,
              notification: summarizeNotification(initial.notification),
            }
          : null,
      );
      if (initial) {
        handleNotificationPress(initial.notification, {
          source: 'notifee.getInitialNotification',
        });
      }
    })();
  }, []);

  // Registra toda acción de navegación, incluidas las despachadas desde
  // screens (Splash, Connect...). action.source es la key de la ruta que la
  // despachó (empieza con el nombre de la pantalla).
  useEffect(() => {
    return navigationRef.addListener?.('__unsafe_action__', e => {
      const action = e?.data?.action;
      notifNavLog('NavAction', action?.type ?? 'unknown', {
        name: action?.payload?.name ?? null,
        screen: action?.payload?.params?.screen ?? null,
        source: action?.source ?? null,
        target: action?.target ?? null,
        noop: e?.data?.noop ?? null,
        before: describeNav(),
      });
    });
  }, []);

  // Función para obtener información detallada de la ruta actual
  const getRouteInfo = () => {
    if (navigationRef.isReady()) {
      const state = navigationRef.getRootState();
      const route = navigationRef.getCurrentRoute();

      return {
        routeName: route?.name || 'Unknown',
        routeParams: route?.params || {},
        stackInfo: getStackPath(state)
      };
    }
    return { routeName: 'Not Ready', routeParams: {}, stackInfo: [] };
  };

  // Función auxiliar para obtener el path completo del stack
  const getStackPath = (state) => {
    const path = [];
    let currentState = state;

    while (currentState) {
      if (currentState.routes && currentState.index !== undefined) {
        const route = currentState.routes[currentState.index];
        path.push(route.name);
        currentState = route.state;
      } else {
        break;
      }
    }

    return path;
  };

  // Handler para logging del cambio de estado
  const onNavigationStateChange = () => {
    const routeInfo = getRouteInfo();
    notifNavLog('NavState', `now on ${routeInfo.routeName}`, {
      state: describeNav(),
    });

    // ========================================================================
    // SENTRY: Agregar breadcrumb de navegacion
    // ========================================================================
    addNavigationBreadcrumb(routeInfo.routeName, routeInfo.routeParams);
    // ========================================================================


    if (!NavigationLogConfig.enabled) return;



    // Log usando configuración
    navLog('stateChanges', `Pantalla actual: ${routeInfo.routeName}`);

    if (NavigationLogConfig.logs.stackPath) {
      navLog('stack', `Stack path: ${routeInfo.stackInfo.join(' -> ')}`);
    }

    if (NavigationLogConfig.logs.routeParams && Object.keys(routeInfo.routeParams).length > 0) {
      navLog('params', `Parámetros: ${routeInfo.routeName}`, routeInfo.routeParams);
    }

    // Log simple para identificación rápida
    navLog('screen', routeInfo.routeName);
  };

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        onReady={() =>
          notifNavLog('AppNavigator', 'NavigationContainer ready', {
            state: describeNav(),
          })
        }
        onStateChange={onNavigationStateChange}
      >
        <StackNavigation />
      </NavigationContainer>

      {/* Overlay de debug opcional */}
      {NavigationLogConfig.visual.showOverlay && (
        <NavigationDebugOverlay
          position={NavigationLogConfig.visual.overlayPosition}
        />
      )}
    </>
  );
}
