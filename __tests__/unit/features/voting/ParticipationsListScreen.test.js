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
  const {View} = require('react-native');
  const MockCSafeAreaView = ({children}) => <View>{children}</View>;
  return MockCSafeAreaView;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const {Text} = require('react-native');
  const MockCHeader = ({title}) => <Text>{title}</Text>;
  return MockCHeader;
});

jest.mock('../../../../src/components/common/CText', () => {
  const {Text} = require('react-native');
  const MockCText = ({children}) => <Text>{children}</Text>;
  return MockCText;
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
    repository.getParticipations.mockResolvedValue([]);
    repository.getWitnessRecords.mockResolvedValue([]);
  });

  it('MP-APP-LIST-001 carga participaciones de voto desde backend', async () => {
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-vote-1',
        eventId: 'event-1',
        title: 'Elección backend',
        institutionName: 'Institución backend',
        participatedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(repository.getParticipations).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Elección backend')).toBeTruthy();
    expect(screen.getByText('VOTO REGISTRADO')).toBeTruthy();
  });

  it('MP-APP-LIST-002 respeta la card actual para una participacion backend equivalente', async () => {
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-vote-card',
        electionId: 'event-card',
        electionTitle: 'Participación backend mapeada',
        status: 'VOTO_REGISTRADO',
        statusLabel: 'VOTO REGISTRADO',
        date: '02 ene',
        time: '10:00',
        fullDate: '02 ene 2026, 10:00',
        organization: 'Institución',
        participatedAt: '2026-01-02T10:00:00.000Z',
        synced: true,
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Participación backend mapeada')).toBeTruthy();
    });

    expect(screen.getByText('VOTO REGISTRADO')).toBeTruthy();
    expect(screen.getByText('02 ene · 10:00')).toBeTruthy();
  });

  it('MP-APP-BACKEND-ONLY-001 muestra votos backend con AsyncStorage vacío', async () => {
    useVotingState.mockReturnValue({participations: []});
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-empty-storage',
        eventId: 'event-empty-storage',
        title: 'Voto reconstruido',
        institutionName: null,
        participatedAt: '2026-01-03T11:00:00.000Z',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Voto reconstruido')).toBeTruthy();
    });
  });

  it('MP-APP-BACKEND-ONLY-002 no muestra votos locales si backend responde vacío', async () => {
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
        ballotData: {
          _id: 'ballot-12',
          image: 'ipfs://QmMesa12',
          electionType: 'general',
        },
        mesaData: {tableNumber: 12},
        partyResults: [],
        voteSummaryResults: [],
        attestationData: {
          tableNumber: 12,
          certificateUrl: 'https://example.com/certificate.png',
          ballotData: {
            _id: 'ballot-12',
            image: 'ipfs://QmMesa12',
            electionType: 'general',
          },
        },
        certificateUrl: 'https://example.com/certificate.png',
        electionType: 'general',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(repository.getParticipations).toHaveBeenCalledTimes(1);
      expect(repository.getWitnessRecords).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText('Eleccion local pendiente')).toBeNull();
    expect(screen.queryByText('Participacion sincronizada local')).toBeNull();
    expect(screen.getByText('Mesa 12')).toBeTruthy();
    expect(screen.queryByText('Remota duplicada')).toBeNull();
    expect(screen.queryByText('Attestation')).toBeNull();

    fireEvent.press(screen.getByText('Mesa 12'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.MyWitnessesDetailScreen,
      expect.objectContaining({
        photoUri: 'https://example.com/mesa.png',
        ballotData: expect.objectContaining({
          _id: 'ballot-12',
        }),
        actaUrl: 'https://example.com/mesa.png',
        certificateUrl: 'https://example.com/certificate.png',
        attestationData: expect.objectContaining({
          tableNumber: 12,
        }),
        electionType: 'general',
      }),
    );
  });

  it('MP-APP-BACKEND-ONLY-003 si backend falla no muestra votos locales y no crashea', async () => {
    repository.getParticipations.mockRejectedValue(new Error('backend votos falla'));
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
      expect(screen.getByText('Mesa 99')).toBeTruthy();
    });

    expect(screen.queryByText('Pendiente local')).toBeNull();
    expect(screen.queryByText('Error local')).toBeNull();
    expect(screen.queryByText('Sincronizada local')).toBeNull();
    expect(screen.getByText('Mesa 99')).toBeTruthy();
  });

  it('MP-APP-LIST-005 combina votos backend y atestiguamientos', async () => {
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-combined',
        eventId: 'event-combined',
        title: 'Voto backend combinado',
        institutionName: 'Institución',
        participatedAt: '2026-01-05T10:00:00.000Z',
      },
    ]);
    repository.getWitnessRecords.mockResolvedValue([
      {
        id: 'attestation-combined',
        itemType: 'attestation',
        electionTitle: 'Mesa combinada',
        status: 'ATESTIGUAMIENTO',
        statusLabel: 'ATESTIGUAMIENTO',
        date: '04 ene',
        time: '15:00',
        participatedAt: '2026-01-04T15:00:00.000Z',
        nftImageUrl: 'https://example.com/certificate-combined.png',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Voto backend combinado')).toBeTruthy();
    });

    expect(screen.getByText('Mesa combinada')).toBeTruthy();
  });

  it('MP-APP-BACKEND-ONLY-004 si falla backend de votos, mantiene atestiguamientos', async () => {
    repository.getParticipations.mockRejectedValue(new Error('votes failed'));
    repository.getWitnessRecords.mockResolvedValue([
      {
        id: 'attestation-votes-fail',
        itemType: 'attestation',
        electionTitle: 'Mesa con votos fallidos',
        status: 'ATESTIGUAMIENTO',
        statusLabel: 'ATESTIGUAMIENTO',
        date: '06 ene',
        time: '12:00',
        participatedAt: '2026-01-06T12:00:00.000Z',
        nftImageUrl: 'https://example.com/certificate-votes-fail.png',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Mesa con votos fallidos')).toBeTruthy();
    });
  });

  it('MP-APP-LIST-007 si fallan atestiguamientos, mantiene votos backend', async () => {
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-witness-fail',
        eventId: 'event-witness-fail',
        title: 'Voto con witness fallido',
        participatedAt: '2026-01-07T12:00:00.000Z',
      },
    ]);
    repository.getWitnessRecords.mockRejectedValue(new Error('witness failed'));

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Voto con witness fallido')).toBeTruthy();
    });
  });

  it('MP-APP-LIST-008 no renderiza campos sensibles enviados por error desde backend', async () => {
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-sensitive',
        eventId: 'event-sensitive',
        title: 'Voto seguro',
        participatedAt: '2026-01-08T12:00:00.000Z',
        candidateId: 'candidate-secret',
        optionId: 'option-secret',
        candidateSelected: {partyName: 'Lista secreta'},
        selectedCandidateId: 'selected-secret',
        nullifier: 'nullifier-secret',
        proof: 'proof-secret',
        zkProof: 'zk-proof-secret',
        vote: 'voto-secreto',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Voto seguro')).toBeTruthy();
    });

    expect(screen.queryByText('candidate-secret')).toBeNull();
    expect(screen.queryByText('option-secret')).toBeNull();
    expect(screen.queryByText('Lista secreta')).toBeNull();
    expect(screen.queryByText('nullifier-secret')).toBeNull();
    expect(screen.queryByText('proof-secret')).toBeNull();
    expect(screen.queryByText('voto-secreto')).toBeNull();
  });

  it('MP-APP-LIST-009 tap en voto backend navega al recibo con params compatibles', async () => {
    repository.getParticipations.mockResolvedValue([
      {
        id: 'backend-tap',
        eventId: 'event-tap',
        title: 'Voto tocable',
        institutionName: 'Institución tap',
        participatedAt: '2026-01-09T12:00:00.000Z',
        candidateSelected: {partyName: 'No debe viajar'},
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Voto tocable')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Voto tocable'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.VotingReceiptScreen,
      expect.objectContaining({
        participationId: 'backend-tap',
        electionId: 'event-tap',
        allowBack: true,
        participation: expect.objectContaining({
          id: 'backend-tap',
          electionId: 'event-tap',
          electionTitle: 'Voto tocable',
          candidateSelected: null,
          selectedCandidateId: null,
        }),
      }),
    );
  });

  it('MP-APP-LIST-010 tap en atestiguamiento mantiene navegación actual', async () => {
    repository.getParticipations.mockResolvedValue([]);
    repository.getWitnessRecords.mockResolvedValue([
      {
        id: 'attestation-tap',
        itemType: 'attestation',
        electionTitle: 'Mesa tocable',
        status: 'ATESTIGUAMIENTO',
        statusLabel: 'ATESTIGUAMIENTO',
        date: '10 ene',
        time: '12:00',
        participatedAt: '2026-01-10T12:00:00.000Z',
        nftImageUrl: 'https://example.com/certificate-tap.png',
        photoUri: 'https://example.com/acta.png',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Mesa tocable')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Mesa tocable'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.MyWitnessesDetailScreen,
      expect.objectContaining({
        photoUri: 'https://example.com/acta.png',
        actaUrl: 'https://example.com/acta.png',
      }),
    );
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      StackNav.VotingReceiptScreen,
      expect.any(Object),
    );
  });

  it('MP-APP-BACKEND-ONLY-005 no duplica backend y local para la misma elección', async () => {
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'local-duplicated',
          electionId: 'event-duplicated',
          electionTitle: 'Duplicada local',
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
        id: 'backend-duplicated',
        eventId: 'event-duplicated',
        title: 'Duplicada backend',
        participatedAt: '2026-01-11T12:00:00.000Z',
      },
    ]);

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(screen.getByText('Duplicada backend')).toBeTruthy();
    });

    expect(screen.queryByText('Duplicada local')).toBeNull();
  });

  it('MP-APP-LIST-012 mantiene empty state actual si no hay datos', async () => {
    repository.getParticipations.mockResolvedValue([]);
    repository.getWitnessRecords.mockResolvedValue([]);
    useVotingState.mockReturnValue({participations: []});

    const screen = render(<ParticipationsListScreen />);
    focusEffectCallback?.();

    await waitFor(() => {
      expect(repository.getParticipations).toHaveBeenCalledTimes(1);
      expect(repository.getWitnessRecords).toHaveBeenCalledTimes(1);
    });

    const emptyList = screen.UNSAFE_getByType('FlashList');
    expect(emptyList.props.ListEmptyComponent).toBeTruthy();
  });
});
