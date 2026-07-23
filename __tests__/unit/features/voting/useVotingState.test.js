import AsyncStorage from '@react-native-async-storage/async-storage';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {useVotingState} from '../../../../src/features/voting/state/useVotingState';
import { hashVoteNullifier } from '../../../../src/features/voting/utils/dataHasher';

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

jest.mock('@/src/data/credentials', () => ({
  getCredentialForVote: jest.fn(),
}));

const {getOwnVoteInfo} = require('@/src/api/vote');
const {getCredentialForVote} = require('@/src/data/credentials');

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
    getCredentialForVote.mockResolvedValue({
      info: {
        credentialSubject: {
          nullifier: '0x123',
        },
      },
    });
    getOwnVoteInfo.mockResolvedValue([true, 'Lista Azul']);

    const {result} = renderHook(() => useVotingState('123abc'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('participation-1');
    });

    expect(getCredentialForVote).toHaveBeenCalledWith('123abc', 'did:example:123', undefined );
    expect(getOwnVoteInfo).toHaveBeenCalledWith('123abc', hashVoteNullifier('123abc', '0x123'));
    expect(result.current.syncedWithBlockchain).not.toBeNull();
    expect(result.current.syncedWithBlockchain.status).toBe('synced');
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
    getCredentialForVote.mockResolvedValue(null);

    const {result} = renderHook(() => useVotingState('election-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('participation-1');
    });

    expect(getOwnVoteInfo).not.toHaveBeenCalled();
    expect(result.current.syncedWithBlockchain).not.toBeNull();
    expect(result.current.syncedWithBlockchain.status).toBe('failed');
    expect(result.current.syncedWithBlockchain.error).toBe(`Credential not found for electionId election-1`);

  });

  it('sincroniza una participacion recuperada desde backend aunque no exista localmente', async () => {
    const storage = createStorage({
      'voting.participations': JSON.stringify([]),
    });
    getCredentialForVote.mockResolvedValue({
      info: {
        credentialSubject: {
          nullifier: '0x123',
        },
      },
    });
    getOwnVoteInfo.mockResolvedValue([true, 'Lista Contrato']);

    const {result} = renderHook(() => useVotingState('123abc'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('backend-participation');
    });

    expect(getCredentialForVote).toHaveBeenCalledWith('123abc', 'did:example:123', undefined);
    expect(getOwnVoteInfo).toHaveBeenCalledWith('123abc', hashVoteNullifier('123abc', '0x123'));
    expect(result.current.syncedWithBlockchain).toEqual({
      status: 'synced',
      data: {
        hasVoted: true,
        option: 'Lista Contrato',
      },
    });
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('nullifier-backend'),
    );
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Lista Contrato'),
    );
    expect(storage.get('voting.participations')).toBe('[]');
  });

  it('marca not_synced cuando contrato responde hasVoted false', async () => {
    createStorage({
      'voting.participations': JSON.stringify([]),
    });
    getCredentialForVote.mockResolvedValue({
      info: {
        credentialSubject: {
          nullifier: '0x123',
        },
      },
    });
    getOwnVoteInfo.mockResolvedValue([false, '']);

    const {result} = renderHook(() => useVotingState('123abc'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('backend-not-voted');
    });

    expect(getOwnVoteInfo).toHaveBeenCalledWith('123abc', hashVoteNullifier('123abc', '0x123'));
    expect(result.current.syncedWithBlockchain).toEqual({
      status: 'not_synced',
      data: {
        hasVoted: false,
        option: '',
      },
    });
  });

  it('marca fallo controlado cuando falla contrato', async () => {
    createStorage({
      'voting.participations': JSON.stringify([]),
    });
    getCredentialForVote.mockResolvedValue({
      info: {
        credentialSubject: {
          nullifier: '0x123',
        },
      },
    });
    getOwnVoteInfo.mockRejectedValue(new Error('RPC failed'));

    const {result} = renderHook(() => useVotingState('123abc'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('backend-error');
    });

    expect(result.current.syncedWithBlockchain).toEqual({
      status: 'failed',
      error: 'RPC failed',
    });
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
    getCredentialForVote.mockResolvedValue({
      info: {
        credentialSubject: {
          nullifier: '0x123abc',
        },
      },
    });
    getOwnVoteInfo.mockResolvedValue([true, 'Lista Verde']);

    const {result} = renderHook(() => useVotingState('123abc'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.syncStateWithBlockchain('participation-1');
    });

    expect(result.current.syncedWithBlockchain.status).toBe("not_synced");
  });
});
