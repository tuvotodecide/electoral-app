// // src/notifications.js
// // import messaging from '@react-native-firebase/messaging';
// import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
// import {navigate} from './navigation/RootNavigation';
// import store from './redux/store';
// import {setPendingNav} from './redux/slices/authSlice';


// export async function registerNotifications() {
//   await notifee.createChannel({
//     id: 'high_prio',
//     name: 'High priority',
//     importance: AndroidImportance.HIGH,
//   });

//   messaging().onMessage(async msg => {
//     maybeStorePendingNav(msg);
//     display(msg);
//   });

//   messaging().setBackgroundMessageHandler(display);
//   notifee.onForegroundEvent(({type, detail}) => {
//     if (type === EventType.PRESS) handleNotificationPress(detail.notification);
//   });
//   notifee.onBackgroundEvent(async ({type, detail}) => {
//     if (type === EventType.PRESS) handleNotificationPress(detail.notification);
//   });
// }

// function maybeStorePendingNav(remoteMessage) {
//   const scr = remoteMessage.data?.screen;
//   const auth = store.getState().auth;
//   if (!scr || !StackNav[scr] || auth.isAuthenticated) return;
//   store.dispatch(setPendingNav({name: scr, params: remoteMessage.data}));
// }

// async function display(remoteMessage) {
//   await notifee.displayNotification({
//     title: remoteMessage.notification?.title ?? 'Tu Voto decide',
//     body: remoteMessage.notification?.body ?? 'Mensaje nuevo',
//     android: {
//       channelId: 'high_prio',
//       smallIcon: 'ic_launcher',
//       importance: AndroidImportance.HIGH,
//       pressAction: {id: 'PRESS'},
//     },
//     data: remoteMessage.data,
//   });
// }
// export function handleNotificationPress(notification) {
//   const d = notification.data ?? {};

 
//   const route =
//     d.screen && StackNav[d.screen]
//       ? {name: d.screen, params: d}
//       : {name: 'Splash'};

//   const {isAuthenticated} = store.getState().auth;

//   if (isAuthenticated) {
//     navigate(route.name, route.params);
//   } else {
//     store.dispatch(setPendingNav(route));
//     navigate('LoginUser');
//   }
// }


// import messaging from '@react-native-firebase/messaging';

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigate } from './navigation/RootNavigation';
import store from './redux/store';
import { setPendingNav } from './redux/slices/authSlice';
import { StackNav } from './navigation/NavigationKey';

// -------------------------------------------------------------------------------------------------
// Registro / permisos / listeners
// -------------------------------------------------------------------------------------------------
export async function registerNotifications() {
  try {
    // iOS (y no molesta en Android): permiso de alertas/badges/sounds
    await notifee.requestPermission();

    // Canal Android
    await notifee.createChannel({
      id: 'high_prio',
      name: 'High priority',
      importance: AndroidImportance.HIGH,
    });

    // Tap con app en foreground
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) handleNotificationPress(detail.notification);
    });

    // Tap con app en background/terminada
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) handleNotificationPress(detail.notification);
    });


  } catch {}
}

// -------------------------------------------------------------------------------------------------
// Helpers de notificaciones locales
// -------------------------------------------------------------------------------------------------
async function displayLocal({ title, body, data }) {
  await notifee.displayNotification({
    title: title ?? 'Tu Voto Decide',
    body: body ?? 'Mensaje nuevo',
    android: {
      channelId: 'high_prio',
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'PRESS' },
    },
    data: data ?? {},
  });
}

/**
 * Notificación local específica para “Acta publicada”.
 * Navega a SuccessScreen con params serializados.
 */
export async function showActaPublishedNotification({ ipfsData, nftData, tableData }) {
  try {
    await displayLocal({
      title: 'Acta publicada',
      body: 'Tu acta fue publicada correctamente. Toca para ver y compartir.',
      data: {
        screen: 'SuccessScreen',
        routeParams: JSON.stringify({ ipfsData, nftData, tableData }),
      },
    });
  } catch {}
}

/** Alias para compatibilidad con llamadas existentes (p.ej. displayLocalActaPublished). */
export const displayLocalActaPublished = showActaPublishedNotification;

// -------------------------------------------------------------------------------------------------
// Compatibilidad FCM (si luego lo reactivas)
// -------------------------------------------------------------------------------------------------
async function display(remoteMessage) {
  await notifee.displayNotification({
    title: remoteMessage?.notification?.title ?? 'Tu Voto decide',
    body: remoteMessage?.notification?.body ?? 'Mensaje nuevo',
    android: {
      channelId: 'high_prio',
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'PRESS' },
    },
    data: remoteMessage?.data ?? {},
  });
}

function maybeStorePendingNav(remoteMessage) {
  const d = remoteMessage?.data ?? {};
  const scr = d.screen;
  const auth = store.getState().auth;

  // Si quieres validar pantalla válida:
  // if (!scr || !StackNav[scr] || auth.isAuthenticated) return;
  if (!scr || auth.isAuthenticated) return;

  store.dispatch(setPendingNav({ name: scr, params: d }));
}

// -------------------------------------------------------------------------------------------------
// Handler de taps
// -------------------------------------------------------------------------------------------------
export function handleNotificationPress(notification) {
  const d = notification?.data ?? {};

  // Si viene routeParams serializado (para SuccessScreen), parseamos
  let params = d;
  if (d?.routeParams) {
    try {
      params = JSON.parse(d.routeParams);
    } catch {
      params = d;
    }
  }

  const route = d.screen && StackNav[d.screen]
    ? { name: d.screen, params }
    : { name: 'Splash' };

  const { isAuthenticated } = store.getState().auth;

  if (isAuthenticated) {
    navigate(route.name, route.params);
  } else {
    store.dispatch(setPendingNav(route));
    navigate('LoginUser');
  }
}