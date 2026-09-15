import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { captureError } from './config/sentry';
import { Platform, StatusBar, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BROADCAST_TOPIC } from '@env';
import { LAST_TOPIC_KEY, LAST_USER_TOPIC_KEY } from './common/constants';
import AppNavigator from './navigation';
import { navigate } from './navigation/RootNavigation';
import {
  buildNotificationTextFallback,
  consumePendingNotificationNavigation,
  handleNotificationPress,
  markNotificationAsAlerted,
  registerNotifications,
} from './notifications';
import { setAuthenticated, setPendingNav } from './redux/slices/authSlice';
import { isSessionValid } from './utils/Session';
import {
  ensureFCMSetup,
  initNotifications,
  showLocalNotification,
  subscribeToPushTopic,
  subscribeToLocationTopic,
} from './services/notifications';
import { styles } from './themes';
import { notifNavLog } from './utils/notifNavDebug';

import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import CustomModal from './components/common/CustomModal';

const queryClient = new QueryClient();

const App = () => {
  const colors = useSelector(state => state.theme.theme);
  const auth = useSelector(s => s.auth);
  const userData = useSelector(state => state.wallet?.payload);
  const dispatch = useDispatch();
  const vc = userData?.vc;
  const credentialSubject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const notificationDni =
    credentialSubject?.nationalIdNumber ||
    credentialSubject?.documentNumber ||
    credentialSubject?.governmentIdentifier ||
    userData?.dni;

  // Cada montaje de la raíz arranca en Splash y siempre pide el PIN. Android
  // puede reutilizar el proceso (y el store en memoria) al reabrir la app desde
  // una push, así que resetAuthOnRehydrate no basta. useLayoutEffect corre antes
  // de los useEffect de AppNavigator y de App que procesan la notificación.
  useLayoutEffect(() => {
    notifNavLog('App', 'root mounted: resetting isAuthenticated', {
      wasAuthenticated: auth.isAuthenticated,
    });
    dispatch(setAuthenticated(false));
    // Solo una vez por montaje de la raíz; no debe repetirse tras el login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mustUpdate, setMustUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const inAppUpdatesRef = useRef(null);
  const updateCheckedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || __DEV__) {
      return;
    }

    inAppUpdatesRef.current = new SpInAppUpdates(false);

    const checkUpdate = async () => {
      if (updateCheckedRef.current) return;
      updateCheckedRef.current = true;

      try {
        const result = await inAppUpdatesRef.current.checkNeedsUpdate();
        if (!result?.shouldUpdate) {
          return;
        }
        try {
          setIsUpdating(true);
          await inAppUpdatesRef.current.startUpdate({
            updateType: IAUUpdateKind.IMMEDIATE,
          });

          const after = await inAppUpdatesRef.current.checkNeedsUpdate();
          if (after?.shouldUpdate) {
            setMustUpdate(true);
          }
        } catch (e) {
          setMustUpdate(true);
        } finally {
          setIsUpdating(false);
        }
      } catch (e) {

      }
    };

    const timer = setTimeout(checkUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateNow = async () => {
    if (!inAppUpdatesRef.current || isUpdating) return;
    try {
      setIsUpdating(true);
      await inAppUpdatesRef.current.startUpdate({
        updateType: IAUUpdateKind.IMMEDIATE,
      });

      const after = await inAppUpdatesRef.current.checkNeedsUpdate();
      if (!after?.shouldUpdate) {
        setMustUpdate(false);
      }
    } catch (e) {
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    notifNavLog('App', 'auth state', {
      isAuthenticated: auth.isAuthenticated,
      pendingNav: auth.pendingNav?.name ?? null,
      pendingNotificationTarget:
        auth.pendingNotificationNavigation?.targetRoute ?? null,
    });
  }, [auth.isAuthenticated, auth.pendingNav, auth.pendingNotificationNavigation]);

  useEffect(() => {
    let cleanup;
    // Si este efecto corre más de una vez (cambia notificationDni), se vuelve
    // a llamar getInitialNotification de FCM.
    notifNavLog('App', 'notifications effect run (initNotifications)', {
      hasDni: Boolean(notificationDni),
    });
    (async () => {
      await registerNotifications({ askPermissionOnInit: false });
      cleanup = await initNotifications({
        onForegroundMessage: async msg => {
          try {
            const notificationCopy = buildNotificationTextFallback({
              title: msg?.notification?.title,
              body: msg?.notification?.body,
              data: msg?.data ?? {},
            });
            await showLocalNotification({
              title: notificationCopy.title,
              body: notificationCopy.body,
              data: msg?.data,
            });
            await markNotificationAsAlerted({
              dni: notificationDni,
              notification: {
                title: notificationCopy.title,
                body: notificationCopy.body,
                data: msg?.data ?? {},
              },
            });
          } catch (e) {
            captureError(e, {
              flow: 'notification',
              step: 'foreground_handler',
              critical: false,
            });
          }
        },
        onOpenedFromNotification: msg => {
          try {
            const data = msg?.data || {};
            notifNavLog('App', 'onOpenedFromNotification', {
              messageId: msg?.messageId ?? null,
              dataKeys: Object.keys(data),
            });
            if (!data || Object.keys(data).length === 0) return;
            handleNotificationPress({ data }, { source: 'fcm.opened' });
          } catch (e) {
            captureError(e, {
              flow: 'notification',
              step: 'opened_from_notification',
              critical: false,
            });
          }
        },
      });
    })();
    return () => {
      cleanup && cleanup();
    };
  }, [notificationDni]);
  useEffect(() => {
    const resubscribeStoredTopics = async () => {
      try {
        await subscribeToPushTopic(BROADCAST_TOPIC);
      } catch (_e) { }

      const lastLocationTopic = await AsyncStorage.getItem(LAST_TOPIC_KEY);
      if (lastLocationTopic) {
        const rawId = lastLocationTopic.replace('loc_', '');
        try {
          await subscribeToLocationTopic(rawId);
        } catch (_e) { }
      }

      const lastUserTopic = await AsyncStorage.getItem(LAST_USER_TOPIC_KEY);
      if (lastUserTopic) {
        try {
          await subscribeToPushTopic(lastUserTopic);
        } catch (_e) { }
      }
    };

    (async () => {
      await ensureFCMSetup();
      await resubscribeStoredTopics();
    })();
    const unsub = onTokenRefresh(getMessaging(), async () => {
      await resubscribeStoredTopics();
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    let active = true;
    if (auth.isAuthenticated && auth.pendingNav) {
      (async () => {
        let valid = false;
        try {
          valid = await isSessionValid();
        } catch {
          valid = false;
        }
        if (!active || !valid) return;
        notifNavLog('App', `pendingNav -> ${auth.pendingNav.name}`);
        navigate(auth.pendingNav.name, auth.pendingNav.params);
        dispatch(setPendingNav(null));
      })();
    }
    return () => {
      active = false;
    };
  }, [auth.isAuthenticated, auth.pendingNav, dispatch]);

  useEffect(() => {
    if (!auth.pendingNotificationNavigation || !auth.isAuthenticated) return undefined;
    let active = true;
    let retryTimer = null;
    const tryConsumePendingNotification = async () => {
      if (!active) return;
      let valid = false;
      try {
        valid = await isSessionValid();
      } catch {
        valid = false;
      }
      if (!active) return;
      if (!valid) {
        notifNavLog('App', 'pending notification: session not valid yet, retry in 250ms');
        retryTimer = setTimeout(tryConsumePendingNotification, 250);
        return;
      }

      const consumed = await consumePendingNotificationNavigation('App.pendingEffect');
      notifNavLog('App', 'pending notification consumed?', { consumed, active });
      if (!active || consumed) return;
      retryTimer = setTimeout(tryConsumePendingNotification, 250);
    };

    tryConsumePendingNotification();
    return () => {
      active = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [auth.isAuthenticated, auth.pendingNotificationNavigation]);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.flex}>
        <StatusBar
          barStyle={colors?.dark === 'dark' ? 'light-content' : 'dark-content'}
        />
        <AppNavigator />

        <CustomModal
          visible={mustUpdate}
          onClose={() => { }} // no permitir cerrarlo
          title="Actualización requerida"
          message="Hay una nueva versión disponible. Debes actualizar la app para continuar."
          type="warning"
          buttonText={isUpdating ? 'Actualizando...' : 'Actualizar ahora'}
          onButtonPress={handleUpdateNow}
        />
      </View>
    </QueryClientProvider>
  );
};

// Wrap con Sentry para captura automatica de errores en componentes
export default Sentry.wrap(App);
