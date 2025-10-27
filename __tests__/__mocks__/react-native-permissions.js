// Mock para react-native PermissionsAndroid
export const PermissionsAndroid = {
  PERMISSIONS: {
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    CAMERA: 'android.permission.CAMERA',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  request: jest.fn(),
  check: jest.fn(),
  requestMultiple: jest.fn(),
};

export const Platform = {
  OS: 'android',
  select: jest.fn((options) => options.android || options.default),
  Version: 29,
  constants: {},
  isPad: false,
  isTVOS: false,
};

export default {
  PermissionsAndroid,
  Platform,
};
