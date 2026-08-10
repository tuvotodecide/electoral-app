import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import axios from 'axios';
import wira from 'wira-sdk';
import ElectionRepositoryApi from '../../../../src/features/voting/data/repositories/ElectionRepository.api';
import RewardsScreen from '../../../../src/features/rewards/screens/RewardsScreen';
import {buildRouteFromNotification} from '../../../../src/notifications';
import {StackNav} from '../../../../src/navigation/NavigationKey';
import {renderWithProviders} from '../../../setup/test-utils';

jest.mock('axios');

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve('channel')),
    displayNotification: jest.fn(() => Promise.resolve()),
    requestPermission: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
  },
  AndroidImportance: {HIGH: 4},
  EventType: {PRESS: 'PRESS', ACTION_PRESS: 'ACTION_PRESS'},
}));

jest.mock('../../../../src/redux/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      wallet: {
        payload: {
          dni: '12345678',
          did: 'did:test:123',
          privKey: 'priv-key-test',
          vc: {
            credentialSubject: {
              nationalIdNumber: '12345678',
            },
          },
        },
      },
    }),
  },
}));

jest.mock('../../../../src/redux/slices/authSlice', () => ({
  setPendingNotificationNavigation: payload => ({
    type: 'setPendingNotificationNavigation',
    payload,
  }),
  clearPendingNotificationNavigation: () => ({
    type: 'clearPendingNotificationNavigation',
  }),
}));

jest.mock('../../../../src/navigation/RootNavigation', () => ({
  safeNavigate: jest.fn(() => true),
}));

jest.mock('../../../../src/utils/Session', () => ({
  isSessionValid: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('api-key-test')),
  getVoteRequestForBackend: jest.fn(),
}));

jest.mock('../../../../src/features/voting/offline/voteJournal', () => ({
  clearVoteJournal: jest.fn(() => Promise.resolve()),
  markVoteJournalChainConfirmed: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/src/api/vote', () => ({
  castVote: jest.fn(),
  getVoteInfo: jest.fn(),
}));

jest.mock('@/src/data/credentials', () => ({
  getCredentialForVote: jest.fn(),
}));

jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCHeader = ({title}) => React.createElement(Text, null, title);
  return MockCHeader;
});

describe('MX-08 post-vote participation acceptance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PAR-UX-P1-001 / PAR-REG-P0-001 / PAR-SYN-P0-001 / PAR-RWD-P0-001 / PAR-NTF-P0-001 registra participación y abre recompensa desde VOTO_CONFIRMADO controlado', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        id: 'participation-1',
        participated: true,
        participatedAt: '2026-01-01T12:00:00.000Z',
      },
    });
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'ALREADY_VOTED',
        canVote: false,
        alreadyVoted: true,
        participationId: 'participation-1',
        participatedAt: '2026-01-01T12:00:00.000Z',
      },
    });
    const navigation = {navigate: jest.fn()};

    const result = await ElectionRepositoryApi.registerParticipation(
      'event-1',
      'option-internal',
    );

    expect(result).toMatchObject({
      success: true,
      participationId: 'participation-1',
      alreadyVoted: true,
      status: 'ALREADY_VOTED',
    });
    expect(wira.authenticateWithVerifier).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/voting/events/event-1/participations'),
      {carnet: '12345678'},
      expect.objectContaining({
        headers: expect.objectContaining({
          'idempotency-key': 'vote:event-1:12345678:option-internal',
        }),
      }),
    );
    expect(JSON.stringify(axios.post.mock.calls[0][1])).not.toMatch(
      /option|candidate|proof|nullifier|credential|privateKey/i,
    );

    const target = buildRouteFromNotification({
      data: {
        type: 'VOTE_REWARD_AVAILABLE',
        action: 'OPEN_VOTE_REWARD',
        eventId: 'event-1',
      },
    });

    expect(target).toEqual({
      name: StackNav.RewardsScreen,
      params: {
        voteRewardAvailable: true,
        rewardAction: 'OPEN_VOTE_REWARD',
      },
    });

    const screen = renderWithProviders(
      <RewardsScreen navigation={navigation} route={{params: target.params}} />,
    );

    expect(screen.getByText('Recompensa por voto disponible')).toBeTruthy();
    expect(screen.getByText('Disponible')).toBeTruthy();
    fireEvent.press(screen.getByTestId('rewardItem_reward-vote'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.RewardDetailScreen,
      expect.objectContaining({
        rewardId: 'reward-vote',
        reward: expect.objectContaining({status: 'available'}),
      }),
    );
    expect(screen.queryByText(/transfer/i)).toBeNull();
    expect(screen.queryByText(/saldo actualizado/i)).toBeNull();
  });

  it.todo('PAR-UX-P2-002 | VALIDACION_MANUAL_DISPOSITIVO_REAL_Y_PUSH_REAL');
});
