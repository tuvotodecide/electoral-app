import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import HomeScreen from '../../../../../src/container/TabBar/Home/HomeScreen';
import {StackNav} from '../../../../../src/navigation/NavigationKey';

const mockGetElections = jest.fn();
const mockUseVotingState = jest.fn();

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
  requestAuthorization: jest.fn(() => Promise.resolve('granted')),
  getCurrentPosition: jest.fn(success =>
    success({coords: {latitude: -17.7833, longitude: -63.1821}}),
  ),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({isConnected: true, isInternetReachable: true})),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({data: {}})),
  defaults: {headers: {common: {}}},
}));

jest.mock('expo-image', () => {
  const ReactLib = require('react');
  const MockExpoImage = props => ReactLib.createElement('Image', props, props.children);
  return {Image: MockExpoImage};
});

jest.mock('../../../../../src/components/common/CustomModal', () => {
  const ReactLib = require('react');
  const {Text, View} = require('react-native');
  return ({visible, title}) =>
    visible ? ReactLib.createElement(View, null, ReactLib.createElement(Text, null, title)) : null;
});

jest.mock('../../../../../src/notifications', () => ({
  alertNewBackendNotifications: jest.fn(() => Promise.resolve()),
  getLocalStoredNotifications: jest.fn(() => Promise.resolve([])),
  mergeAndDedupeNotifications: jest.fn(({localList = [], remoteList = []}) => [
    ...localList,
    ...remoteList,
  ]),
}));

jest.mock('../../../../../src/utils/networkQuality', () => ({
  NET_POLICIES: {balanced: 'balanced'},
  isStateEffectivelyOnline: jest.fn(() => true),
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
  backendProbe: jest.fn(() => Promise.resolve({ok: true})),
}));

jest.mock('../../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('../../../../../src/hooks/useBackupCheck', () => ({
  useBackupCheck: jest.fn(() => ({hasBackup: true})),
}));

jest.mock('../../../../../src/services/notifications', () => ({
  subscribeToPushTopic: jest.fn(() => Promise.resolve()),
  unsubscribeFromPushTopic: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../../src/utils/worksheetLocalStatus', () => ({
  clearWorksheetLocalStatus: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/src/data/credentials', () => ({
  checkClaimedCredForVote: jest.fn(() => Promise.resolve(true)),
  claimForVote: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../../../../src/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    ENABLE_VOTING_FLOW: true,
  },
}));

jest.mock('../../../../../src/features/voting', () => {
  const ReactLib = require('react');
  const {Text, TouchableOpacity} = require('react-native');

  return {
    ElectionCard: ({election, onVotePress}) =>
      ReactLib.createElement(
        TouchableOpacity,
        {testID: `votingCard_${election.id}`, onPress: onVotePress},
        ReactLib.createElement(Text, null, election.title),
      ),
    handleVotingQueueVote: jest.fn(() => Promise.resolve()),
    markVoteFailed: jest.fn(() => Promise.resolve()),
    reconcileVoteJournal: jest.fn(() => Promise.resolve([])),
    releaseVoteForElection: jest.fn(() => Promise.resolve()),
    useElectionRepository: jest.fn(() => ({getElections: mockGetElections})),
    useVotingState: (...args) => mockUseVotingState(...args),
    UI_STRINGS: {
      myParticipations: 'Mis participaciones',
    },
  };
});

const buildState = () => ({
  auth: {isAuthenticated: true},
  wallet: {
    payload: {
      dni: '12345678',
      did: 'did:test:123',
      privKey: 'priv-key-test',
      vc: {credentialSubject: {fullName: 'Usuario Test', nationalIdNumber: '12345678'}},
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

describe('HomeScreen voting flow routing', () => {
  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    setOptions: jest.fn(),
  };

  let focusCallbacks = [];

  beforeEach(() => {
    jest.clearAllMocks();
    focusCallbacks = [];
    useDispatch.mockReturnValue(jest.fn());
    useSelector.mockImplementation(selector => selector(buildState()));
    useFocusEffect.mockImplementation(callback => {
      focusCallbacks.push(callback);
    });
    mockUseVotingState.mockReturnValue({
      hasVoted: false,
      voteSynced: false,
      participationId: null,
      participations: [],
      lastReceipt: null,
      isLoading: false,
      refreshState: jest.fn(),
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

  it('navega a CandidateScreen con isInPlaceVote true cuando la eleccion trae presentialKioskEnabled', async () => {
    const election = {
      id: 'event-qr',
      title: 'Eleccion presencial',
      isEligible: true,
      canVote: true,
      alreadyVoted: false,
      presentialKioskEnabled: true,
    };
    mockGetElections.mockResolvedValueOnce([election]);

    const view = render(<HomeScreen navigation={navigation} />);
    act(() => {
      runFocusEffects();
    });

    await waitFor(() => {
      expect(view.getByTestId('votingCard_event-qr')).toBeTruthy();
    });
    fireEvent.press(view.getByTestId('votingCard_event-qr'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(
        StackNav.VotingCandidateScreen,
        {
          electionId: 'event-qr',
          election,
          isInPlaceVote: true,
        },
      );
    });
  });

  it('navega a CandidateScreen con isInPlaceVote false cuando el QR presencial esta apagado', async () => {
    const election = {
      id: 'event-remote',
      title: 'Eleccion remota',
      isEligible: true,
      canVote: true,
      alreadyVoted: false,
      presentialKioskEnabled: false,
    };
    mockGetElections.mockResolvedValueOnce([election]);

    const view = render(<HomeScreen navigation={navigation} />);
    act(() => {
      runFocusEffects();
    });

    await waitFor(() => {
      expect(view.getByTestId('votingCard_event-remote')).toBeTruthy();
    });
    fireEvent.press(view.getByTestId('votingCard_event-remote'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith(
        StackNav.VotingCandidateScreen,
        {
          electionId: 'event-remote',
          election,
          isInPlaceVote: false,
        },
      );
    });
  });
});
