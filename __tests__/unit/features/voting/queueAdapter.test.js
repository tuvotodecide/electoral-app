import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueBackendParticipationSync,
  enqueueVote,
  handleVotingQueueVote,
  markVoteFailed,
  releaseVoteForElection,
} from '../../../../src/features/voting/offline/queueAdapter';

jest.mock('../../../../src/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    ENABLE_VOTING_FLOW: true,
  },
}));

jest.mock('../../../../src/utils/offlineQueue', () => ({
  enqueue: jest.fn(),
  getAll: jest.fn(),
  processQueue: jest.fn(),
}));

jest.mock('../../../../src/features/voting/data/useElectionRepository', () => ({
  getElectionRepository: jest.fn(),
}));

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../src/features/voting/offline/voteJournal', () => ({
  clearVoteJournal: jest.fn(),
  getPendingVoteJournalEntries: jest.fn(),
}));

const {enqueue, getAll} = require('../../../../src/utils/offlineQueue');
const {getElectionRepository} = require('../../../../src/features/voting/data/useElectionRepository');
const {clearVoteJournal} = require('../../../../src/features/voting/offline/voteJournal');

const createStorage = initialEntries => {
  const storage = new Map(Object.entries(initialEntries || {}));

  AsyncStorage.getItem.mockImplementation(key =>
    Promise.resolve(storage.has(key) ? storage.get(key) : null),
  );
  AsyncStorage.setItem.mockImplementation((key, value) => {
    storage.set(key, value);
    return Promise.resolve();
  });
  AsyncStorage.removeItem.mockImplementation(key => {
    storage.delete(key);
    return Promise.resolve();
  });

  return storage;
};

