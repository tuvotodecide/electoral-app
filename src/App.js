import {PermissionsAndroid, Platform, StatusBar, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import AppNavigator from './navigation';
import {styles} from './themes';
import {useDispatch, useSelector} from 'react-redux';
import messaging from '@react-native-firebase/messaging';
import {BACKEND} from '@env';
import {QueryClient, QueryClientProvider} from 'react-query';
import {DEVICE_TOKEN} from './common/constants';
import {setAsyncStorageData} from './utils/AsyncStorage';
import {registerNotifications} from './notifications';
import {registerDeviceToken} from './utils/registerDeviceToken';
import {useFirebaseUserSetup} from './hooks/useFirebaseUserSetup';
import axios from 'axios';
import { migrateIfNeeded } from './utils/migrateBundle';
const queryClient = new QueryClient();

const App = () => {
  const colors = useSelector(state => state.theme.theme);
  const wallet = useSelector(s => s.wallet.payload);
  const account = useSelector(state => state.account);
  const userData = useSelector(state => state.wallet.payload);
  const [ready, setReady] = useState(false);
  const auth = useSelector(s => s.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    if (auth.isAuthenticated && auth.pendingNav) {
      navigate(auth.pendingNav.name, auth.pendingNav.params);
      dispatch(setPendingNav(null));
    }
  }, [auth.isAuthenticated, auth.pendingNav]);
  useEffect(() => {
    migrateIfNeeded();
  }, []);
  // Configurar Firebase y usuario automáticamente
  const {isInitialized, initializationError} = useFirebaseUserSetup();

  // Mostrar estado de inicialización en logs
  useEffect(() => {
    if (isInitialized) {
      console.log('🎉 Firebase User Setup completado exitosamente');
    }
    if (initializationError) {
      console.error('⚠️ Error en Firebase User Setup:', initializationError);
    }
  }, [isInitialized, initializationError]);

  async function requestNotificationPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const authStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );

      if (authStatus === PermissionsAndroid.RESULTS.GRANTED) {
      }
    }
  }
  useEffect(() => {
    registerNotifications();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    registerDeviceToken().catch(console.error);

    const unsub = messaging().onTokenRefresh(() => {
      registerDeviceToken().catch(console.error);
    });
    return unsub;
  }, []);

  // useEffect(() => {
  //   const fetchToken = async () => {
  //     const token = await messaging().getToken();
  //     console.log('[FCM token]', token);
  //     console.log('[FCM token]');
  //     if (!!token) {
  //       setAsyncStorageData(DEVICE_TOKEN, token);
  //     }
  //     axios
  //       .post(`${BACKEND}device-token`, {token, platform: 'ANDROID'})
  //       .catch(console.error);
  //   };
  //   fetchToken();
  // }, []);

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
