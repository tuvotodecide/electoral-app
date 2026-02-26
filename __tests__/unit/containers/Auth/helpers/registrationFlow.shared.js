import wira from 'wira-sdk';
import {getDraft} from '../../../../../src/utils/RegisterDraft';

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');

  return ({testID, handleTextChange, inputCount}) =>
    React.createElement(TextInput, {
      testID: testID || 'otpInput',
      onChangeText: handleTextChange,
      maxLength: inputCount,
    });
});

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn((_options, callback) =>
    callback({assets: [{uri: 'file://selfie.jpg'}]}),
  ),
}));

jest.mock('react-native-gesture-handler', () => {
  const {TouchableOpacity, View} = require('react-native');
  return {
    TouchableOpacity,
    PanGestureHandler: View,
    TapGestureHandler: View,
    GestureHandlerRootView: View,
    State: {},
  };
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({granted: true})),
  requestCameraPermissionsAsync: jest.fn(async () => ({granted: true})),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{uri: 'file://gallery.jpg'}],
  })),
  launchCameraAsync: jest.fn(async () => ({
    assets: [{uri: 'file://camera.jpg'}],
  })),
  CameraType: {
    back: 'back',
  },
}));

jest.mock('react-native-permissions', () => ({
  check: jest.fn(async () => 'granted'),
  openSettings: jest.fn(),
  RESULTS: {
    GRANTED: 'granted',
  },
}));

jest.mock('../../../../../src/utils/Biometry', () => ({
  biometryAvailability: jest.fn(async () => ({available: true, biometryType: 'Fingerprint'})),
  biometricLogin: jest.fn(async () => true),
}));

jest.mock('../../../../../src/utils/TempRegister', () => ({
  setTmpPin: jest.fn(async () => undefined),
}));

jest.mock('../../../../../src/utils/PinAttempts', () => ({
  incAttempts: jest.fn(async () => 0),
  isLocked: jest.fn(async () => false),
  resetAttempts: jest.fn(async () => undefined),
}));

jest.mock('../../../../../src/utils/RegisterDraft', () => ({
  getDraft: jest.fn(async () => null),
  saveDraft: jest.fn(async () => undefined),
  clearDraft: jest.fn(async () => undefined),
}));

jest.mock('../../../../../src/utils/ensureBundle', () => ({
  ensureBundle: jest.fn(async () => undefined),
  writeBundleAtomic: jest.fn(async () => undefined),
}));

export const configurarMocksRegistro = () => {
  jest.clearAllMocks();

  const ReactNative = require('react-native');
  if (!ReactNative.AppState) {
    ReactNative.AppState = {
      currentState: 'active',
      addEventListener: jest.fn(() => ({remove: jest.fn()})),
    };
  } else {
    ReactNative.AppState.currentState =
      ReactNative.AppState.currentState || 'active';
    ReactNative.AppState.addEventListener = jest.fn(() => ({remove: jest.fn()}));
  }

  wira.Storage.checkUserData.mockResolvedValue(false);
  wira.checkBiometricAuth.mockResolvedValue({error: null, userData: null});
  getDraft.mockResolvedValue(null);
};
