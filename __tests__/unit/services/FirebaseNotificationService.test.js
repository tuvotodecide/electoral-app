const storage = new Map();
let foregroundHandler = null;
let backgroundHandler = null;

const mockMessaging = {
  requestPermission: jest.fn(),
  getToken: jest.fn(),
  onMessage: jest.fn(cb => {
    foregroundHandler = cb;
    return jest.fn();
  }),
  setBackgroundMessageHandler: jest.fn(cb => {
    backgroundHandler = cb;
  }),
};

const mockUserRef = {
  set: jest.fn(() => Promise.resolve()),
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

jest.mock('@react-native-firebase/database', () => {
  const database = () => ({
    ref: jest.fn(() => mockUserRef),
  });
  database.ServerValue = {TIMESTAMP: 'server-timestamp'};
  return database;
});

jest.mock('@react-native-firebase/functions', () => {
  const functions = () => ({
    httpsCallable: jest.fn(() =>
      jest.fn(() => Promise.resolve({data: {usuariosNotificados: 3}})),
    ),
  });
  return functions;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(storage.has(key) ? storage.get(key) : null)),
  setItem: jest.fn((key, value) => {
    storage.set(key, value);
    return Promise.resolve();
  }),
}));

describe('FirebaseNotificationService', () => {
  beforeEach(() => {
    storage.clear();
    foregroundHandler = null;
    backgroundHandler = null;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('solicita permisos y retorna true cuando firebase autoriza', async () => {
    const {FirebaseNotificationService} = require('../../../src/services/FirebaseNotificationService');
    const service = new FirebaseNotificationService();
    mockMessaging.requestPermission.mockResolvedValue(1);

    await expect(service.requestUserPermission()).resolves.toBe(true);
  });

  it('retorna null si no puede obtener el token FCM', async () => {
    const {FirebaseNotificationService} = require('../../../src/services/FirebaseNotificationService');
    const service = new FirebaseNotificationService();
    mockMessaging.getToken.mockRejectedValue(new Error('token error'));

    await expect(service.getFCMToken()).resolves.toBeNull();
  });

  it('persiste localmente la notificacion recibida en foreground', async () => {
    const {FirebaseNotificationService} = require('../../../src/services/FirebaseNotificationService');
    new FirebaseNotificationService();

    await foregroundHandler({
      data: {
        mesa: '12',
        recinto: 'Colegio A',
        direccion: 'Zona Sur',
        distancia: '200m',
        latitude: '-16.5',
        longitude: '-68.1',
      },
    });

    const stored = JSON.parse(storage.get('local_notifications'));
    expect(stored[0]).toMatchObject({
      mesa: '12',
      colegio: 'Colegio A',
      direccion: 'Zona Sur',
      distancia: '200m',
      latitude: -16.5,
      longitude: -68.1,
    });
  });

  it('tambien persiste la notificacion en background handler', async () => {
    const {FirebaseNotificationService} = require('../../../src/services/FirebaseNotificationService');
    new FirebaseNotificationService();

    await backgroundHandler({
      data: {
        mesa: '15',
        recinto: 'Colegio B',
      },
    });

    const stored = JSON.parse(storage.get('local_notifications'));
    expect(stored[0]).toMatchObject({
      mesa: '15',
      colegio: 'Colegio B',
    });
  });

  it('initializeUser devuelve error si no hay token disponible', async () => {
    const {FirebaseNotificationService} = require('../../../src/services/FirebaseNotificationService');
    const service = new FirebaseNotificationService();
    jest.spyOn(service, 'getFCMToken').mockResolvedValue(null);

    const result = await service.initializeUser('user-1', {nombre: 'Ana'});

    expect(result).toEqual({
      success: false,
      error: 'No se pudo obtener el token FCM',
    });
  });

  it('initializeUser guarda token, ubicacion y geohash cuando todo esta disponible', async () => {
    const {FirebaseNotificationService} = require('../../../src/services/FirebaseNotificationService');
    const service = new FirebaseNotificationService();
    jest.spyOn(service, 'getFCMToken').mockResolvedValue('fcm-123');
    jest.spyOn(service, 'getCurrentLocation').mockResolvedValue({
      latitude: -16.5,
      longitude: -68.1,
    });

    const result = await service.initializeUser('user-1', {nombre: 'Ana'});

    expect(mockUserRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        fcmToken: 'fcm-123',
        ubicacion: {latitude: -16.5, longitude: -68.1},
        geohash: expect.any(String),
        nombre: 'Ana',
        activo: true,
      }),
    );
    expect(result).toMatchObject({
      success: true,
      userId: 'user-1',
      fcmToken: 'fcm-123',
    });
  });
});
