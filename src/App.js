import {StatusBar, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import AppNavigator from './navigation';
import {styles} from './themes';
import {BACKEND_IDENTITY} from '@env';
import {useDispatch, useSelector} from 'react-redux';
import {QueryClient, QueryClientProvider} from 'react-query';
import {migrateIfNeeded} from './utils/migrateBundle';
import {navigate} from './navigation/RootNavigation';
import {setPendingNav} from './redux/slices/authSlice';
import {
  initNotifications,
  ensureFCMSetup,
  subscribeToLocationTopic,
  showLocalNotification,
} from './services/notifications';
import messaging from '@react-native-firebase/messaging';
import {LAST_TOPIC_KEY} from './common/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';
import wira from 'wira-sdk';
wira.initWiraSdk({
  appId: 'tuvotodecide',
  guardiansUrl: BACKEND_IDENTITY,
});

const queryClient = new QueryClient();

const App = () => {
  const colors = useSelector(state => state.theme.theme);
  const wallet = useSelector(s => s.wallet.payload);
  const account = useSelector(state => state.account);
  const userData = useSelector(state => state.wallet.payload);
  const [ready, setReady] = useState(false);
  const auth = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const processingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || __DEV__) {
      // Solo Android y solo en build de producción
      return;
    }

    const inAppUpdates = new SpInAppUpdates(false); // false = no debug

    const checkUpdate = async () => {
      try {
        const result = await inAppUpdates.checkNeedsUpdate();
        // result.shouldUpdate = true si hay versión más nueva en Play
        if (result.shouldUpdate) {
          const options = {
            updateType: IAUUpdateKind.IMMEDIATE, // actualización forzosa
          };
          await inAppUpdates.startUpdate(options);
          // A partir de aquí, Google muestra SU UI de actualización
          // y bloquea el uso de la app hasta actualizar.
        }
      } catch (e) {
        console.log('Error verificando actualización', e);
      }
    };

    checkUpdate();
  }, []);

  useEffect(() => {
    let cleanup;

    (async () => {
      cleanup = await initNotifications({
        onForegroundMessage: async msg => {
          try {
            await showLocalNotification({
              title: msg?.notification?.title ?? msg?.data?.title,
              body: msg?.notification?.body ?? msg?.data?.body,
              data: msg?.data,
            });
          } catch (e) {
            console.error('FG handler error', e, msg);
          }
        },
        onOpenedFromNotification: _msg => {},
      });
    })();

    return () => {
      cleanup && cleanup();
    };
  }, []);

  useEffect(() => {
    (async () => {
      await ensureFCMSetup();
      const last = await AsyncStorage.getItem(LAST_TOPIC_KEY);
      if (last) {
        const rawId = last.replace('loc_', '');
        try {
          await subscribeToLocationTopic(rawId);
        } catch (e) {}
      }
    })();

    const unsub = messaging().onTokenRefresh(async () => {
      const last = await AsyncStorage.getItem(LAST_TOPIC_KEY);
      if (last) {
        const rawId = last.replace('loc_', '');
        try {
          await subscribeToLocationTopic(rawId);
        } catch (e) {}
      }
    });

    return () => unsub();
  }, []);

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
      </View>
    </QueryClientProvider>
  );
};

export default App;
