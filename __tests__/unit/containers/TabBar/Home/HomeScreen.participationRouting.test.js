import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import HomeScreen from '../../../../../src/container/TabBar/Home/HomeScreen';
import {StackNav} from '../../../../../src/navigation/NavigationKey';
import {getVotePlace} from '../../../../../src/utils/offlineQueue';
import {getAttestationAvailabilityCache} from '../../../../../src/utils/attestationAvailabilityCache';
import {isStateEffectivelyOnline} from '../../../../../src/utils/networkQuality';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useFocusEffect: jest.fn(),
  };
});

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-paper', () => ({
  ActivityIndicator: 'ActivityIndicator',
}));

jest.mock('@react-native-community/geolocation', () => ({
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: {headers: {common: {}}},
}));

jest.mock('../../../../../src/components/common/CustomModal', () => {
  const ReactLib = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({visible, title, message, buttonText, onButtonPress}) => {
    if (!visible) {
      return null;
    }
    return ReactLib.createElement(
      View,
      {testID: 'homeCustomModal'},
      title ? ReactLib.createElement(Text, null, title) : null,
      message ? ReactLib.createElement(Text, null, message) : null,
      buttonText
        ? ReactLib.createElement(
            TouchableOpacity,
            {onPress: onButtonPress, testID: 'homeCustomModalPrimaryButton'},
            ReactLib.createElement(Text, null, buttonText),
          )
        : null,
    );
  };
});

jest.mock('../../../../../src/components/home/RegisterAlertCard', () => {
  const ReactLib = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return ({title, onPress}) =>
    ReactLib.createElement(
      TouchableOpacity,
      {testID: `registerAlert-${String(title || '').replace(/\s+/g, '-')}`, onPress},
      ReactLib.createElement(Text, null, title),
    );
});

jest.mock('../../../../../src/hooks/useBackupCheck', () => ({
  useBackupCheck: jest.fn(() => ({hasBackup: true})),
}));

jest.mock('../../../../../src/notifications', () => ({
  alertNewBackendNotifications: jest.fn(() => Promise.resolve()),
  getLocalStoredNotifications: jest.fn(() => Promise.resolve([])),
  mergeAndDedupeNotifications: jest.fn(({localList = [], remoteList = []}) => [
    ...localList,
    ...remoteList,
  ]),
}));

jest.mock('../../../../../src/utils/networkQuality', () => ({
  NET_POLICIES: {
    balanced: 'balanced',
    estrict: 'estrict',
  },
  isStateEffectivelyOnline: jest.fn(),
}));

jest.mock('../../../../../src/utils/offlineQueue', () => ({
  getAll: jest.fn(() => Promise.resolve([])),
  clearVotePlace: jest.fn(() => Promise.resolve()),
  getVotePlace: jest.fn(() => Promise.resolve(null)),
  processQueue: jest.fn(() =>
    Promise.resolve({remaining: 0, processed: 0, failed: 0, failedItems: []}),
  ),
  removeById: jest.fn(() => Promise.resolve()),
  saveVotePlace: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/attestationAvailabilityCache', () => ({
  getAttestationAvailabilityCache: jest.fn(() => Promise.resolve(null)),
  saveAttestationAvailabilityCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/lookupCache', () => ({
  getCache: jest.fn(() => Promise.resolve(null)),
  isFresh: jest.fn(() => Promise.resolve(false)),
  setCache: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('api-key')),
  publishActaHandler: jest.fn(() => Promise.resolve()),
  publishWorksheetHandler: jest.fn(() => Promise.resolve()),
  syncActaBackendHandler: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/networkUtils', () => ({
  backendProbe: jest.fn(() => Promise.resolve({ok: false})),
}));

jest.mock('../../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
  captureMessage: jest.fn(),
}));

const mockedUseSelector = useSelector;
const mockedUseDispatch = useDispatch;
const mockedUseFocusEffect = useFocusEffect;
const mockedGeo = Geolocation;
const mockedNetInfo = NetInfo;
const mockedAxios = axios;
const mockedGetVotePlace = getVotePlace;
const mockedGetAttestationAvailabilityCache = getAttestationAvailabilityCache;
const mockedIsStateEffectivelyOnline = isStateEffectivelyOnline;

const buildState = ({dni = null} = {}) => ({
  auth: {isAuthenticated: false},
  wallet: {
    payload: {
      vc: {credentialSubject: {fullName: 'Usuario Test', nationalIdNumber: dni}},
      dni,
      did: null,
      privKey: null,
      account: null,
    },
  },
  theme: {
    theme: {
      backgroundColor: '#FFFFFF',
      textColor: '#111111',
      primary: '#41A44D',
      grayScale500: '#6B7280',
      white: '#FFFFFF',
      black: '#000000',
    },
  },
});

const findPressableAncestor = node => {
  let current = node;
  while (current && typeof current.props?.onPress !== 'function') {
    current = current.parent;
  }
  return current;
};

