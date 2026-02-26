jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    getItem: jest.fn(key => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
  };
});

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
  StackNav: {Splash: 'Splash', TabNavigation: 'TabNavigation'},
  TabNav: {HomeScreen: 'HomeScreen'},
}));

import {
  alertNewBackendNotifications,
  handleNotificationPress,
  maybeStorePendingNavFromRemote,
  mergeAndDedupeNotifications,
  showLocalNotification,
} from '../../src/notifications';

const notifee = require('@notifee/react-native').default;
const storeModule = require('../../src/redux/store');
const rootNav = require('../../src/navigation/RootNavigation');

describe('notifications', () => {
  beforeEach(() => {
    storeModule.__setAuthState({isAuthenticated: false});
    storeModule.__getDispatch().mockClear();
    rootNav.navigate.mockClear();
    notifee.displayNotification.mockClear();
  });

  it('mergeAndDedupeNotifications prioriza remotas sobre locales', () => {
    const local = {_id: 'local_1', title: 'Local', timestamp: 1};
    const remote = {_id: 'abc', title: 'Remote', timestamp: 2};
    const out = mergeAndDedupeNotifications({
      localList: [local],
      remoteList: [remote],
    });
    expect(out).toHaveLength(2);
  });

  it('alertNewBackendNotifications dispara alerta para backend', async () => {
    await alertNewBackendNotifications({
      dni: '123',
      notifications: [
        {
          _id: 'n1',
          createdAt: Date.now(),
          title: 'Title',
          body: 'Body',
          data: {type: 'acta_published'},
        },
      ],
    });
    expect(notifee.displayNotification).toHaveBeenCalled();
  });

  it('showLocalNotification usa notifee', async () => {
    await showLocalNotification({title: 't', body: 'b'});
    expect(notifee.displayNotification).toHaveBeenCalled();
  });

  it('handleNotificationPress navega cuando hay auth', () => {
    storeModule.__setAuthState({isAuthenticated: true});
    handleNotificationPress({data: {screen: 'Splash'}});
    expect(rootNav.navigate).toHaveBeenCalled();
  });

  it('handleNotificationPress guarda ruta cuando no hay auth', () => {
    storeModule.__setAuthState({isAuthenticated: false});
    handleNotificationPress({data: {screen: 'Splash'}});
    expect(storeModule.__getDispatch()).toHaveBeenCalledWith(
      expect.objectContaining({type: 'setPendingNav'}),
    );
    expect(rootNav.navigate).toHaveBeenCalledWith('LoginUser');
  });

  it('maybeStorePendingNavFromRemote guarda cuando no hay auth', () => {
    storeModule.__setAuthState({isAuthenticated: false});
    maybeStorePendingNavFromRemote({data: {screen: 'Splash'}});
    expect(storeModule.__getDispatch()).toHaveBeenCalled();
  });
});
