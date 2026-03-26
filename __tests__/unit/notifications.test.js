const storage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(key => Promise.resolve(storage.has(key) ? storage.get(key) : null)),
  setItem: jest.fn((key, value) => {
    storage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn(key => {
    storage.delete(key);
    return Promise.resolve();
  }),
}));

jest.mock('@notifee/react-native', () => {
  const localMock = {
    createChannel: jest.fn(() => Promise.resolve('channel')),
    displayNotification: jest.fn(() => Promise.resolve()),
    requestPermission: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
  };
  return {
    __esModule: true,
    default: localMock,
    AndroidImportance: {HIGH: 4},
    EventType: {PRESS: 'PRESS'},
  };
});

jest.mock('../../src/redux/store', () => {
  const state = {auth: {isAuthenticated: false}};
  const dispatch = jest.fn();
  return {
    __esModule: true,
    default: {
      getState: () => state,
      dispatch,
    },
    __setAuthState: next => {
      state.auth = next;
    },
    __getDispatch: () => dispatch,
  };
});

jest.mock('../../src/redux/slices/authSlice', () => ({
  setPendingNav: payload => ({type: 'setPendingNav', payload}),
}));

jest.mock('../../src/navigation/RootNavigation', () => ({
  navigate: jest.fn(),
}));

jest.mock('../../src/navigation/NavigationKey', () => ({
  StackNav: {
    Splash: 'Splash',
    TabNavigation: 'TabNavigation',
    SuccessScreen: 'SuccessScreen',
    ClaimCredScreen: 'ClaimCredScreen',
  },
  TabNav: {HomeScreen: 'HomeScreen'},
}));

import {
  alertNewBackendNotifications,
  buildNotificationSemanticKey,
  buildNotificationTextFallback,
  buildRouteFromNotification,
  handleNotificationPress,
  mergeAndDedupeNotifications,
  maybeStorePendingNavFromRemote,
  showActaPublishedNotification,
  showLocalNotification,
} from '../../src/notifications';

const notifee = require('@notifee/react-native').default;
const storeModule = require('../../src/redux/store');
const rootNav = require('../../src/navigation/RootNavigation');

