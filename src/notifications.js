// C:\apps\electoralmobile\src\notifications.js

import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {navigate} from './navigation/RootNavigation';
import store from './redux/store';
import {setPendingNav} from './redux/slices/authSlice';
import {StackNav, TabNav} from './navigation/NavigationKey';

export const HIGH_PRIO_CHANNEL_ID = 'high_prio';
const LOCAL_NOTIFICATIONS_STORAGE_KEY = '@local-notifications:v1';
const MAX_LOCAL_NOTIFICATIONS = 80;
const BACKEND_ONLY_NOTIFICATION_TYPES = new Set([
  'acta_published',
  'participation_certificate',
]);

const safeParse = raw => {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeNotificationField = value =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const normalizeNotificationTypeForDedupe = typeValue => {
  const normalized = normalizeNotificationField(typeValue);
  if (
    normalized === 'acta_published' ||
    normalized === 'participation_certificate'
  ) {
    return 'attestation_result';
  }
  return normalized;
};

const extractNotificationTimestampMs = notification => {
  const raw =
    notification?.createdAt ||
    notification?.timestamp ||
    notification?.data?.createdAt ||
    notification?.data?.timestamp ||
    0;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 9999999999 ? raw : raw * 1000;
  }

  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isLocalNotification = notification => {
  if (notification?.source === 'local') return true;
  const rawId = normalizeNotificationField(notification?._id || notification?.id);
  return rawId.startsWith('local_');
};

const shouldSuppressLocalNotification = notification => {
  if (!isLocalNotification(notification)) return false;
  const notificationType = normalizeNotificationField(
    notification?.data?.type ||
      notification?.type ||
      notification?.notificationType,
  );
  return BACKEND_ONLY_NOTIFICATION_TYPES.has(notificationType);
};

const buildNotificationSemanticKey = notification => {
  const data =
    notification?.data && typeof notification.data === 'object'
      ? notification.data
      : {};

  const notificationType = normalizeNotificationTypeForDedupe(
    data?.type || notification?.type || notification?.notificationType,
  );
  const tableNumber = normalizeNotificationField(
    data?.tableNumber ||
      data?.table_number ||
      notification?.tableNumber ||
      notification?.table_number,
  );
  const tableCode = normalizeNotificationField(
    data?.tableCode ||
      data?.table_code ||
      notification?.tableCode ||
      notification?.table_code,
  );
  const electionId = normalizeNotificationField(
    data?.electionId || data?.election_id || notification?.electionId,
  );
  const locationId = normalizeNotificationField(
    data?.locationId ||
      data?.location_id ||
      data?.electoralLocationId ||
      notification?.locationId,
  );
  const title = normalizeNotificationField(data?.title || notification?.title);
  const body = normalizeNotificationField(data?.body || notification?.body);

  if (notificationType && (tableNumber || tableCode || electionId || locationId)) {
    return `semantic:${notificationType}:${tableNumber}:${tableCode}:${electionId}:${locationId}`;
  }

  if (notificationType || title || body || tableNumber || tableCode) {
    return `text:${notificationType}:${tableNumber}:${tableCode}:${title}:${body}`;
  }

  return null;
};

const choosePreferredNotification = (current, candidate) => {
  if (!current) return candidate;
  if (!candidate) return current;

  const currentIsLocal = isLocalNotification(current);
  const candidateIsLocal = isLocalNotification(candidate);
  if (currentIsLocal !== candidateIsLocal) {
    return currentIsLocal ? candidate : current;
  }

  const currentTs = extractNotificationTimestampMs(current);
  const candidateTs = extractNotificationTimestampMs(candidate);
  return candidateTs >= currentTs ? candidate : current;
};

export async function getLocalStoredNotifications(dni) {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_NOTIFICATIONS_STORAGE_KEY);
    const list = safeParse(raw).filter(item => !shouldSuppressLocalNotification(item));
    const normalizedDni = String(dni || '')
      .trim()
      .toLowerCase();
    if (!normalizedDni) return list;
    return list.filter(
      item =>
        String(item?.dni || '')
          .trim()
          .toLowerCase() === normalizedDni,
    );
  } catch {
    return [];
  }
}

