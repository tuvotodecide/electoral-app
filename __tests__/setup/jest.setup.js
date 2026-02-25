/**
 * Jest Setup Configuration
 * Configuración global para todos los tests
 */

// Setup window object before anything else
if (typeof window === 'undefined') {
  global.window = {};
}

// Global test setup
global.__DEV__ = true;
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = callback => setTimeout(callback, 0);
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock complete react-native module
jest.mock('react-native', () => ({
  ...(() => {
    const React = require('react');
    const MockImage = props => React.createElement('Image', props, props.children);
    MockImage.resolveAssetSource = jest.fn(() => ({uri: 'mock://asset'}));
    const Pressable = ({children, ...props}) =>
      React.createElement('View', props, children);
    const FlatList = ({data = [], renderItem, keyExtractor, ...props}) => {
      const children = (data || []).map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        const element = renderItem ? renderItem({item, index}) : null;
        return React.createElement(React.Fragment, {key}, element);
      });
      return React.createElement('View', props, children);
    };
    const SectionList = ({
      sections = [],
      renderItem,
      renderSectionHeader,
      keyExtractor,
      ...props
    }) => {
      const children = [];
      (sections || []).forEach((section, sectionIndex) => {
        if (renderSectionHeader) {
          children.push(
            React.createElement(
              React.Fragment,
              {key: `section-${sectionIndex}`},
              renderSectionHeader({section}),
            ),
          );
        }
        const data = section?.data || [];
        data.forEach((item, index) => {
          const key = keyExtractor
            ? keyExtractor(item, index)
            : `${sectionIndex}-${index}`;
          const element = renderItem ? renderItem({item, index, section}) : null;
          children.push(React.createElement(React.Fragment, {key}, element));
        });
      });
      return React.createElement('View', props, children);
    };
    return {MockImage, Pressable, FlatList, SectionList};
  })(),
  Platform: {
    OS: 'ios',
    Version: '14.0',
    select: jest.fn((obj) => obj.ios || obj.default),
    isPad: false,
    isTesting: true,
  },
  Dimensions: {
    get: jest.fn(() => ({width: 375, height: 667})),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    roundToNearestPixel: jest.fn(x => Math.round(x)),
  },
  StyleSheet: {
    create: jest.fn(styles => styles),
    hairlineWidth: 1,
    flatten: jest.fn(styles => styles),
  },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
  SafeAreaView: 'SafeAreaView',
  TouchableOpacity: 'TouchableOpacity',
  Switch: 'Switch',
  Image: (() => {
    const React = require('react');
    const MockImage = props => React.createElement('Image', props, props.children);
    MockImage.resolveAssetSource = jest.fn(() => ({uri: 'mock://asset'}));
    return MockImage;
  })(),
  ImageBackground: (() => {
    const React = require('react');
    const MockImageBackground = props =>
      React.createElement('ImageBackground', props, props.children);
    MockImageBackground.resolveAssetSource = jest.fn(() => ({uri: 'mock://asset'}));
    return MockImageBackground;
  })(),
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  DeviceEventEmitter: {
    addListener: jest.fn(() => ({remove: jest.fn()})),
    removeAllListeners: jest.fn(),
  },
  useColorScheme: jest.fn(() => 'light'),
  StatusBar: 'StatusBar',
  InteractionManager: {
    runAfterInteractions: jest.fn(callback => {
      if (typeof callback === 'function') {
        callback();
      }
      return {cancel: jest.fn()};
    }),
  },
  Alert: {
    alert: jest.fn(),
  },
  PermissionsAndroid: {
    request: jest.fn(() => Promise.resolve('granted')),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
      CAMERA: 'android.permission.CAMERA',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    },
  },
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: jest.fn(() => ({
        renderAsync: jest.fn(() =>
          Promise.resolve({
            saveAsync: jest.fn(() =>
              Promise.resolve({uri: 'file://mock-image.jpg'}),
            ),
          }),
        ),
      })),
    })),
  },
}));

// Mock safe area context to avoid undefined component types
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const SafeAreaView = ({children, ...props}) => React.createElement('View', props, children);

  return {
    SafeAreaView,
    SafeAreaProvider: ({children}) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});

