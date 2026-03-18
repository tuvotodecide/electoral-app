import { BACKEND_RESULT } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { captureError } from './config/sentry';
import { Platform, StatusBar, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LAST_TOPIC_KEY, LAST_USER_TOPIC_KEY } from './common/constants';
import AppNavigator from './navigation';
import { navigate } from './navigation/RootNavigation';
import { handleNotificationPress, registerNotifications } from './notifications';
import { setPendingNav } from './redux/slices/authSlice';
import {
  ensureFCMSetup,
  initNotifications,
  showLocalNotification,
  subscribeToPushTopic,
  subscribeToLocationTopic,
  unsubscribeFromPushTopic,
} from './services/notifications';
import { styles } from './themes';
import { migrateIfNeeded } from './utils/migrateBundle';
import { authenticateWithBackend } from './utils/offlineQueueHandler';

import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import CustomModal from './components/common/CustomModal';

const queryClient = new QueryClient();

const App = () => {
  const colors = useSelector(state => state.theme.theme);
  const auth = useSelector(s => s.auth);
  const userData = useSelector(state => state.wallet.payload);
  const dispatch = useDispatch();
  const userTopicRef = useRef(null);

  const [mustUpdate, setMustUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const inAppUpdatesRef = useRef(null);
  const updateCheckedRef = useRef(false);
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ??
    subject?.documentNumber ??
    subject?.governmentIdentifier ??
    userData?.dni;

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
    let cleanup;
    (async () => {
      await registerNotifications({ askPermissionOnInit: false });
      cleanup = await initNotifications({
        onForegroundMessage: async msg => {
          try {
            await showLocalNotification({
              title: msg?.notification?.title ?? msg?.data?.title,
              body: msg?.notification?.body ?? msg?.data?.body,
              data: msg?.data,
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
            if (!data || Object.keys(data).length === 0) return;
            handleNotificationPress({ data });
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
  }, []);
  useEffect(() => {
    const resubscribeStoredTopics = async () => {
      const lastLocationTopic = await AsyncStorage.getItem(LAST_TOPIC_KEY);
      if (lastLocationTopic) {
        const rawId = lastLocationTopic.replace('loc_', '');
        try {
          await subscribeToLocationTopic(rawId);
        } catch (e) { }
      }

      const lastUserTopic = await AsyncStorage.getItem(LAST_USER_TOPIC_KEY);
      if (lastUserTopic) {
        try {
          await subscribeToPushTopic(lastUserTopic);
        } catch (e) { }
      }
    };

    (async () => {
      await ensureFCMSetup();
      await resubscribeStoredTopics();
    })();
    const unsub = messaging().onTokenRefresh(async () => {
      await resubscribeStoredTopics();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const clearUserTopicSubscription = async () => {
      const previousTopic =
        userTopicRef.current || (await AsyncStorage.getItem(LAST_USER_TOPIC_KEY));
      if (!previousTopic) return;

      try {
        await unsubscribeFromPushTopic(previousTopic);
      } catch (error) {
        console.warn('[PushTopic] Failed to unsubscribe previous user topic', error);
      }

      userTopicRef.current = null;
      await AsyncStorage.removeItem(LAST_USER_TOPIC_KEY);
    };

    const syncUserTopicSubscription = async () => {
      console.log('[PushTopic] syncUserTopicSubscription invoked', {
        isAuthenticated: Boolean(auth?.isAuthenticated),
        hasDni: Boolean(dni),
        hasDid: Boolean(userData?.did),
        hasPrivKey: Boolean(userData?.privKey),
      });

      if (!auth?.isAuthenticated || !dni || !userData?.did || !userData?.privKey) {
        console.log('[PushTopic] Skipping user topic sync due to missing session data', {
          isAuthenticated: Boolean(auth?.isAuthenticated),
          hasDni: Boolean(dni),
          hasDid: Boolean(userData?.did),
          hasPrivKey: Boolean(userData?.privKey),
        });
        await clearUserTopicSubscription();
        return;
      }

      try {
        console.log('[PushTopic] Calling authenticateWithBackend', {
          dni,
          backendResult: String(BACKEND_RESULT || '').replace(/\/+$/, ''),
          hasDid: Boolean(userData?.did),
          hasPrivKey: Boolean(userData?.privKey),
        });

        const apiKey = await authenticateWithBackend(userData.did, userData.privKey);
        console.log('[PushTopic] authenticateWithBackend resolved', {
          dni,
          hasApiKey: Boolean(apiKey),
          apiKeyPrefix: apiKey ? String(apiKey).slice(0, 8) : null,
        });

        if (!apiKey) {
          console.warn('[PushTopic] Missing backend API key, skipping user topic sync');
          return;
        }

        const requestUrl = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1/users/${encodeURIComponent(
          dni,
        )}`;

        console.log('[PushTopic] Resolved API key for user lookup', {
          dni,
          requestUrl,
          apiKeyPrefix: String(apiKey).slice(0, 8),
        });

        const response = await fetch(
          requestUrl,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          },
        );

        if (!response.ok) {
          const responseText = await response.text().catch(() => '');
          console.warn('[PushTopic] User lookup failed', {
            dni,
            requestUrl,
            status: response.status,
            responseText,
          });
          throw new Error(`user_lookup_failed_${response.status}`);
        }

        const payload = await response.json();
        const backendUserId = String(payload?._id || payload?.id || '').trim();
        if (!backendUserId) {
          console.warn('[PushTopic] User lookup returned payload without id', {
            dni,
            requestUrl,
            payload,
          });
          throw new Error('missing_backend_user_id');
        }

        const nextTopic = `user_${backendUserId}`;
        const previousTopic =
          userTopicRef.current || (await AsyncStorage.getItem(LAST_USER_TOPIC_KEY));

        if (previousTopic && previousTopic !== nextTopic) {
          await unsubscribeFromPushTopic(previousTopic);
        }

        await subscribeToPushTopic(nextTopic);

        if (cancelled) return;

        userTopicRef.current = nextTopic;
        await AsyncStorage.setItem(LAST_USER_TOPIC_KEY, nextTopic);
        console.log('[PushTopic] User topic subscription ready', {
          dni,
          topic: nextTopic,
          backendUserId,
        });
      } catch (error) {
        console.warn('[PushTopic] Failed to sync user topic subscription', {
          dni,
          message: error?.message || String(error),
          stack: error?.stack || null,
        });
      }
    };

    syncUserTopicSubscription();

    return () => {
      cancelled = true;
    };
  }, [auth?.isAuthenticated, dni, userData?.did, userData?.privKey]);
  useEffect(() => {
    if (auth.isAuthenticated && auth.pendingNav) {
      navigate(auth.pendingNav.name, auth.pendingNav.params);
      dispatch(setPendingNav(null));
    }
  }, [auth.isAuthenticated, auth.pendingNav]);

  useEffect(() => {
    migrateIfNeeded();
  }, []);

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
