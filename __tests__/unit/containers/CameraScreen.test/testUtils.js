const {useSelector} = require('react-redux');
const {useNavigation, useRoute} = require('@react-navigation/native');
const cameraModule = require('react-native-vision-camera');
const netInfoModule = require('@react-native-community/netinfo').default;

const themeState = {
  theme: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#888888',
    primary: '#4F9858',
  },
};

const buildMockRoute = (overrides = {}) => ({
  params: {
    tableData: {
      tableNumber: '45',
      numero: '45',
      number: '45',
      recinto: 'Colegio Central',
    },
    ...overrides,
  },
});

const createMockNavigation = () => {
  const listeners = {};
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn((event, callback) => {
      listeners[event] = callback;
      if (event === 'focus') {
        callback?.();
      }
      return jest.fn();
    }),
  };
};

const setupCameraBaseMocks = ({navigation = createMockNavigation(), routeOverrides = {}} = {}) => {
  useSelector.mockImplementation(selector => selector({theme: themeState}));
  useNavigation.mockReturnValue(navigation);
  useRoute.mockReturnValue(buildMockRoute(routeOverrides));

  cameraModule.useCameraDevice.mockReturnValue({
    id: 'mock-device',
    formats: [{photoWidth: 4000, photoHeight: 3000}],
  });

  cameraModule.useCameraPermission.mockReturnValue({
    hasPermission: true,
    requestPermission: jest.fn(async () => true),
  });

  netInfoModule.addEventListener.mockImplementation(callback => {
    callback?.({isConnected: true, isInternetReachable: true});
    return jest.fn();
  });

  return {navigation};
};

const flushPromises = () =>
  new Promise(resolve => {
    if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
      process.nextTick(resolve);
    } else {
      Promise.resolve().then(resolve);
    }
  });

module.exports = {
  cameraModule,
  netInfoModule,
  themeState,
  buildMockRoute,
  createMockNavigation,
  setupCameraBaseMocks,
  flushPromises,
};
