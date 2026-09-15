import {Platform, PermissionsAndroid} from 'react-native';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
  subscribeToTopic,
  unsubscribeFromTopic,
} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import { buildNotificationTextFallback } from '../notifications';
import { notifNavLog, summarizeNotification } from '../utils/notifNavDebug';

export async function ensureFCMSetup() {
  const messaging = getMessaging();

  try {
    await registerDeviceForRemoteMessages(messaging);
  } catch (error) {
    // Desde v26 el registro APNs puede expirar o ser reemplazado por otra llamada
    if (
      error?.code !== 'messaging/registration-timeout' &&
      error?.code !== 'messaging/registration-superseded'
    ) {
      throw error;
    }
  }

  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  return enabled;
}

let _channelId;
// eslint-disable-next-line import/no-unused-modules
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

function sanitizeTopicKey(s) {
  return String(s || '').replace(/[^A-Za-z0-9_-]/g, '');
}

// eslint-disable-next-line import/no-unused-modules
export function makeLocationTopicKey(locationKey) {
  return `loc_${sanitizeTopicKey(locationKey)}`;
}

export async function subscribeToLocationTopic(locationKey) {
  const topic = makeLocationTopicKey(locationKey);
  await subscribeToTopic(getMessaging(), topic);
}

export async function unsubscribeFromLocationTopic(locationKey) {
  const topic = makeLocationTopicKey(locationKey);
  await unsubscribeFromTopic(getMessaging(), topic);
}

export async function subscribeToPushTopic(topic) {
  const normalizedTopic = sanitizeTopicKey(topic);
  if (!normalizedTopic) return null;
  await subscribeToTopic(getMessaging(), normalizedTopic);
  return normalizedTopic;
}

export async function unsubscribeFromPushTopic(topic) {
  const normalizedTopic = sanitizeTopicKey(topic);
  if (!normalizedTopic) return null;
  await unsubscribeFromTopic(getMessaging(), normalizedTopic);
  return normalizedTopic;
}

export function registerBackgroundHandler() {
  // Se ejecuta cuando el app está en background/quit y llega un mensaje data-only o para procesar info
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    notifNavLog('FCM', 'backgroundMessageHandler', summarizeNotification(remoteMessage));
    if (remoteMessage?.notification?.title || remoteMessage?.notification?.body) {
      return;
    }

    const notificationCopy = buildNotificationTextFallback({
      title: remoteMessage?.notification?.title,
      body: remoteMessage?.notification?.body,
      data: remoteMessage?.data ?? {},
    });

    await showLocalNotification({
      title: notificationCopy.title,
      body: notificationCopy.body,
      data: remoteMessage?.data ?? {},
    });
  });
}

let _fgUnsub = null;
// eslint-disable-next-line import/no-unused-modules
export function registerForegroundListener(onForegroundMessage) {
  if (_fgUnsub) {
    _fgUnsub();
    _fgUnsub = null;
  }
  _fgUnsub = onMessage(getMessaging(), async remoteMessage => {
    // Aquí decides qué hacer con la notificación en foreground
    // Por ejemplo: mostrar un modal o un banner in-app
    onForegroundMessage && onForegroundMessage(remoteMessage);
  });
  return () => {
    _fgUnsub && _fgUnsub();
    _fgUnsub = null;
  };
}

// eslint-disable-next-line import/no-unused-modules
export function registerOpenHandlers(onOpened) {
  const messaging = getMessaging();
  const unsubOpen = onNotificationOpenedApp(messaging, remoteMessage => {
    notifNavLog('FCM', 'onNotificationOpenedApp', summarizeNotification(remoteMessage));
    onOpened && onOpened(remoteMessage);
  });

  (async () => {
    const initial = await getInitialNotification(messaging);
    notifNavLog(
      'FCM',
      'getInitialNotification',
      initial ? summarizeNotification(initial) : null,
    );
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
  notifNavLog('FCM', 'initNotifications: ensureFCMSetup start');
  await ensureFCMSetup();
  notifNavLog('FCM', 'initNotifications: ensureFCMSetup done, registering open handlers');

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
