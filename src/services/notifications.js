import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

export async function ensureFCMSetup() {
  await messaging().registerDeviceForRemoteMessages();

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  return enabled;
}

let _channelId;
export async function ensureNotifChannel() {
  if (_channelId) return _channelId;
  _channelId = await notifee.createChannel({
    id: 'counts',
    name: 'Anuncios de conteo',
    importance: AndroidImportance.HIGH,
  });
  return _channelId;
}

// Mostrar notificación del sistema (la app puede estar en foreground)
export async function showLocalNotification({title, body, data} = {}) {
  const channelId = await ensureNotifChannel();
  await notifee.displayNotification({
    title: title ?? 'Aviso',
    body: body ?? '',
    data: data || {},
    android: {
      channelId,
      pressAction: {id: 'default'}, 
    },
    ios: {
      // para que aparezca banner/sonido en foreground
      foregroundPresentationOptions: {alert: true, sound: true, badge: true},
    },
  });
}

export async function getFCMToken() {
  // Útil si luego quisieras enviar direct-to-device (no necesario para tópicos)
  const token = await messaging().getToken();
  return token;
}
function sanitizeTopicKey(s) {
  return String(s || '').replace(/[^A-Za-z0-9_-]/g, '');
}
export function makeLocationTopicKey(locationKey) {
  return `loc_${sanitizeTopicKey(locationKey)}`;
}

export async function subscribeToLocationTopic(locationKey) {
  const topic = makeLocationTopicKey(locationKey);
  await messaging().subscribeToTopic(topic);
}

export async function unsubscribeFromLocationTopic(locationKey) {
  const topic = makeLocationTopicKey(locationKey);
  await messaging().unsubscribeFromTopic(topic);
}

export function registerBackgroundHandler() {
  // Se ejecuta cuando el app está en background/quit y llega un mensaje data-only o para procesar info
  messaging().setBackgroundMessageHandler(async remoteMessage => {

  });
}

let _fgUnsub = null;
export function registerForegroundListener(onMessage) {
  if (_fgUnsub) {
    _fgUnsub();
    _fgUnsub = null;
  }
  _fgUnsub = messaging().onMessage(async remoteMessage => {
    // Aquí decides qué hacer con la notificación en foreground
    // Por ejemplo: mostrar un modal o un banner in-app
    onMessage && onMessage(remoteMessage);
  });
  return () => {
    _fgUnsub && _fgUnsub();
    _fgUnsub = null;
  };
}

export function registerOpenHandlers(onOpened) {
  const unsubOpen = messaging().onNotificationOpenedApp(remoteMessage => {
    onOpened && onOpened(remoteMessage);
  });

  (async () => {
    const initial = await messaging().getInitialNotification();
    if (initial && onOpened) onOpened(initial);
  })();

  return () => {
    unsubOpen && unsubOpen();
  };
}

export async function initNotifications({
  onForegroundMessage,
  onOpenedFromNotification,
} = {}) {
  // Permisos + registro
  await ensureFCMSetup();

  // Foreground
  const unsubFG = registerForegroundListener(onForegroundMessage);

  // Opened (background/quit)
  const unsubOpen = registerOpenHandlers(onOpenedFromNotification);

  // Devuelve funciones para desuscribir si necesitas
  return () => {
    unsubFG && unsubFG();
    unsubOpen && unsubOpen();
  };
}

export const formatTiempoRelativo = timestamp => {
  const ahora = Date.now();
  const diferencia = ahora - timestamp;

  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  if (minutos < 60) {
    return `${minutos} min atrás`;
  } else if (horas < 24) {
    return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
  } else {
    return `${dias} día${dias > 1 ? 's' : ''} atrás`;
  }
};
