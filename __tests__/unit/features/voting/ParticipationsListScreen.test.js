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
    getWitnessRecords: jest.fn(),
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
    repository.getWitnessRecords.mockResolvedValue([]);
  });

  it('muestra participaciones locales persistidas y atestiguamientos en una sola lista', async () => {
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
          electionTitle: 'Participacion sincronizada local',
          status: 'VOTO_REGISTRADO',
          statusLabel: 'VOTO REGISTRADO',
          synced: true,
          date: '01 ene',
          time: '09:00',
          participatedAt: '2026-01-01T09:00:00.000Z',
        },
      ],
    });
    repository.getWitnessRecords.mockResolvedValue([
      {
        id: 'attestation-1',
        itemType: 'attestation',
        electionTitle: 'Mesa 12',
        status: 'ATESTIGUAMIENTO',
        statusLabel: 'ATESTIGUAMIENTO',
        date: '03 ene',
        time: '13:00',
        participatedAt: '2026-01-03T13:00:00.000Z',
        nftImageUrl: 'https://example.com/certificate.png',
        photoUri: 'https://example.com/mesa.png',
        mesaData: {tableNumber: 12},
        partyResults: [],
        voteSummaryResults: [],
        attestationData: {tableNumber: 12, certificateUrl: 'https://example.com/certificate.png'},
        certificateUrl: 'https://example.com/certificate.png',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(repository.getWitnessRecords).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Eleccion local pendiente')).toBeTruthy();
    expect(screen.getByText('Participacion sincronizada local')).toBeTruthy();
    expect(screen.getByText('Mesa 12')).toBeTruthy();
    expect(screen.queryByText('Remota duplicada')).toBeNull();
    expect(screen.queryByText('Attestation')).toBeNull();

    fireEvent.press(screen.getByText('Participacion sincronizada local'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.VotingReceiptScreen,
      expect.objectContaining({
        participationId: 'local-synced',
        electionId: 'election-2',
        allowBack: true,
        participation: expect.objectContaining({
          id: 'local-synced',
        }),
      }),
    );

    fireEvent.press(screen.getByText('Mesa 12'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.MyWitnessesDetailScreen,
      expect.objectContaining({
        photoUri: 'https://example.com/mesa.png',
        certificateUrl: 'https://example.com/certificate.png',
        attestationData: expect.objectContaining({
          tableNumber: 12,
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
    repository.getWitnessRecords.mockResolvedValue([
      {
        id: 'attestation-2',
        itemType: 'attestation',
        electionTitle: 'Mesa 99',
        status: 'ATESTIGUAMIENTO',
        statusLabel: 'ATESTIGUAMIENTO',
        date: '04 ene',
        time: '15:00',
        participatedAt: '2026-01-04T15:00:00.000Z',
        nftImageUrl: 'https://example.com/certificate-99.png',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Pendiente local')).toBeTruthy();
    });

    expect(screen.getByText('Error local')).toBeTruthy();
    expect(screen.getByText('Sincronizada local')).toBeTruthy();
    expect(screen.getByText('Mesa 99')).toBeTruthy();
  });
});
