import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import UniversalHeader from '../../../../src/components/common/UniversalHeader';
import {renderWithProviders} from '../../../setup/test-utils';

const mockNavigate = jest.fn();
const mockOnMessage = jest.fn();
let foregroundHandler = null;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate, goBack: jest.fn()}),
  useFocusEffect: callback => {
    const React = require('react');
    React.useEffect(() => callback(), []);
  },
  NavigationContainer: ({children}) => children,
  createNavigationContainerRef: () => ({
    current: null,
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
}));

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://backend.example',
}));

jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(async () => 'api-key'),
}));

jest.mock('../../../../src/notifications', () => ({
  alertNewBackendNotifications: jest.fn(async () => undefined),
  getLocalStoredNotifications: jest.fn(async () => []),
  mergeAndDedupeNotifications: jest.fn(({localList = [], remoteList = []}) => [
    ...localList,
    ...remoteList,
  ]),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(async () => ({isConnected: false, isInternetReachable: false})),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(async () => ({
    data: [
      {
        _id: 'notif-1',
        createdAt: '2026-01-01T10:00:00.000Z',
        title: 'Ya puedes votar',
        data: {type: 'INSTITUTIONAL_VOTING_ENABLED'},
      },
    ],
  })),
  isFresh: jest.fn(async () => true),
  setCache: jest.fn(async () => true),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    onMessage: mockOnMessage,
  });
  return messaging;
});

describe('UniversalHeader', () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  const lookupCache = require('../../../../src/utils/lookupCache');

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue('1704099600000');
    AsyncStorage.setItem.mockResolvedValue();
    foregroundHandler = null;
    lookupCache.getCache.mockResolvedValue({
      data: [
        {
          _id: 'notif-1',
          createdAt: '2026-01-01T10:00:00.000Z',
          title: 'Ya puedes votar',
          data: {type: 'INSTITUTIONAL_VOTING_ENABLED'},
        },
      ],
    });
    mockOnMessage.mockImplementation(callback => {
      foregroundHandler = callback;
      return jest.fn();
    });
  });

  it('renderiza título y botón de back', () => {
    const {getByTestId, getByText} = renderWithProviders(
      <UniversalHeader
        title="Titulo"
        colors={{textColor: '#111', black: '#000'}}
        onBack={jest.fn()}
        showNotification={false}
      />,
    );
    expect(getByText('Titulo')).toBeTruthy();
    fireEvent.press(getByTestId('universalHeaderBackButton'));
  });

  it('muestra badge unread desde last-seen local y lo limpia al abrir campana', async () => {
    const {getByTestId, getByText, queryByTestId} = renderWithProviders(
      <UniversalHeader
        title="Inicio"
        colors={{textColor: '#111', black: '#000'}}
      />,
      {
        initialState: {
          auth: {isAuthenticated: true},
          wallet: {
            payload: {
              dni: '12345678',
            },
          },
        },
      },
    );

    await waitFor(() => {
      expect(getByTestId('universalHeaderNotificationBadge')).toBeTruthy();
    });

    expect(getByText('1')).toBeTruthy();

    fireEvent.press(getByTestId('universalHeaderNotificationButton'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notifications:last-seen:12345678',
        expect.any(String),
      );
    });

    expect(mockNavigate).toHaveBeenCalled();
    expect(queryByTestId('universalHeaderNotificationBadge')).toBeNull();
  });

  it('sube el badge cuando llega una notificacion nueva en foreground', async () => {
    lookupCache.getCache.mockResolvedValueOnce({data: []});
    AsyncStorage.getItem.mockResolvedValueOnce(String(Date.now()));

    const {queryByTestId, getByTestId, getByText} = renderWithProviders(
      <UniversalHeader
        title="Inicio"
        colors={{textColor: '#111', black: '#000'}}
      />,
      {
        initialState: {
          auth: {isAuthenticated: true},
          wallet: {
            payload: {
              dni: '12345678',
            },
          },
        },
      },
    );

    expect(queryByTestId('universalHeaderNotificationBadge')).toBeNull();

    await waitFor(() => {
      expect(mockOnMessage).toHaveBeenCalledTimes(1);
      expect(typeof foregroundHandler).toBe('function');
    });

    await act(async () => {
      await foregroundHandler?.({
        data: {type: 'INSTITUTIONAL_VOTING_ENABLED'},
      });
    });

    await waitFor(() => {
      expect(getByTestId('universalHeaderNotificationBadge')).toBeTruthy();
    });

    expect(getByText('1')).toBeTruthy();
  });
});
