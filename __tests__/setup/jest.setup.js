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
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  FlatList: 'FlatList',
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
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
}));

// Mock DevMenu specifically
jest.mock('react-native/src/private/devmenu/DevMenu', () => ({}));

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

// Mock Gesture Handler
import 'react-native-gesture-handler/jestSetup';

// Mock Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Silence console warnings during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';

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
    originalConsoleError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';

    if (
      message.includes('Warning:') ||
      message.includes('[WARN]') ||
      message.includes('[NavigationLogger]')
    ) {
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
