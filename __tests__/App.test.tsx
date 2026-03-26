import React from 'react';
import {render, waitFor} from '@testing-library/react-native';

const mockOnTokenRefresh = jest.fn();
const mockSubscribeToLocationTopic = jest.fn(() => Promise.resolve());
const mockSubscribeToPushTopic = jest.fn(() => Promise.resolve());
const mockGetItem = jest.fn();

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
  subscribeToLocationTopic: (...args) => mockSubscribeToLocationTopic(...args),
  subscribeToPushTopic: (...args) => mockSubscribeToPushTopic(...args),
}));

jest.mock('../src/notifications', () => ({
  registerNotifications: jest.fn(() => Promise.resolve()),
  handleNotificationPress: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    onTokenRefresh: mockOnTokenRefresh,
  });
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args) => mockGetItem(...args),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnTokenRefresh.mockImplementation(cb => {
      mockOnTokenRefresh.callback = cb;
      return jest.fn();
    });
  });

  it('renderiza el navegador principal', () => {
    const {getByTestId} = render(<App />);
    expect(getByTestId('appNavigator')).toBeTruthy();
  });

  it('re-suscribe los topicos guardados cuando firebase refresca el token', async () => {
    mockGetItem
      .mockResolvedValueOnce('loc_abc123')
      .mockResolvedValueOnce('user_topic_1')
      .mockResolvedValueOnce('loc_abc123')
      .mockResolvedValueOnce('user_topic_1');

    render(<App />);

    await waitFor(() => expect(mockSubscribeToLocationTopic).toHaveBeenCalledWith('abc123'));
    await waitFor(() => expect(mockSubscribeToPushTopic).toHaveBeenCalledWith('user_topic_1'));

    await mockOnTokenRefresh.callback();

    await waitFor(() => expect(mockSubscribeToLocationTopic).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockSubscribeToPushTopic).toHaveBeenCalledTimes(2));
  });
});
