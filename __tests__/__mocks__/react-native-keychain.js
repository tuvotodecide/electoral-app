/**
 * Mock for react-native-keychain
 */

export const SECURITY_LEVEL = {
  ANY: 'ANY',
  SECURE_SOFTWARE: 'SECURE_SOFTWARE',
  SECURE_HARDWARE: 'SECURE_HARDWARE',
};

export const ACCESSIBLE = {
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  ALWAYS: 'ALWAYS',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
};

export const setInternetCredentials = jest.fn(() => Promise.resolve());

export const getInternetCredentials = jest.fn(() => 
  Promise.resolve({
    username: 'mockuser',
    password: 'mockpassword',
    service: 'mockservice',
  })
);

export const resetInternetCredentials = jest.fn(() => Promise.resolve());

export const hasInternetCredentials = jest.fn(() => Promise.resolve(true));

export const setGenericPassword = jest.fn(() => Promise.resolve());

export const getGenericPassword = jest.fn(() => 
  Promise.resolve({
    username: 'mockuser',
    password: 'mockpassword',
    service: 'mockservice',
  })
);

export const resetGenericPassword = jest.fn(() => Promise.resolve());

export const getSupportedBiometryType = jest.fn(() => 
  Promise.resolve('TouchID')
);

export default {
  SECURITY_LEVEL,
  ACCESSIBLE,
  setInternetCredentials,
  getInternetCredentials,
  resetInternetCredentials,
  hasInternetCredentials,
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  getSupportedBiometryType,
};