// Shared mock for Native Animated module operations
const mockNativeAnimatedModule = {
  startOperationBatch: jest.fn(),
  finishOperationBatch: jest.fn(),
  createAnimatedNode: jest.fn(),
  updateAnimatedNodeConfig: jest.fn(),
  getValue: jest.fn(),
  startListeningToAnimatedNodeValue: jest.fn(),
  stopListeningToAnimatedNodeValue: jest.fn(),
  connectAnimatedNodes: jest.fn(),
  disconnectAnimatedNodes: jest.fn(),
  startAnimatingNode: jest.fn(),
  stopAnimation: jest.fn(),
  setAnimatedNodeValue: jest.fn(),
  setAnimatedNodeOffset: jest.fn(),
  flattenAnimatedNodeOffset: jest.fn(),
  extractAnimatedNodeOffset: jest.fn(),
  connectAnimatedNodeToView: jest.fn(),
  disconnectAnimatedNodeFromView: jest.fn(),
  restoreDefaultValues: jest.fn(),
  dropAnimatedNode: jest.fn(),
  addAnimatedEventToView: jest.fn(),
  removeAnimatedEventFromView: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
  queueAndExecuteBatchedOperations: jest.fn(),
};

// Mock TurboModuleRegistry to prevent DevMenu errors and provide animated module
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => ({})),
  get: jest.fn(() => mockNativeAnimatedModule),
}));

// Ensure legacy animated module resolves to our mock
jest.mock('react-native/Libraries/Animated/shouldUseTurboAnimatedModule', () => jest.fn(() => false));
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeAnimatedModule', () => ({
  __esModule: true,
  default: mockNativeAnimatedModule,
}), {virtual: true});

// Mock DevMenu specifically
jest.mock('react-native/src/private/devmenu/DevMenu', () => ({}), {virtual: true});

// Mock Dimensions globally (redundant with above but kept for safety)
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({width: 375, height: 667})),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Platform globally (redundant with above but kept for safety)
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '14.0',
  select: jest.fn((obj) => obj.ios || obj.default),
  isPad: false,
  isTesting: true,
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children,
  createNavigationContainerRef: () => ({
    current: null,
  }),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  default: () => ({
    onReady: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  default: () => ({
    signInAnonymously: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn(),
    currentUser: null,
  }),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  default: () => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('fcm-token')),
  }),
}));

// Mock Biometrics
jest.mock('react-native-biometrics', () => ({
  default: {
    isSensorAvailable: jest.fn(() => Promise.resolve({ available: true })),
    simplePrompt: jest.fn(() => Promise.resolve({ success: true })),
  },
}));

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
}));

// Mock Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const MockIcon = ({ name, size = 24, color = '#000', style, onPress, testID }) => {
    return React.createElement('Text', {
      testID: testID || `icon-${name}`,
      style: [{ fontSize: size, color }, style],
      onPress,
      children: name,
    });
  };
  MockIcon.loadFont = jest.fn(() => Promise.resolve());
  MockIcon.hasIcon = jest.fn(() => Promise.resolve(true));
  MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mocked' }));
  MockIcon.getRawGlyphMap = jest.fn(() => ({}));
  return MockIcon;
});
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const MockIcon = ({ name, size = 24, color = '#000', style, onPress, testID }) => {
    return React.createElement('Text', {
      testID: testID || `icon-${name}`,
      style: [{ fontSize: size, color }, style],
      onPress,
      children: name,
    });
  };
  MockIcon.loadFont = jest.fn(() => Promise.resolve());
  MockIcon.hasIcon = jest.fn(() => Promise.resolve(true));
  MockIcon.getImageSource = jest.fn(() => Promise.resolve({ uri: 'mocked' }));
  MockIcon.getRawGlyphMap = jest.fn(() => ({}));
  return MockIcon;
});

// Mock react-native-localization to avoid native module usage
jest.mock('react-native-localization', () => {
  return class LocalizedStrings {
    constructor(strings = {}) {
      this._strings = strings;
      const initial =
        strings.en || strings.es || strings['es-ES'] || Object.values(strings)[0] || {};
      Object.assign(this, initial);
    }
    setLanguage(lang) {
      const next = this._strings[lang] || this._strings.en || {};
      Object.assign(this, next);
      return next;
    }
    getLanguage() {
      return 'en';
    }
  };
});

