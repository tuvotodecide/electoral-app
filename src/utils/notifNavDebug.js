// Logs temporales para depurar la navegación al abrir la app desde una push.
// Se emiten también en release (sin __DEV__). Para verlos en un APK release:
//   adb logcat -s ReactNativeJS:V | grep NOTIF-NAV
// Poner NOTIF_NAV_DEBUG en false (o borrar este archivo y sus usos) al terminar.

export const NOTIF_NAV_DEBUG = false;

const T0 = Date.now();
const MAX_DATA_LENGTH = 1500;

const serialize = data => {
  let text;
  try {
    text = JSON.stringify(data);
  } catch {
    text = String(data);
  }
  if (text && text.length > MAX_DATA_LENGTH) {
    return `${text.slice(0, MAX_DATA_LENGTH)}…(truncated)`;
  }
  return text;
};

export function notifNavLog(source, message, data) {
  if (!NOTIF_NAV_DEBUG) return;
  const elapsed = ((Date.now() - T0) / 1000).toFixed(3);
  const suffix = data === undefined ? '' : ` ${serialize(data)}`;
  console.log(`[NOTIF-NAV +${elapsed}s] [${source}] ${message}${suffix}`);
}

// Resume un estado de navegación: [Splash#ab12c, AuthNavigation#x9y8z*[Connect#.., LoginUser#..*]]
// '*' marca la ruta enfocada; el sufijo # son los últimos caracteres de la key.
export function summarizeNavState(state) {
  if (!state?.routes) return '-';
  const routes = state.routes.map((route, i) => {
    const focused = i === state.index ? '*' : '';
    const key = route.key ? `#${String(route.key).slice(-5)}` : '';
    let child = '';
    if (route.state) {
      child = summarizeNavState(route.state);
    } else if (route.params?.screen) {
      child = `{screen=${route.params.screen}}`;
    }
    return `${route.name}${key}${focused}${child}`;
  });
  return `[${routes.join(', ')}]`;
}

// RootNavigation registra aquí su navigationRef; así este módulo no lo importa
// (evita el ciclo) y describeNav funciona aunque los tests mockeen RootNavigation.
let debugNavRef = null;

export function setNotifNavDebugRef(ref) {
  debugNavRef = ref;
}

export function describeNav() {
  const ref = debugNavRef;
  if (!ref?.isReady?.()) return 'not-ready';
  const current = ref.getCurrentRoute?.()?.name ?? '?';
  return `${current} | ${summarizeNavState(ref.getRootState?.())}`;
}

// Sirve para notificaciones de notifee y RemoteMessage de FCM.
export function summarizeNotification(notification) {
  if (!notification) return null;
  const data =
    notification.data && typeof notification.data === 'object'
      ? notification.data
      : {};
  return {
    id: notification.id ?? null,
    messageId: notification.messageId ?? null,
    type: data.type ?? data.notificationType ?? null,
    screen: data.screen ?? null,
    dataKeys: Object.keys(data),
  };
}
