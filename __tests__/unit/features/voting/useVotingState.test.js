import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {useVotingState} from '../../../../src/features/voting/state/useVotingState';

jest.mock('../../../../src/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    ENABLE_VOTING_FLOW: true,
  },
  DEV_FLAGS: {
    FORCE_HAS_NOT_VOTED: false,
  },
}));

jest.mock('@/src/api/vote', () => ({
  getOwnVoteInfo: jest.fn(),
}));

jest.mock('@/src/data/voteNullifier', () => ({
  getNullifierForVote: jest.fn(),
}));

const {getOwnVoteInfo} = require('@/src/api/vote');
const {getNullifierForVote} = require('@/src/data/voteNullifier');

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

describe('useVotingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carga el estado persistido filtrando por eleccion actual', async () => {
    createStorage({
      'voting.lastReceipt': JSON.stringify({id: 'latest-other', electionId: 'other', synced: true}),
      'voting.participations': JSON.stringify([
        {
          id: 'participation-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: false,
        },
        {
          id: 'participation-2',
          electionId: 'other',
          selectedCandidateId: 'candidate-9',
          synced: true,
        },
      ]),
      'voting.voteSynced': 'true',
      'voting.participationId': 'fallback-id',
    });

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasVoted).toBe(true);
    expect(result.current.voteSynced).toBe(false);
    expect(result.current.selectedCandidateId).toBe('candidate-1');
    expect(result.current.participationId).toBe('participation-1');
  });

  it('registra un voto con payload util para recibo y lo persiste en storage', async () => {
    const storage = createStorage({
      'voting.participations': JSON.stringify([]),
    });

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let receipt;
    await act(async () => {
      receipt = await result.current.recordVote('candidate-1', true, {
        participationId: 'server-1',
        electionTitle: 'Centro de estudiantes',
        organization: 'Facultad',
        candidateSelected: {
          partyName: 'Lista Azul',
          presidentName: 'Ana Perez',
          viceName: 'Luis Rojas',
        },
      });
    });

    expect(receipt.id).toBe('server-1');
    expect(receipt.electionId).toBe('election-1');
    expect(receipt.synced).toBe(true);
    expect(result.current.hasVoted).toBe(true);
    expect(result.current.voteSynced).toBe(true);
    expect(result.current.selectedCandidateId).toBe('candidate-1');

    const persistedParticipations = JSON.parse(storage.get('voting.participations'));
    expect(persistedParticipations[0]).toMatchObject({
      id: 'server-1',
      electionId: 'election-1',
      selectedCandidateId: 'candidate-1',
      synced: true,
    });
    expect(storage.get('voting.voteSynced')).toBe('true');
  });

  it('marca un voto pendiente como sincronizado y actualiza el recibo actual', async () => {
    createStorage({
      'voting.participations': JSON.stringify([
        {
          id: 'participation-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: false,
          status: 'EN_COLA',
          statusLabel: 'EN COLA',
        },
      ]),
      'voting.lastReceipt': JSON.stringify({
        id: 'participation-1',
        electionId: 'election-1',
        selectedCandidateId: 'candidate-1',
        synced: false,
        status: 'EN_COLA',
        statusLabel: 'EN COLA',
      }),
      'voting.participationId': 'participation-1',
    });

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markVoteSynced();
    });

    expect(result.current.voteSynced).toBe(true);
    expect(result.current.participations[0]).toMatchObject({
      id: 'participation-1',
      synced: true,
      status: 'VOTO_REGISTRADO',
      statusLabel: 'VOTO REGISTRADO',
    });
  });

  it('sincroniza contra blockchain usando nullifier y coincidencia de opcion', async () => {
    createStorage({
      'voting.participations': JSON.stringify([
        {
          id: 'participation-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: true,
          candidateSelected: {partyName: 'Lista Azul'},
        },
      ]),
    });
    getNullifierForVote.mockResolvedValue('nullifier-1');
    getOwnVoteInfo.mockResolvedValue([true, 'Lista Azul']);

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('participation-1');
    });

    expect(getNullifierForVote).toHaveBeenCalledWith('election-1');
    expect(getOwnVoteInfo).toHaveBeenCalledWith('election-1', 'nullifier-1');
    expect(result.current.syncedWithBlockchain).toBe('synced');
  });

  it('marca fallo cuando no encuentra nullifier para consultar blockchain', async () => {
    createStorage({
      'voting.participations': JSON.stringify([
        {
          id: 'participation-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: true,
          candidateSelected: {partyName: 'Lista Azul'},
        },
      ]),
    });
    getNullifierForVote.mockResolvedValue(null);

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('participation-1');
    });

    expect(getOwnVoteInfo).not.toHaveBeenCalled();
    expect(result.current.syncedWithBlockchain).toBe('failed');
  });

  it('marca not_synced cuando blockchain devuelve una opcion distinta', async () => {
    createStorage({
      'voting.participations': JSON.stringify([
        {
          id: 'participation-1',
          electionId: 'election-1',
          selectedCandidateId: 'candidate-1',
          synced: true,
          candidateSelected: {partyName: 'Lista Azul'},
        },
      ]),
    });
    getNullifierForVote.mockResolvedValue('nullifier-1');
    getOwnVoteInfo.mockResolvedValue([true, 'Lista Verde']);

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('participation-1');
    });

    expect(result.current.syncedWithBlockchain).toBe('not_synced');
  });
});
