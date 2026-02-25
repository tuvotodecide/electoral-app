/**
 * Tests for notifications service
 * Tests de servicio de notificaciones
 */

import {Platform, PermissionsAndroid} from 'react-native';

// Mocks deben ir antes de los imports
jest.mock('@react-native-firebase/messaging', () => {
  const mockMessaging = {
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
    AuthorizationStatus: {
      AUTHORIZED: 1,
      PROVISIONAL: 2,
      DENIED: 0,
    },
  };
  return () => mockMessaging;
});

jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('channel-id')),
  displayNotification: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    HIGH: 4,
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: 33,
  },
  PermissionsAndroid: {
    request: jest.fn(() => Promise.resolve('granted')),
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
  },
}));

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureFCMSetup', () => {
    it('registra dispositivo y solicita permisos', async () => {
      const {ensureFCMSetup} = require('../../../src/services/notifications');
      const messaging = require('@react-native-firebase/messaging')();

      const result = await ensureFCMSetup();

      expect(messaging.registerDeviceForRemoteMessages).toHaveBeenCalled();
      expect(messaging.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('solicita permiso POST_NOTIFICATIONS en Android 13+', async () => {
      Platform.OS = 'android';
      Platform.Version = 33;

      const {ensureFCMSetup} = require('../../../src/services/notifications');
      await ensureFCMSetup();

      expect(PermissionsAndroid.request).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    });
  });

  describe('ensureNotifChannel', () => {
    it('crea canal de notificaciones', async () => {
      const notifee = require('@notifee/react-native');
      const {ensureNotifChannel} = require('../../../src/services/notifications');

      const channelId = await ensureNotifChannel();

      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'counts',
          name: 'Anuncios de conteo',
        }),
      );
      expect(channelId).toBe('channel-id');
    });

    it('retorna el mismo canal si ya existe', async () => {
      const {ensureNotifChannel} = require('../../../src/services/notifications');

      const channelId1 = await ensureNotifChannel();
      const channelId2 = await ensureNotifChannel();

      expect(channelId1).toBe(channelId2);
    });
  });

  describe('showLocalNotification', () => {
    it('muestra notificación local', async () => {
      const notifee = require('@notifee/react-native');
      const {showLocalNotification} = require('../../../src/services/notifications');

      await showLocalNotification({
        title: 'Test Title',
        body: 'Test Body',
        data: {key: 'value'},
      });

      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          body: 'Test Body',
          data: {key: 'value'},
        }),
      );
    });

    it('usa valores por defecto cuando no se proporcionan', async () => {
      const notifee = require('@notifee/react-native');
      const {showLocalNotification} = require('../../../src/services/notifications');

      await showLocalNotification();

      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Aviso',
          body: '',
          data: {},
        }),
      );
    });
  });

  describe('getFCMToken', () => {
    it('obtiene token FCM', async () => {
      const {getFCMToken} = require('../../../src/services/notifications');

      const token = await getFCMToken();

      expect(token).toBe('mock-fcm-token');
    });
  });

  describe('makeLocationTopicKey', () => {
    it('genera key de tópico con prefijo loc_', () => {
      const {makeLocationTopicKey} = require('../../../src/services/notifications');

      const key = makeLocationTopicKey('location123');

      expect(key).toBe('loc_location123');
    });

    it('sanitiza caracteres especiales', () => {
      const {makeLocationTopicKey} = require('../../../src/services/notifications');

      const key = makeLocationTopicKey('location@#$123');

      expect(key).toBe('loc_location123');
    });
  });

  describe('subscribeToLocationTopic', () => {
    it('suscribe al tópico de ubicación', async () => {
      const messaging = require('@react-native-firebase/messaging')();
      const {subscribeToLocationTopic} = require('../../../src/services/notifications');

      await subscribeToLocationTopic('location123');

      expect(messaging.subscribeToTopic).toHaveBeenCalledWith('loc_location123');
    });
  });

  describe('unsubscribeFromLocationTopic', () => {
    it('desuscribe del tópico de ubicación', async () => {
      const messaging = require('@react-native-firebase/messaging')();
      const {unsubscribeFromLocationTopic} = require('../../../src/services/notifications');

      await unsubscribeFromLocationTopic('location123');

      expect(messaging.unsubscribeFromTopic).toHaveBeenCalledWith('loc_location123');
    });
  });

  describe('registerForegroundListener', () => {
    it('registra listener de foreground', () => {
      const messaging = require('@react-native-firebase/messaging')();
      const {registerForegroundListener} = require('../../../src/services/notifications');

      const onMessage = jest.fn();
      const unsubscribe = registerForegroundListener(onMessage);

      expect(messaging.onMessage).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('formatTiempoRelativo', () => {
    it('formatea minutos correctamente', () => {
      const {formatTiempoRelativo} = require('../../../src/services/notifications');

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const result = formatTiempoRelativo(fiveMinutesAgo);

      expect(result).toBe('5 min atrás');
    });

    it('formatea horas correctamente', () => {
      const {formatTiempoRelativo} = require('../../../src/services/notifications');

      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const result = formatTiempoRelativo(twoHoursAgo);

      expect(result).toBe('2 horas atrás');
    });

    it('formatea días correctamente', () => {
      const {formatTiempoRelativo} = require('../../../src/services/notifications');

      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const result = formatTiempoRelativo(threeDaysAgo);

      expect(result).toBe('3 días atrás');
    });

    it('usa singular para 1 hora', () => {
      const {formatTiempoRelativo} = require('../../../src/services/notifications');

      const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
      const result = formatTiempoRelativo(oneHourAgo);

      expect(result).toBe('1 hora atrás');
    });

    it('usa singular para 1 día', () => {
      const {formatTiempoRelativo} = require('../../../src/services/notifications');

      const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;
      const result = formatTiempoRelativo(oneDayAgo);

      expect(result).toBe('1 día atrás');
    });
  });

  describe('initNotifications', () => {
    it('inicializa notificaciones completas', async () => {
      const {initNotifications} = require('../../../src/services/notifications');

      const unsubscribe = await initNotifications({
        onForegroundMessage: jest.fn(),
        onOpenedFromNotification: jest.fn(),
      });

      expect(typeof unsubscribe).toBe('function');
    });
  });
});
