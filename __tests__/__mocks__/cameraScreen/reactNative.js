const React = require('react');

const createReactNativeMock = () => {
  const ReactNativeActual = jest.requireActual('react-native');
  const {View} = ReactNativeActual;

  const buildAnimatedValue = () => ({
    setValue: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    stopAnimation: jest.fn(),
    interpolate: jest.fn(() => 1),
  });

  const timingMock = jest.fn(() => ({
    start: jest.fn(callback => callback?.()),
    stop: jest.fn(),
  }));

  const parallelMock = jest.fn(animations => ({
    start: jest.fn(callback => {
      animations?.forEach(animation => animation?.start?.());
      callback?.();
    }),
  }));

  const MockImage = React.forwardRef((props, ref) => React.createElement(View, {...props, ref}));
  MockImage.getSize = jest.fn((uri, success) => success?.(1200, 800));
  MockImage.getSizeWithHeaders = jest.fn((uri, headers, success) => success?.(1200, 800));
  MockImage.prefetch = jest.fn();
  MockImage.abortPrefetch = jest.fn();
  MockImage.queryCache = jest.fn(async () => ({}));

  const MockModal = ({visible, children, testID = 'mockModal', ...rest}) =>
    visible
      ? React.createElement(
          View,
          {testID, accessibilityRole: 'none', ...rest},
          children,
        )
      : null;

  const mockedAnimated = {
    Value: jest.fn(() => buildAnimatedValue()),
    timing: timingMock,
    parallel: parallelMock,
    View: React.forwardRef((props, ref) => React.createElement(View, {...props, ref})),
  };

  const mockedDimensions = {
    ...ReactNativeActual.Dimensions,
    get: jest.fn(() => ({width: 1080, height: 1920})),
    addEventListener: jest.fn(() => ({remove: jest.fn()})),
    removeEventListener: jest.fn(),
  };

  const mockedAppState = {
    addEventListener: jest.fn(() => ({remove: jest.fn()})),
    removeEventListener: jest.fn(),
  };

  const mockedStatusBar = {
    setHidden: jest.fn(),
  };

  const mockedAlert = {
    alert: jest.fn(),
  };

  const mockedStyleSheet = {
    create: jest.fn(styles => styles),
    flatten: jest.fn(style => {
      if (Array.isArray(style)) {
        return style.reduce((acc, item) => ({...acc, ...(item || {})}), {});
      }
      return style || {};
    }),
    compose: jest.fn((first, second) => ({...(first || {}), ...(second || {})})),
  };

  const mockedPixelRatio = {
    get: jest.fn(() => 2),
    roundToNearestPixel: jest.fn(value => Math.round(value ?? 0)),
  };

  const mockedPlatform = {
    OS: 'android',
    select: jest.fn(options => options?.android ?? options?.default),
  };

  const mockedNativeAnimatedModule = {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    startAnimatingNode: jest.fn(),
    setValue: jest.fn(),
    stopAnimation: jest.fn(),
  };

  const mockedNativeModules = {
    ...(ReactNativeActual.NativeModules || {}),
    NativeAnimatedModule: mockedNativeAnimatedModule,
  };

  const reactNativeMock = Object.create(ReactNativeActual);

  const define = (key, value) => {
    Object.defineProperty(reactNativeMock, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  };

  define('Animated', mockedAnimated);
  define('Image', MockImage);
  define('Modal', MockModal);
  define('Dimensions', mockedDimensions);
  define('AppState', mockedAppState);
  define('StatusBar', mockedStatusBar);
  define('Alert', mockedAlert);
  define('StyleSheet', mockedStyleSheet);
  define('PixelRatio', mockedPixelRatio);
  define('Platform', mockedPlatform);
  define('NativeModules', mockedNativeModules);

  return reactNativeMock;
};

module.exports = createReactNativeMock;
module.exports.createReactNativeMock = createReactNativeMock;
