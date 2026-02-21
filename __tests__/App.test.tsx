import React from 'react';
import {render} from '@testing-library/react-native';

jest.mock('@sentry/react-native', () => ({
  wrap: Component => Component,
}));

jest.mock('@env', () => ({
  BACKEND_IDENTITY: 'https://mock.identity',
}), {virtual: true});

jest.mock('../src/navigation', () => {
  const ReactLib = require('react');
  return function MockNavigator() {
    return ReactLib.createElement('View', {testID: 'appNavigator'});
  };
});

jest.mock('../src/services/notifications', () => ({
  ensureFCMSetup: jest.fn(() => Promise.resolve()),
  initNotifications: jest.fn(() => Promise.resolve(jest.fn())),
  showLocalNotification: jest.fn(() => Promise.resolve()),
  subscribeToLocationTopic: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/notifications', () => ({
  registerNotifications: jest.fn(() => Promise.resolve()),
  handleNotificationPress: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    onTokenRefresh: jest.fn(() => jest.fn()),
  });
});

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: selector =>
    selector({
      auth: {isAuthenticated: false, pendingNav: null},
      theme: {theme: {dark: 'light'}},
    }),
}));

jest.mock('../src/utils/migrateBundle', () => ({
  migrateIfNeeded: jest.fn(),
}));

import App from '../src/App';

describe('src/App', () => {
  it('renderiza el navegador principal', () => {
    const {getByTestId} = render(<App />);
    expect(getByTestId('appNavigator')).toBeTruthy();
  });
});
