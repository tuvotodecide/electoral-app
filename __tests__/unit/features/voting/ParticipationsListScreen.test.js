import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import ParticipationsListScreen from '../../../../src/features/voting/screens/ParticipationsListScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../../src/features/voting/data/useElectionRepository', () => ({
  useElectionRepository: jest.fn(),
}));

jest.mock('../../../../src/features/voting/state/useVotingState', () => ({
  useVotingState: jest.fn(),
}));

jest.mock('../../../../src/utils/normalizedUri', () => ({
  normalizeUri: jest.fn(value => value),
}));

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');
  return ({children}) => <View>{children}</View>;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const ReactLib = require('react');
  const {Text} = require('react-native');
  return ({title}) => <Text>{title}</Text>;
});

jest.mock('../../../../src/components/common/CText', () => {
  const ReactLib = require('react');
  const {Text} = require('react-native');
  return ({children}) => <Text>{children}</Text>;
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const {useFocusEffect, useNavigation} = require('@react-navigation/native');
const {
  useElectionRepository,
} = require('../../../../src/features/voting/data/useElectionRepository');
const {
  useVotingState,
} = require('../../../../src/features/voting/state/useVotingState');

describe('ParticipationsListScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  };
  const repository = {
    getParticipations: jest.fn(),
  };
  let focusEffectCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue(navigation);
    useFocusEffect.mockImplementation(callback => {
      focusEffectCallback = callback;
    });
    useElectionRepository.mockReturnValue(repository);
    useVotingState.mockReturnValue({
      participations: [],
    });
  });

  it('usa backend como fuente principal y conserva solo los pendientes locales necesarios', async () => {
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'local-pending',
          electionId: 'election-1',
          electionTitle: 'Eleccion local pendiente',
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
          synced: false,
          date: '01 ene',
          time: '10:00',
          participatedAt: '2026-01-01T10:00:00.000Z',
        },
        {
          id: 'local-synced',
          electionId: 'election-2',
          electionTitle: 'No deberia verse',
          status: 'VOTO_REGISTRADO',
          statusLabel: 'VOTO REGISTRADO',
          synced: true,
          date: '01 ene',
          time: '09:00',
          participatedAt: '2026-01-01T09:00:00.000Z',
        },
      ],
    });
    repository.getParticipations.mockResolvedValue([
      {
        id: 'remote-same-election',
        electionId: 'election-1',
        electionTitle: 'Remota duplicada',
        status: 'VOTO_REGISTRADO',
        statusLabel: 'VOTO REGISTRADO',
        synced: true,
        date: '01 ene',
        time: '11:00',
        participatedAt: '2026-01-01T11:00:00.000Z',
      },
      {
        id: 'remote-2',
        electionId: 'election-3',
        electionTitle: 'Eleccion remota',
        status: 'VOTO_REGISTRADO',
        statusLabel: 'VOTO REGISTRADO',
        synced: true,
        date: '02 ene',
        time: '12:00',
        participatedAt: '2026-01-02T12:00:00.000Z',
        nftImageUrl: 'https://example.com/attestation.png',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(repository.getParticipations).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Eleccion local pendiente')).toBeTruthy();
    expect(screen.getByText('Eleccion remota')).toBeTruthy();
    expect(screen.queryByText('Remota duplicada')).toBeNull();
    expect(screen.queryByText('No deberia verse')).toBeNull();
    expect(screen.getByText('Attestation')).toBeTruthy();

    fireEvent.press(screen.getByText('Eleccion remota'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.VotingReceiptScreen,
      expect.objectContaining({
        participationId: 'remote-2',
        electionId: 'election-3',
        allowBack: true,
        participation: expect.objectContaining({
          id: 'remote-2',
          nftImageUrl: 'https://example.com/attestation.png',
        }),
      }),
    );
  });

  it('si el backend falla, muestra solo participaciones locales pendientes o con error', async () => {
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'local-pending',
          electionId: 'election-1',
          electionTitle: 'Pendiente local',
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
          synced: false,
          date: '01 ene',
          time: '10:00',
          participatedAt: '2026-01-01T10:00:00.000Z',
        },
        {
          id: 'local-error',
          electionId: 'election-2',
          electionTitle: 'Error local',
          status: 'ERROR',
          statusLabel: 'ERROR',
          synced: false,
          date: '01 ene',
          time: '09:00',
          participatedAt: '2026-01-01T09:00:00.000Z',
        },
        {
          id: 'local-synced',
          electionId: 'election-3',
          electionTitle: 'Sincronizada local',
          status: 'VOTO_REGISTRADO',
          statusLabel: 'VOTO REGISTRADO',
          synced: true,
          date: '01 ene',
          time: '08:00',
          participatedAt: '2026-01-01T08:00:00.000Z',
        },
      ],
    });
    repository.getParticipations.mockRejectedValue(new Error('network failed'));

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Pendiente local')).toBeTruthy();
    });

    expect(screen.getByText('Error local')).toBeTruthy();
    expect(screen.queryByText('Sincronizada local')).toBeNull();
  });
});
