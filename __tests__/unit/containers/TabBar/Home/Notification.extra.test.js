import React from 'react';
import {fireEvent, waitFor, render} from '@testing-library/react-native';
import Notification from '../../../../../src/container/TabBar/Home/Notification';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let focusCallback = null;
const mockAddListener = jest.fn((event, cb) => {
  if (event === 'focus') focusCallback = cb;
  return jest.fn();
});

jest.mock('react-redux', () => ({
  useSelector: jest.fn(fn =>
    fn({
      wallet: {
        payload: {
          did: 'did:1',
          privKey: '0xpriv',
          vc: {credentialSubject: {documentNumber: '123'}},
        },
      },
      theme: {theme: {backgroundColor: '#fff'}},
    }),
  ),
}));

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://backend.example',
}));

jest.mock('../../../../../src/services/pushPermission', () => ({
  requestPushPermissionExplicit: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/services/notifications', () => ({
  formatTiempoRelativo: jest.fn(() => 'hace 1m'),
}));

jest.mock('../../../../../src/notifications', () => ({
  getLocalStoredNotifications: jest.fn(async () => []),
  mergeAndDedupeNotifications: jest.fn(({localList, remoteList}) => [
    ...localList,
    ...remoteList,
  ]),
}));

jest.mock('../../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(async () => ({data: []})),
  setCache: jest.fn(async () => true),
}));

jest.mock('../../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(async () => 'api-key'),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../../../../../src/navigation/NavigationKey', () => ({
  StackNav: {TabNavigation: 'TabNavigation'},
  TabNav: {HomeScreen: 'HomeScreen'},
}));

describe('Notification screen extra', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    focusCallback = null;
  });

  it('consulta backend y renderiza lista base', async () => {
    const axios = require('axios');
    const offlineHandler = require('../../../../../src/utils/offlineQueueHandler');
    axios.get.mockResolvedValueOnce({data: []});

    const {getByTestId} = render(
      <Notification
        navigation={{
          navigate: mockNavigate,
          goBack: mockGoBack,
          addListener: mockAddListener,
        }}
      />,
    );

    await waitFor(() =>
      expect(offlineHandler.authenticateWithBackend).toHaveBeenCalled(),
    );
    await waitFor(() => expect(getByTestId('notificationList')).toBeTruthy());
    focusCallback?.();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });
});