export function mergeAndDedupeNotifications({
  localList = [],
  remoteList = [],
} = {}) {
  const merged = [
    ...(Array.isArray(localList) ? localList : []),
    ...(Array.isArray(remoteList) ? remoteList : []),
  ];

  if (merged.length <= 1) {
    return merged;
  }

  const keyToBucket = new Map();
  const buckets = [];

  merged.forEach((notification, index) => {
    const rawId = normalizeNotificationField(notification?._id || notification?.id);
    const semanticKey = buildNotificationSemanticKey(notification);
    const candidateKeys = [];

    if (semanticKey) {
      candidateKeys.push(`sem:${semanticKey}`);
    }
    if (rawId && !rawId.startsWith('local_')) {
      candidateKeys.push(`id:${rawId}`);
    }
    if (candidateKeys.length === 0) {
      candidateKeys.push(`opaque:${index}`);
    }

    let bucket = null;
    for (const key of candidateKeys) {
      const existing = keyToBucket.get(key);
      if (existing) {
        bucket = existing;
        break;
      }
    }

    if (!bucket) {
      bucket = {value: notification};
      buckets.push(bucket);
    } else {
      bucket.value = choosePreferredNotification(bucket.value, notification);
    }

    candidateKeys.forEach(key => {
      keyToBucket.set(key, bucket);
    });
  });

  return buckets.map(bucket => bucket.value);
}

async function appendLocalStoredNotification({title, body, data, dni}) {
  try {
    const now = Date.now();
    const current = await getLocalStoredNotifications();
    const item = {
      _id: `local_${now}_${Math.random().toString(16).slice(2, 8)}`,
      title: title ?? 'Tu Voto Decide',
      body: body ?? 'Mensaje nuevo',
      data: data ?? {},
      timestamp: now,
      createdAt: new Date(now).toISOString(),
      source: 'local',
      dni: String(dni || '')
        .trim()
        .toLowerCase(),
    };
    const next = [item, ...current].slice(0, MAX_LOCAL_NOTIFICATIONS);
    await AsyncStorage.setItem(
      LOCAL_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(next),
    );
    return item;
  } catch {
    return null;
  }
}

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
export async function showLocalNotification({
  title,
  body,
  data,
  android = {},
  persistLocal = false,
  dni = null,
} = {}) {
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
  if (persistLocal) {
    await appendLocalStoredNotification({title, body, data, dni});
  }
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
  dni,
  electionId,
}) {
  try {
    const tableCode = String(
      tableData?.codigo || tableData?.tableCode || tableData?.code || '',
    ).trim();
    const tableNumber = String(
      tableData?.tableNumber ||
        tableData?.numero ||
        tableData?.number ||
        '',
    ).trim();
    const resolvedElectionId = String(
      electionId || tableData?.electionId || '',
    ).trim();
    const hasCertificate = Boolean(
      String(
        certificateData?.jsonUrl ||
          certificateData?.imageUrl ||
          certificateData?.certificateUrl ||
          nftData?.nftUrl ||
          '',
      ).trim(),
    );
    const notificationType = hasCertificate
      ? 'participation_certificate'
      : 'acta_published';
    const notificationTitle = hasCertificate
      ? 'Certificado de participación emitido'
      : 'Acta publicada';
    const mesaLabel = tableNumber || tableCode || '';
    const notificationBody = hasCertificate
      ? mesaLabel
        ? `Tu certificado de participación de la mesa ${mesaLabel} fue emitido.`
        : 'Tu certificado de participación fue emitido.'
      : mesaLabel
      ? `Tu acta de la mesa ${mesaLabel} fue publicada correctamente.`
      : 'Tu acta fue publicada correctamente.';

    await showLocalNotification({
      title: notificationTitle,
      body: notificationBody,
      data: {
        type: notificationType,
        tableCode: tableCode || undefined,
        tableNumber: tableNumber || undefined,
        electionId: resolvedElectionId || undefined,
        screen: 'SuccessScreen',
        routeParams: JSON.stringify({
          notificationType,
          ipfsData,
          nftData,
          tableData,
          certificateData,
        }),
      },
      persistLocal: true,
      dni,
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
  if (data?.type === 'worksheet_uploaded') {
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