describe('HomeScreen - enrutamiento de Enviar Acta', () => {
  let focusCallbacks = [];

  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    setOptions: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDispatch.mockReturnValue(jest.fn());
    mockedUseSelector.mockImplementation(selector => selector(buildState()));

    const reactNative = require('react-native');
    reactNative.AppState = {
      addEventListener: jest.fn(() => ({remove: jest.fn()})),
    };
    reactNative.Linking = {
      openURL: jest.fn(),
      openSettings: jest.fn(() => Promise.resolve()),
      sendIntent: jest.fn(() => Promise.resolve()),
    };

    focusCallbacks = [];
    mockedUseFocusEffect.mockImplementation(callback => {
      focusCallbacks.push(callback);
    });

    mockedGeo.requestAuthorization.mockResolvedValue('granted');
    mockedGeo.getCurrentPosition.mockImplementation(success => {
      success({coords: {latitude: -17.7833, longitude: -63.1821}});
    });

    mockedNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    mockedNetInfo.addEventListener.mockImplementation(() => jest.fn());

    mockedAxios.get.mockImplementation(url => {
      if (String(url).includes('/elections/config/status')) {
        return Promise.resolve({
          data: {
            config: {id: 'cfg-1', isVotingPeriod: true},
            hasActiveConfig: true,
          },
        });
      }

      if (String(url).includes('/users/') && String(url).includes('/vote-place')) {
        return Promise.resolve({data: {location: {_id: 'loc-api'}}});
      }

      return Promise.resolve({data: {}});
    });

    mockedGetAttestationAvailabilityCache.mockResolvedValue({
      nearestLocation: {_id: 'location-1', name: 'Recinto Centro'},
      availableElections: [
        {
          electionType: 'municipal',
          canAttest: true,
          electionId: 'election-1',
          electionName: 'Elección Municipal',
        },
      ],
      savedAt: Date.now(),
    });
  });

  const runFocusEffects = () => {
    focusCallbacks.forEach(callback => {
      const cleanup = callback();
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
  };

  test('si hay internet, Enviar Acta Alcalde dirige a ElectoralLocations', async () => {
    mockedUseSelector.mockImplementation(selector => selector(buildState({dni: null})));
    mockedIsStateEffectivelyOnline.mockReturnValue(true);
    mockedGetVotePlace.mockResolvedValue(null);

    const view = render(<HomeScreen navigation={navigation} />);
    act(() => {
      runFocusEffects();
    });

    await waitFor(() => {
      expect(view.getByText('Enviar Acta Alcalde')).toBeTruthy();
    });

    const titleNode = view.getByText('Enviar Acta Alcalde');
    const pressable = findPressableAncestor(titleNode);
    fireEvent.press(pressable);

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(StackNav.ElectoralLocations, {
        targetScreen: 'UnifiedParticipation',
        electionType: 'ALCALDE',
        electionId: 'election-1',
      });
    });

    view.unmount();
  });

  test('si no hay internet y existe recinto cacheado, dirige a UnifiedParticipationScreen offline', async () => {
    mockedUseSelector.mockImplementation(selector =>
      selector(buildState({dni: '12345678'})),
    );
    mockedIsStateEffectivelyOnline.mockReturnValue(false);
    mockedGetVotePlace.mockResolvedValue({
      location: {_id: 'loc-cache', name: 'Recinto Norte'},
    });

    const view = render(<HomeScreen navigation={navigation} />);
    act(() => {
      runFocusEffects();
    });

    await waitFor(() => {
      expect(view.getByText('Enviar Acta Alcalde')).toBeTruthy();
    });

    const titleNode = view.getByText('Enviar Acta Alcalde');
    const pressable = findPressableAncestor(titleNode);
    fireEvent.press(pressable);

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(
        StackNav.UnifiedParticipationScreen,
        expect.objectContaining({
          targetScreen: 'UnifiedParticipation',
          electionType: 'ALCALDE',
          electionId: 'election-1',
          dni: '12345678',
          locationId: 'loc-cache',
          fromCache: true,
          offline: true,
        }),
      );
    });

    view.unmount();
  });

  test('si no hay internet y no existe recinto cacheado, muestra modal de advertencia', async () => {
    mockedUseSelector.mockImplementation(selector =>
      selector(buildState({dni: '12345678'})),
    );
    mockedIsStateEffectivelyOnline.mockReturnValue(false);
    mockedGetVotePlace.mockResolvedValue(null);

    const view = render(<HomeScreen navigation={navigation} />);
    act(() => {
      runFocusEffects();
    });

    await waitFor(() => {
      expect(view.getByText('Enviar Acta Alcalde')).toBeTruthy();
    });

    const titleNode = view.getByText('Enviar Acta Alcalde');
    const pressable = findPressableAncestor(titleNode);
    fireEvent.press(pressable);

    await waitFor(() => {
      expect(
        view.getByText('Necesitas conexión para escoger tu recinto por primera vez.'),
      ).toBeTruthy();
    });

    expect(navigation.navigate).not.toHaveBeenCalledWith(
      StackNav.UnifiedParticipationScreen,
      expect.anything(),
    );
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      StackNav.ElectoralLocations,
      expect.anything(),
    );

    view.unmount();
  });
});