describe('queueAdapter voting flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('construye el payload de voto offline y evita duplicados para la misma eleccion', async () => {
    getAll.mockResolvedValueOnce([]);
    enqueue.mockResolvedValueOnce('queue-1');

    const queueId = await enqueueVote({
      electionId: 'election-1',
      candidateId: 'candidate-1',
      candidateName: 'Lista Azul',
      presidentName: 'Ana Perez',
      electionTitle: 'Centro de estudiantes',
    });

    expect(queueId).toBe('queue-1');
    expect(enqueue).toHaveBeenCalledWith({
      type: 'votingFlowVote',
      payload: {
        mode: 'full',
        electionId: 'election-1',
        candidateId: 'candidate-1',
        candidateName: 'Lista Azul',
        presidentName: 'Ana Perez',
        electionTitle: 'Centro de estudiantes',
        presentialSessionId: null,
        timestamp: expect.any(Number),
      },
    });

    getAll.mockResolvedValueOnce([
      {id: 'queue-existing', task: {type: 'votingFlowVote', payload: {electionId: 'election-1'}}},
    ]);

    const duplicateId = await enqueueVote({
      electionId: 'election-1',
      candidateId: 'candidate-1',
      candidateName: 'Lista Azul',
      presidentName: 'Ana Perez',
    });

    expect(duplicateId).toBe('queue-existing');
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it('procesa un voto pendiente, lo sincroniza y actualiza el estado persistido', async () => {
    const storage = createStorage({
      'voting.lastReceipt': JSON.stringify({
        id: 'local-1',
        electionId: 'election-1',
        selectedCandidateId: 'candidate-1',
        synced: false,
        status: 'EN_COLA',
        statusLabel: 'EN COLA',
      }),
      'voting.participations': JSON.stringify([
        {
          id: 'local-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: false,
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
        },
      ]),
    });

    const submitVote = jest.fn().mockResolvedValue({
      success: true,
      participationId: 'server-1',
      participatedAt: '2026-01-01T10:00:00.000Z',
    });
    getElectionRepository.mockReturnValue({
      submitVote,
      registerParticipation: jest.fn(),
    });

    const result = await handleVotingQueueVote({
      task: {
        type: 'votingFlowVote',
        payload: {
          mode: 'full',
          electionId: 'election-1',
          candidateId: 'candidate-1',
          candidateName: 'Lista Azul',
          electionTitle: 'Centro de estudiantes',
        },
      },
    });

    expect(result).toMatchObject({
      success: true,
      participationId: 'server-1',
    });
    expect(submitVote).toHaveBeenCalledWith('election-1', 'candidate-1', null);

    const participations = JSON.parse(storage.get('voting.participations'));
    expect(participations[0]).toMatchObject({
      id: 'server-1',
      synced: true,
      status: 'VOTO_REGISTRADO',
      statusLabel: 'VOTO REGISTRADO',
    });
    expect(storage.get('voting.voteSynced')).toBe('true');
    expect(clearVoteJournal).toHaveBeenCalledWith('election-1');
  });

  it('marca el voto como error recuperable y conserva el recibo para reintento', async () => {
    const storage = createStorage({
      'voting.lastReceipt': JSON.stringify({
        id: 'local-1',
        electionId: 'election-1',
        synced: false,
        status: 'EN_COLA',
        statusLabel: 'EN COLA',
      }),
      'voting.participations': JSON.stringify([
        {
          id: 'local-1',
          electionId: 'election-1',
          synced: false,
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
        },
      ]),
    });

    const updated = await markVoteFailed({
      electionId: 'election-1',
      reason: 'Backend unavailable',
    });

    expect(updated).toMatchObject({
      electionId: 'election-1',
      status: 'ERROR',
      statusLabel: 'ERROR',
      errorMessage: 'Backend unavailable',
    });

    expect(JSON.parse(storage.get('voting.lastReceipt'))).toMatchObject({
      status: 'ERROR',
      errorMessage: 'Backend unavailable',
    });
    expect(clearVoteJournal).toHaveBeenCalledWith('election-1');
  });

  it('procesa sincronizacion backendOnly para una participacion ya emitida en cadena', async () => {
    const storage = createStorage({
      'voting.lastReceipt': JSON.stringify({
        id: 'local-1',
        electionId: 'election-1',
        selectedCandidateId: 'candidate-1',
        synced: false,
        status: 'EN_COLA',
        statusLabel: 'EN COLA',
      }),
      'voting.participations': JSON.stringify([
        {
          id: 'local-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: false,
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
        },
      ]),
    });

    const registerParticipation = jest.fn().mockResolvedValue({
      success: true,
      participationId: 'server-backend-1',
      participatedAt: '2026-01-01T11:00:00.000Z',
    });
    getElectionRepository.mockReturnValue({
      submitVote: jest.fn(),
      registerParticipation,
    });

    const result = await handleVotingQueueVote({
      task: {
        type: 'votingFlowVote',
        payload: {
          mode: 'backendOnly',
          electionId: 'election-1',
          candidateId: 'candidate-1',
          candidateName: 'Lista Azul',
          electionTitle: 'Centro de estudiantes',
        },
      },
    });

    expect(registerParticipation).toHaveBeenCalledWith('election-1', 'candidate-1', null);
    expect(result).toMatchObject({
      success: true,
      participationId: 'server-backend-1',
    });

    expect(JSON.parse(storage.get('voting.lastReceipt'))).toMatchObject({
      id: 'server-backend-1',
      synced: true,
      status: 'VOTO_REGISTRADO',
    });
  });

  it('conserva presentialSessionId en la cola y lo reenvia al sincronizar participacion backendOnly', async () => {
    getAll.mockResolvedValueOnce([]);
    enqueue.mockResolvedValueOnce('queue-presential-1');

    const queueId = await enqueueBackendParticipationSync({
      electionId: 'election-qr',
      candidateId: 'candidate-qr',
      candidateName: 'Lista QR',
      presidentName: 'Ana QR',
      electionTitle: 'Eleccion presencial',
      presentialSessionId: 'session-qr-1',
    });

    expect(queueId).toBe('queue-presential-1');
    expect(enqueue).toHaveBeenCalledWith({
      type: 'votingFlowVote',
      payload: {
        mode: 'backendOnly',
        electionId: 'election-qr',
        candidateId: 'candidate-qr',
        candidateName: 'Lista QR',
        presidentName: 'Ana QR',
        electionTitle: 'Eleccion presencial',
        presentialSessionId: 'session-qr-1',
        timestamp: expect.any(Number),
      },
    });

    createStorage({
      'voting.lastReceipt': JSON.stringify({
        id: 'local-qr',
        electionId: 'election-qr',
        selectedCandidateId: 'candidate-qr',
        synced: false,
        status: 'EN_COLA',
        statusLabel: 'EN COLA',
      }),
      'voting.participations': JSON.stringify([
        {
          id: 'local-qr',
          electionId: 'election-qr',
          selectedCandidateId: 'candidate-qr',
          synced: false,
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
        },
      ]),
    });

    const registerParticipation = jest.fn().mockResolvedValue({
      success: true,
      participationId: 'server-qr',
      participatedAt: '2026-01-01T11:00:00.000Z',
    });
    getElectionRepository.mockReturnValue({
      submitVote: jest.fn(),
      registerParticipation,
    });

    await handleVotingQueueVote({
      task: {
        type: 'votingFlowVote',
        payload: {
          mode: 'backendOnly',
          electionId: 'election-qr',
          candidateId: 'candidate-qr',
          candidateName: 'Lista QR',
          presentialSessionId: 'session-qr-1',
        },
      },
    });

    expect(registerParticipation).toHaveBeenCalledWith(
      'election-qr',
      'candidate-qr',
      'session-qr-1',
    );
  });

  it('libera solo la eleccion solicitada y conserva otras participaciones', async () => {
    const storage = createStorage({
      'voting.lastReceipt': JSON.stringify({
        id: 'receipt-other',
        electionId: 'election-2',
        selectedCandidateId: 'candidate-2',
        synced: true,
      }),
      'voting.participations': JSON.stringify([
        {
          id: 'local-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: false,
          status: 'ERROR',
        },
        {
          id: 'receipt-other',
          electionId: 'election-2',
          selectedCandidateId: 'candidate-2',
          synced: true,
          status: 'VOTO_REGISTRADO',
        },
      ]),
    });

    await releaseVoteForElection('election-1');

    expect(JSON.parse(storage.get('voting.participations'))).toEqual([
      expect.objectContaining({
        id: 'receipt-other',
        electionId: 'election-2',
      }),
    ]);
    expect(JSON.parse(storage.get('voting.lastReceipt'))).toMatchObject({
      id: 'receipt-other',
      electionId: 'election-2',
    });
    expect(clearVoteJournal).toHaveBeenCalledWith('election-1');
  });
});
