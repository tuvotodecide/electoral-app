import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import UniversalHeader from '../../../../src/components/common/UniversalHeader';
import {renderWithProviders} from '../../../setup/test-utils';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate, goBack: jest.fn()}),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({children}) => children,
  createNavigationContainerRef: () => ({
    current: null,
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
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

describe('UniversalHeader', () => {
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
});
