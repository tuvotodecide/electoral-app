// src/notifications.js
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {navigate} from './navigation/RootNavigation';
import store from './redux/store';
import {setPendingNav} from './redux/slices/authSlice';


export async function registerNotifications() {
  await notifee.createChannel({
    id: 'high_prio',
    name: 'High priority',
    importance: AndroidImportance.HIGH,
  });

  messaging().onMessage(async msg => {
    maybeStorePendingNav(msg);
    display(msg);
  });

  messaging().setBackgroundMessageHandler(display);
  notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS) handleNotificationPress(detail.notification);
  });
  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type === EventType.PRESS) handleNotificationPress(detail.notification);
  });
}

function maybeStorePendingNav(remoteMessage) {
  const scr = remoteMessage.data?.screen;
  const auth = store.getState().auth;
  if (!scr || !StackNav[scr] || auth.isAuthenticated) return;
  store.dispatch(setPendingNav({name: scr, params: remoteMessage.data}));
}

async function display(remoteMessage) {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title ?? 'Tu Voto decide',
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
  const d = notification.data ?? {};

 
  const route =
    d.screen && StackNav[d.screen]
      ? {name: d.screen, params: d}
      : {name: 'Splash'};

  const {isAuthenticated} = store.getState().auth;

  if (isAuthenticated) {
    navigate(route.name, route.params);
  } else {
    store.dispatch(setPendingNav(route));
    navigate('LoginUser');
  }
}
