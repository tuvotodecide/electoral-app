import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {renderWithProviders} from '../../../../setup/test-utils';

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
}));

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://result.example',
}));

jest.mock('axios', () => ({
  defaults: {headers: {common: {}}},
  get: jest.fn(() => Promise.resolve({data: []})),
  post: jest.fn(() => Promise.resolve({data: {}})),
}));

jest.mock('../../../../../src/assets/images', () => ({}));

jest.mock('../../../../../src/utils/offlineQueue', () => ({
  getAll: jest.fn(() => Promise.resolve([])),
  clearVotePlace: jest.fn(() => Promise.resolve()),
  getVotePlace: jest.fn(() => Promise.resolve(null)),
  processQueue: jest.fn(() => Promise.resolve()),
  removeById: jest.fn(() => Promise.resolve()),
  saveVotePlace: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('api-key')),
  publishActaHandler: jest.fn(() => Promise.resolve()),
  publishWorksheetHandler: jest.fn(() => Promise.resolve()),
  syncActaBackendHandler: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/worksheetLocalStatus', () => ({
  clearWorksheetLocalStatus: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/networkUtils', () => ({
  backendProbe: jest.fn(() => Promise.resolve({ok: true})),
}));

jest.mock('../../../../../src/utils/networkQuality', () => ({
  isStateEffectivelyOnline: jest.fn(() => true),
  NET_POLICIES: {balanced: {minWifiPercent: 25}},
}));

jest.mock('../../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(() => Promise.resolve(null)),
  isFresh: jest.fn(() => Promise.resolve(false)),
  setCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/attestationAvailabilityCache', () => ({
  getAttestationAvailabilityCache: jest.fn(() => Promise.resolve(null)),
  saveAttestationAvailabilityCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/Session', () => ({
  clearSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/notifications', () => ({
  alertNewBackendNotifications: jest.fn(() => Promise.resolve()),
  getLocalStoredNotifications: jest.fn(() => Promise.resolve([])),
  mergeAndDedupeNotifications: jest.fn(({localList = [], remoteList = []}) => [
    ...localList,
    ...remoteList,
  ]),
}));

jest.mock('../../../../../src/hooks/useBackupCheck', () => ({
  useBackupCheck: jest.fn(() => ({hasBackup: true})),
}));

jest.mock('react-native-paper', () => ({
  ActivityIndicator: 'ActivityIndicator',
}));

import HomeScreen from '../../../../../src/container/TabBar/Home/HomeScreen';
import {clearSession} from '../../../../../src/utils/Session';

describe('HomeScreen', () => {
  it('renderiza la pantalla principal', () => {
    const {getByTestId} = renderWithProviders(<HomeScreen />, {
      initialState: {
        auth: {isAuthenticated: false},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });
    expect(getByTestId('homeContainer')).toBeTruthy();
  });

  it('abre el modal de logout y confirma cierre', async () => {
    const {getByTestId} = renderWithProviders(<HomeScreen />, {
      initialState: {
        auth: {isAuthenticated: true},
        wallet: {payload: {account: '0xabc', vc: {credentialSubject: {fullName: 'Ana'}}}},
      },
    });

    const modal = getByTestId('homeLogoutModal');
    expect(modal.props.visible).toBe(false);

    fireEvent.press(getByTestId('logoutButton'));
    await waitFor(() =>
      expect(getByTestId('homeLogoutModal').props.visible).toBe(true),
    );

    fireEvent.press(getByTestId('homeLogoutModalConfirmButton'));
    await waitFor(() => expect(clearSession).toHaveBeenCalled());
  });
});
