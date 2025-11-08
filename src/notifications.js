// C:\apps\electoralmobile\src\notifications.js

import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {navigate} from './navigation/RootNavigation';
import store from './redux/store';
import {setPendingNav} from './redux/slices/authSlice';
import {StackNav, TabNav} from './navigation/NavigationKey';

export const HIGH_PRIO_CHANNEL_ID = 'high_prio';

export async function ensureNotificationChannel() {
  try {
    await notifee.createChannel({
      id: HIGH_PRIO_CHANNEL_ID,
      name: 'High priority',
      importance: AndroidImportance.HIGH,
    });
  } catch {}
}

export async function registerNotifications({
  askPermissionOnInit = false,
} = {}) {
  try {
    if (askPermissionOnInit) {
      await notifee.requestPermission();
    }

    await ensureNotificationChannel();

    // Tap con app en foreground
    notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS)
        handleNotificationPress(detail.notification);
    });
  } catch {}
}

notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.PRESS) {
    handleNotificationPressBackground(detail.notification);
  }
});

/**
 * Muestra una notificación local genérica.
 */
export async function showLocalNotification({title, body, data, android = {}}) {
  await ensureNotificationChannel();
  await notifee.displayNotification({
    title: title ?? 'Tu Voto Decide',
    body: body ?? 'Mensaje nuevo',
    android: {
      channelId: HIGH_PRIO_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: {id: 'PRESS'},
      ...android,
    },
    data: data ?? {},
  });
}

/**
 * Notificación local específica para “Acta publicada”.
 * Navega a SuccessScreen con params serializados en data.routeParams.
 */
export async function showActaPublishedNotification({
  ipfsData,
  nftData,
  tableData,
  certificateData,
}) {
  try {
    await showLocalNotification({
      title: 'Acta publicada',
      body: 'Tu acta fue publicada correctamente. ',
      data: {
        screen: 'SuccessScreen',
        routeParams: JSON.stringify({
          ipfsData,
          nftData,
          tableData,
          certificateData,
        }),
      },
    });
  } catch {}
}
export async function showActaDuplicateNotification({
  reason = 'Ya atestiguaste esta mesa.',
} = {}) {
  await showLocalNotification({
    title: 'Acta descartada',
    body: reason,
  });
}

/** Alias de compatibilidad con llamadas existentes. */
export const displayLocalActaPublished = showActaPublishedNotification;

/**
 * (Opcional) Puente para FCM si más adelante lo reactivas.
 * Llama esto desde tu handler de onMessage/onBackgroundMessage para mostrar el push.
 */
export async function displayRemoteMessage(remoteMessage) {
  await ensureNotificationChannel();
  await notifee.displayNotification({
    title: remoteMessage?.notification?.title ?? 'Tu Voto Decide',
    body: remoteMessage?.notification?.body ?? 'Mensaje nuevo',
    android: {
      channelId: HIGH_PRIO_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: {id: 'PRESS'},
    },
    data: remoteMessage?.data ?? {},
  });
}

/**
 * (Opcional) Guardar navegación pendiente cuando llega push y el usuario no está logueado.
 */
export function maybeStorePendingNavFromRemote(remoteMessage) {
  const d = remoteMessage?.data ?? {};
  const scr = d.screen;
  const auth = store.getState().auth;

  // Si quieres validar pantalla válida:
  // if (!scr || !StackNav[scr] || auth.isAuthenticated) return;
  if (!scr || auth.isAuthenticated) return;

  store.dispatch(setPendingNav({name: scr, params: d}));
}

function buildRouteFromNotification(notification) {
  const data = notification?.data ?? {};
  if (data?.type === 'announce_count') {
    return {
      name: StackNav.TabNavigation,
      params: {screen: TabNav.HomeScreen},
    };
  }

  let params = data;
  if (data?.routeParams) {
    try {
      params = JSON.parse(data.routeParams);
    } catch {
      params = data;
    }
  }

  const name =
    data.screen && StackNav[data.screen]
      ? data.screen
      : StackNav.Splash ?? 'Splash';

  return {name, params};
}

/**
 * Handler de taps en notificaciones (locales o remotas a través de notifee).
 * Soporta data.routeParams (JSON) para pantallas que necesiten objetos complejos.
 */
export function handleNotificationPress(notification) {
  const route = buildRouteFromNotification(notification);

  const {isAuthenticated} = store.getState().auth;

  if (isAuthenticated) {
    navigate(route.name, route.params);
  } else {
    store.dispatch(setPendingNav(route));
    navigate('LoginUser');
  }
}

function handleNotificationPressBackground(notification) {
  const route = buildRouteFromNotification(notification);
  store.dispatch(setPendingNav(route));
}
