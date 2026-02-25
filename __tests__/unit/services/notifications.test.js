/**
 * Tests for notifications service
 * Tests de servicio de notificaciones
 */

// Mocks deben ir antes de los imports
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
};

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => mockMessaging;
  messaging.AuthorizationStatus = {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
  };
  return messaging;
});

jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('channel-id')),
  displayNotification: jest.fn(() => Promise.resolve()),
  AndroidImportance: {
    HIGH: 4,
  },
}));

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('ensureFCMSetup', () => {
    it('registra dispositivo y solicita permisos', async () => {
      const {ensureFCMSetup} = require('../../../src/services/notifications');

      const result = await ensureFCMSetup();

      expect(mockMessaging.registerDeviceForRemoteMessages).toHaveBeenCalled();
      expect(mockMessaging.requestPermission).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('ensureNotifChannel', () => {
    it('crea canal de notificaciones', async () => {
      const notifee = require('@notifee/react-native');
      const {ensureNotifChannel} = require('../../../src/services/notifications');

      const channelId = await ensureNotifChannel();

      expect(notifee.createChannel).toHaveBeenCalled();
      expect(channelId).toBe('channel-id');
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

      expect(notifee.displayNotification).toHaveBeenCalled();
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
      const {subscribeToLocationTopic} = require('../../../src/services/notifications');

      await subscribeToLocationTopic('location123');

      expect(mockMessaging.subscribeToTopic).toHaveBeenCalledWith('loc_location123');
    });
  });

  describe('unsubscribeFromLocationTopic', () => {
    it('desuscribe del tópico de ubicación', async () => {
      const {unsubscribeFromLocationTopic} = require('../../../src/services/notifications');

      await unsubscribeFromLocationTopic('location123');

      expect(mockMessaging.unsubscribeFromTopic).toHaveBeenCalledWith('loc_location123');
    });
  });

  describe('registerForegroundListener', () => {
    it('registra listener de foreground', () => {
      const {registerForegroundListener} = require('../../../src/services/notifications');

      const onMessage = jest.fn();
      const unsubscribe = registerForegroundListener(onMessage);

      expect(mockMessaging.onMessage).toHaveBeenCalled();
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