// Mock react-native-quick-crypto
jest.mock('react-native-quick-crypto', () => ({
  randomBytes: jest.fn((size) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }),
  QuickCrypto: {
    randomBytes: jest.fn((size) => new Uint8Array(size)),
    pbkdf2: jest.fn(() => Promise.resolve(new Uint8Array(32))),
  },
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => new Uint8Array(32)),
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => new Uint8Array(32)),
  })),
  pbkdf2: jest.fn(() => Promise.resolve(new Uint8Array(32))),
}));

// Mock Camera
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevices: () => ({ back: null }),
  requestCameraPermission: jest.fn(() => Promise.resolve('authorized')),
}));

// Mock Image Picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {
      CacheDir: '/mock/cache',
      DocumentDir: '/mock/documents',
      TemporaryDir: '/mock/tmp',
    },
    exists: jest.fn(() => Promise.resolve(true)),
    mkdir: jest.fn(() => Promise.resolve()),
    unlink: jest.fn(() => Promise.resolve()),
    cp: jest.fn(() => Promise.resolve()),
  },
  config: jest.fn(() => ({
    fetch: jest.fn(() =>
      Promise.resolve({
        path: () => '/mock/cache/file.jpg',
      }),
    ),
  })),
  fetch: jest.fn(() =>
    Promise.resolve({
      path: () => '/mock/cache/file.jpg',
    }),
  ),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  AndroidImportance: {
    HIGH: 4,
    DEFAULT: 3,
    LOW: 2,
  },
  EventType: {
    PRESS: 'PRESS',
    DISMISSED: 'DISMISSED',
  },
  default: {
    requestPermission: jest.fn(() => Promise.resolve()),
    createChannel: jest.fn(() => Promise.resolve('default')),
    displayNotification: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    cancelNotification: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('sp-react-native-in-app-updates', () => ({
  __esModule: true,
  IAUUpdateKind: {
    IMMEDIATE: 'IMMEDIATE',
    FLEXIBLE: 'FLEXIBLE',
  },
  default: jest.fn().mockImplementation(() => ({
    checkNeedsUpdate: jest.fn(() => Promise.resolve({shouldUpdate: false})),
    startUpdate: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('@sentry/react-native', () => ({
  __esModule: true,
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(callback => {
    const scope = {
      setTag: jest.fn(),
      setExtra: jest.fn(),
      setContext: jest.fn(),
      setLevel: jest.fn(),
    };
    callback?.(scope);
  }),
  configureScope: jest.fn(),
  wrap: Component => Component,
  ReactNativeTracing: jest.fn(),
}));

// Mock Permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler components used in tests
jest.mock('react-native-gesture-handler', () => {
  const { View, TouchableOpacity, FlatList, ScrollView } = require('react-native');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    TapGestureHandler: View,
    PanGestureHandler: View,
    LongPressGestureHandler: View,
    ForceTouchGestureHandler: View,
    NativeViewGestureHandler: View,
    GestureHandlerRootView: View,
    TouchableOpacity,
    FlatList,
    ScrollView,
  };
});

// Mock Gesture Handler
import 'react-native-gesture-handler/jestSetup';

// Silence console warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const message = args
      .map(arg => (typeof arg === 'string' ? arg : arg?.message || ''))
      .join(' ');

    if (message.includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }

    if (
      message.includes('An update to') &&
      message.includes('was not wrapped in act')
    ) {
      return;
    }

    if (message.includes('Encountered two children with the same key')) {
      return;
    }

    // Expected error-path logs covered by dedicated unit tests.
    if (
      message.includes('[CAMERA-SCREEN]') ||
      message.includes('[vote_upload]')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    const message = args
      .map(arg => (typeof arg === 'string' ? arg : arg?.message || ''))
      .join(' ');

    if (
      message.includes('Warning:') ||
      message.includes('[WARN]') ||
      message.includes('[NavigationLogger]')
    ) {
      return;
    }

    if (message.includes('An error occurred in the <SearchTable> component.')) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test timeout
jest.setTimeout(10000);
