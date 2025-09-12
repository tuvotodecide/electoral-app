/**
 * Mock for @react-native-firebase/auth
 */

export default () => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: null,
      isAnonymous: true,
    },
  })),
  signOut: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
    },
  })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
    },
  })),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
});
