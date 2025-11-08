import {Platform, StatusBar, View} from 'react-native';
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
import {registerNotifications} from './notifications';
import messaging from '@react-native-firebase/messaging';
import {LAST_TOPIC_KEY} from './common/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import wira from 'wira-sdk';

import SpInAppUpdates, {IAUUpdateKind} from 'sp-react-native-in-app-updates';
import CustomModal from './components/common/CustomModal';

wira.initWiraSdk({appId: 'tuvotodecide', guardiansUrl: BACKEND_IDENTITY});

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
        console.log('Error verificando actualización', e);
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
      console.log('Error en startUpdate desde modal', e);
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

        <CustomModal
          visible={mustUpdate}
          onClose={() => {}} // no permitir cerrarlo
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

export default App;