describe('notifications', () => {
  beforeEach(() => {
    storage.clear();
    jest.clearAllMocks();
    storeModule.__setAuthState({isAuthenticated: false});
  });

  it('deduplica notificaciones semanticas y prioriza la remota frente a la local', () => {
    const local = {
      _id: 'local_1',
      source: 'local',
      createdAt: '2026-01-01T10:00:00.000Z',
      data: {
        type: 'participation_certificate',
        electionId: 'election-1',
        imageUrl: 'https://nft.example/1',
      },
    };
    const remote = {
      _id: 'remote-1',
      createdAt: '2026-01-01T10:01:00.000Z',
      data: {
        type: 'participation_certificate',
        electionId: 'election-1',
        imageUrl: 'https://nft.example/1',
      },
    };

    const out = mergeAndDedupeNotifications({
      localList: [local],
      remoteList: [remote],
    });

    expect(out).toHaveLength(1);
    expect(out[0]).toBe(remote);
  });

  it('genera key semantica estable para attestation usando fingerprint util', () => {
    const key = buildNotificationSemanticKey({
      data: {
        type: 'acta_published',
        electionId: 'election-1',
        imageUrl: 'https://image.example/cert.png',
      },
    });

    expect(key).toBe('attestation:election-1:https://image.example/cert.png');
  });

  it('construye textos fallback distintos para publicar votacion, acta y certificado', () => {
    expect(
      buildNotificationTextFallback({
        data: {type: 'participation_certificate', tableNumber: '15'},
      }),
    ).toMatchObject({
      title: 'Atestiguamiento exitoso',
      body: 'Tu atestiguamiento de la mesa 15 se registró correctamente.',
    });

    expect(
      buildNotificationTextFallback({
        data: {type: 'acta_published', tableCode: 'A-22'},
      }),
    ).toMatchObject({
      title: 'Acta subida exitosamente',
      body: 'Tu acta de la mesa A-22 fue publicada correctamente.',
    });
  });

  it('alerta solo una vez por notificacion backend deduplicada y persiste la marca', async () => {
    const notification = {
      _id: 'remote-1',
      createdAt: '2026-01-01T10:00:00.000Z',
      title: 'Acta subida exitosamente',
      data: {type: 'acta_published', tableNumber: '8'},
    };

    await alertNewBackendNotifications({
      dni: '123',
      notifications: [notification],
    });
    await alertNewBackendNotifications({
      dni: '123',
      notifications: [notification],
    });

    expect(notifee.displayNotification).toHaveBeenCalledTimes(1);
    expect(storage.get('@backend-notifications:alerted:v1:123')).toContain(
      'id:remote-1',
    );
  });

  it('persiste una notificacion local de acta publicada con routeParams serializados', async () => {
    await showActaPublishedNotification({
      ipfsData: {jsonUrl: 'https://ipfs.example/doc.json'},
      nftData: {nftUrl: 'https://nft.example/1'},
      tableData: {codigo: 'A-15', tableNumber: '15'},
      certificateData: {imageUrl: 'https://cdn.example/cert.png'},
      dni: '12345678',
      electionId: 'election-1',
    });

    expect(notifee.displayNotification).toHaveBeenCalled();
    const stored = JSON.parse(storage.get('@local-notifications:v1'));
    expect(stored[0]).toMatchObject({
      source: 'local',
      dni: '12345678',
      data: expect.objectContaining({
        type: 'acta_published',
        screen: 'SuccessScreen',
        tableCode: 'A-15',
        tableNumber: '15',
        electionId: 'election-1',
      }),
    });
    expect(() => JSON.parse(stored[0].data.routeParams)).not.toThrow();
  });

  it('showLocalNotification usa notifee y permite persistencia opcional', async () => {
    await showLocalNotification({
      title: 'Nueva votación',
      body: 'Abierta',
      data: {type: 'INSTITUTIONAL_EVENT_PUBLISHED'},
      persistLocal: true,
      dni: '999',
    });

    expect(notifee.displayNotification).toHaveBeenCalled();
    const stored = JSON.parse(storage.get('@local-notifications:v1'));
    expect(stored[0]).toMatchObject({
      title: 'Nueva votación',
      body: 'Abierta',
      dni: '999',
    });
  });

  it('resuelve rutas especiales para worksheet_uploaded y announce_count', () => {
    expect(buildRouteFromNotification({data: {type: 'worksheet_uploaded'}})).toEqual({
      name: 'TabNavigation',
      params: {screen: 'HomeScreen'},
    });

    expect(buildRouteFromNotification({data: {type: 'announce_count'}})).toEqual({
      name: 'TabNavigation',
      params: {screen: 'HomeScreen'},
    });
  });

  it('navega directamente cuando el usuario esta autenticado', () => {
    storeModule.__setAuthState({isAuthenticated: true});

    handleNotificationPress({
      data: {
        screen: 'ClaimCredScreen',
        routeParams: JSON.stringify({notificationId: 'abc'}),
      },
    });

    expect(rootNav.navigate).toHaveBeenCalledWith('ClaimCredScreen', {
      notificationId: 'abc',
    });
  });

  it('guarda navegacion pendiente y manda al login cuando no hay auth', () => {
    storeModule.__setAuthState({isAuthenticated: false});

    handleNotificationPress({
      data: {
        screen: 'SuccessScreen',
        routeParams: '{bad-json',
      },
    });

    expect(storeModule.__getDispatch()).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setPendingNav',
        payload: expect.objectContaining({name: 'SuccessScreen'}),
      }),
    );
    expect(rootNav.navigate).toHaveBeenCalledWith('LoginUser');
  });

  it('no guarda navegacion pendiente si el payload remoto no trae screen valido', () => {
    maybeStorePendingNavFromRemote({data: {}});
    expect(storeModule.__getDispatch()).not.toHaveBeenCalled();
  });
});
