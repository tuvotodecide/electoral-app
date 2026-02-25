/**
 * Tests for pushPermission service
 * Tests de servicio de permisos de notificaciones push
 */

import {Platform, PermissionsAndroid, Alert, AppState} from 'react-native';

// Mocks
jest.mock('@notifee/react-native', () => ({
  getNotificationSettings: jest.fn(() =>
    Promise.resolve({
      authorizationStatus: 0, // NOT_DETERMINED
    }),
  ),
  requestPermission: jest.fn(() =>
    Promise.resolve({
      authorizationStatus: 1, // AUTHORIZED
    }),
  ),
  createChannel: jest.fn(() => Promise.resolve('channel-id')),
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
    NOT_DETERMINED: -1,
  },
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
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
    PERMISSIONS: {
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
  },
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openSettings: jest.fn(),
  },
  AppState: {
    currentState: 'active',
  },
}));

describe('pushPermission service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AppState.currentState = 'active';
    Platform.OS = 'android';
    Platform.Version = 33;
  });

  describe('requestPushPermissionExplicit', () => {
    it('retorna true si ya tiene permisos autorizados', async () => {
      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.AUTHORIZED,
      });

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(result).toBe(true);
      expect(notifee.createChannel).toHaveBeenCalled();
    });

    it('retorna false si la app no está en foreground', async () => {
      AppState.currentState = 'background';

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(result).toBe(false);
    });

    it('solicita permisos y crea canal en Android 13+', async () => {
      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.NOT_DETERMINED,
      });
      notifee.requestPermission.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.AUTHORIZED,
      });

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(notifee.requestPermission).toHaveBeenCalled();
      expect(PermissionsAndroid.request).toHaveBeenCalled();
      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'high_prio',
          name: 'High priority',
        }),
      );
      expect(result).toBe(true);
    });

    it('muestra alerta si Android 13+ deniega permisos', async () => {
      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.NOT_DETERMINED,
      });
      notifee.requestPermission.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.AUTHORIZED,
      });
      PermissionsAndroid.request.mockResolvedValueOnce('denied');

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permiso requerido',
        'Activa las notificaciones para recibir avisos.',
        expect.any(Array),
      );
      expect(result).toBe(false);
    });

    it('muestra alerta si iOS deniega permisos', async () => {
      Platform.OS = 'ios';
      Platform.Version = 16;

      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.NOT_DETERMINED,
      });
      notifee.requestPermission.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.DENIED,
      });

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permiso requerido',
        'Activa las notificaciones en Ajustes para recibir avisos.',
        expect.any(Array),
      );
      expect(result).toBe(false);
    });

    it('acepta permisos PROVISIONAL en iOS', async () => {
      Platform.OS = 'ios';
      Platform.Version = 16;

      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.NOT_DETERMINED,
      });
      notifee.requestPermission.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.PROVISIONAL,
      });

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(result).toBe(true);
    });

    it('retorna false y captura errores', async () => {
      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockRejectedValueOnce(
        new Error('Test error'),
      );

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      const result = await requestPushPermissionExplicit();

      expect(result).toBe(false);
    });

    it('no solicita POST_NOTIFICATIONS en Android < 13', async () => {
      Platform.Version = 32;

      const notifee = require('@notifee/react-native');
      notifee.getNotificationSettings.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.NOT_DETERMINED,
      });
      notifee.requestPermission.mockResolvedValueOnce({
        authorizationStatus: notifee.AuthorizationStatus.AUTHORIZED,
      });

      const {requestPushPermissionExplicit} = require('../../../src/services/pushPermission');
      await requestPushPermissionExplicit();

      expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    });
  });
});
