/**
 * Mock for @react-native-firebase/app
 */

export default () => ({
  onReady: jest.fn(() => Promise.resolve()),
  apps: [],
  SDK_VERSION: '12.0.0',
  auth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
  })),
});

export const firebase = {
  auth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInAnonymously: jest.fn(() => Promise.resolve()),
    signOut: jest.fn(() => Promise.resolve()),
  })),
};
