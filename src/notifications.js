// src/notifications.js
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {navigate} from './navigation/RootNavigation';
import store from './redux/store';
import {setPendingNav} from './redux/slices/authSlice';

/**
 * Registra todos los handlers de FCM + Notifee
 * Llamar UNA sola vez al iniciar la app.
 */
export async function registerNotifications() {
  await notifee.createChannel({
    id: 'high_prio',
    name: 'High priority',
    importance: AndroidImportance.HIGH,
  });

  messaging().onMessage(display);

  messaging().setBackgroundMessageHandler(display);
  notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      handleNotificationPress(detail.notification);
    }
  });
  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      handleNotificationPress(detail.notification);
    }
  });
}

async function display(remoteMessage) {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title ?? 'Wira Wallet',
    body: remoteMessage.notification?.body ?? 'Mensaje nuevo',
    android: {
      channelId: 'high_prio',
      smallIcon: 'ic_launcher',
      importance: AndroidImportance.HIGH,
      pressAction: {id: 'PRESS'},
    },
    data: remoteMessage.data,
  });
}
export function handleNotificationPress(notification) {
  console.log('[Notif-press] data →', notification.data);
  const d = notification.data || {};
  const target =
    d.type === 'INVITE'
      ? {name: d.screen || 'AddGuardians', params: {invId: d.invId}}
      : d.type === 'TRANSACTION'
      ? {name: d.screen || 'TransactionDetails', params: {txId: d.txId}}
      : {name: 'Home'};
  const {isAuthenticated} = store.getState().auth;
  console.log(isAuthenticated);

  if (isAuthenticated) {
    navigate(target.name, target.params);
  } else {
    store.dispatch(setPendingNav(target));
    navigate('LoginUser');
  }
}
