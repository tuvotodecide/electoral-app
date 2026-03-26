/**
 * Voting State Hook
 *
 * Maneja el estado persistente del flujo de votación.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEATURE_FLAGS, DEV_FLAGS } from '../../../config/featureFlags';
import { getOwnVoteInfo } from '@/src/api/vote';
import { getNullifierForVote } from '@/src/data/voteNullifier';

// Storage keys - namespaced para evitar colisiones
const STORAGE_KEYS = {
  HAS_VOTED: 'voting.hasVoted',
  VOTE_SYNCED: 'voting.voteSynced',
  SELECTED_CANDIDATE_ID: 'voting.selectedCandidateId',
  ELECTION_ID: 'voting.electionId',
  VOTE_TIMESTAMP: 'voting.voteTimestamp',
  PARTICIPATION_ID: 'voting.participationId',
  LAST_RECEIPT: 'voting.lastReceipt',
  PARTICIPATIONS: 'voting.participations',
};

const safeParseJson = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const matchesElection = (participation, electionId) =>
  String(participation?.electionId || '') === String(electionId || '');

const getMostRecentParticipation = (participations = [], electionId = '') => {
  if (!Array.isArray(participations)) {
    return null;
  }

  if (!electionId) {
    return participations[0] || null;
  }

  return participations.find(item => matchesElection(item, electionId)) || null;
};

const buildScopedState = ({
  electionId,
  participations,
  lastReceipt,
  storedVoteSynced,
  storedParticipationId,
}) => {
  const scopedParticipation =
    getMostRecentParticipation(participations, electionId) ||
    (matchesElection(lastReceipt, electionId) ? lastReceipt : null);

  return {
    hasVoted: Boolean(scopedParticipation),
    voteSynced:
      scopedParticipation?.synced === true ||
      (!electionId && storedVoteSynced === 'true'),
    selectedCandidateId: scopedParticipation?.selectedCandidateId || null,
    participationId:
      scopedParticipation?.id ||
      (!electionId ? storedParticipationId || null : null),
    lastReceipt:
      matchesElection(lastReceipt, electionId) || !electionId
        ? lastReceipt || null
        : scopedParticipation,
  };
};

const buildParticipationRecord = ({
  electionId,
  candidateId,
  synced,
  metadata = {},
}) => {
  const rawDate = metadata.participatedAt || metadata.timestamp || new Date().toISOString();
  const date = new Date(rawDate);
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const id =
    metadata.participationId ||
    metadata.id ||
    `participation_${validDate.getTime()}`;

  return {
    id,
    electionId: electionId || metadata.electionId || '',
    electionTitle: metadata.electionTitle || 'Votación institucional',
    status: synced ? 'VOTO_REGISTRADO' : 'EN_COLA',
    statusLabel: synced ? 'VOTO REGISTRADO' : 'EN COLA',
    date: validDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
    time: validDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fullDate: validDate.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    organization: metadata.organization || '',
    transactionId: metadata.transactionId || null,
    blockchainHash: metadata.blockchainHash || metadata.transactionId || null,
    candidateSelected: metadata.candidateSelected || null,
    errorMessage: metadata.errorMessage || null,
    nftId: metadata.nftId || null,
    nftImageUrl: metadata.nftImageUrl || null,
    participatedAt: validDate.toISOString(),
    selectedCandidateId: candidateId || metadata.selectedCandidateId || null,
    synced,
  };
};

/**
 * Hook para manejar el estado de votación
 * @param {string} electionId - ID de la elección
 */
export const useVotingState = (electionId = '') => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteSynced, setVoteSynced] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [participationId, setParticipationId] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [syncedWithBlockchain, setSyncedWithBlockchain] = useState('loading');

  // Cargar estado inicial desde AsyncStorage
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
      setIsLoading(false);
      return;
    }

    const loadState = async () => {
      try {
        const [
          storedHasVoted,
          storedVoteSynced,
          storedCandidateId,
          storedElectionId,
          storedParticipationId,
          storedLastReceipt,
          storedParticipations,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HAS_VOTED),
          AsyncStorage.getItem(STORAGE_KEYS.VOTE_SYNCED),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CANDIDATE_ID),
          AsyncStorage.getItem(STORAGE_KEYS.ELECTION_ID),
          AsyncStorage.getItem(STORAGE_KEYS.PARTICIPATION_ID),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_RECEIPT),
          AsyncStorage.getItem(STORAGE_KEYS.PARTICIPATIONS),
        ]);

        const parsedLastReceipt = safeParseJson(storedLastReceipt);
        const parsedParticipations = safeParseJson(storedParticipations);
        const normalizedParticipations = Array.isArray(parsedParticipations)
          ? parsedParticipations
          : [];
        const scopedState = buildScopedState({
          electionId: electionId || storedElectionId,
          participations: normalizedParticipations,
          lastReceipt: parsedLastReceipt || null,
          storedVoteSynced,
          storedParticipationId,
        });

        setHasVoted(
          electionId || storedElectionId
            ? scopedState.hasVoted
            : storedHasVoted === 'true' || scopedState.hasVoted,
        );
        setVoteSynced(scopedState.voteSynced);
        setSelectedCandidateId(scopedState.selectedCandidateId || storedCandidateId || null);
        setParticipationId(scopedState.participationId);
        setLastReceipt(scopedState.lastReceipt || parsedLastReceipt || null);
        setParticipations(normalizedParticipations);
      } catch (error) {
        console.error('[Voting] Error loading state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [electionId]);

  const syncStateWithBlockchain = async (participationId) => {
    const localParticipation = participations.find(p => p.id === participationId);
    if (!localParticipation) {
      return;
    }

    try {
      setSyncedWithBlockchain('loading');
      const nullifier = await getNullifierForVote(electionId);
      if(!nullifier) {
        setSyncedWithBlockchain('failed');
        throw new Error(`Nullifier not found for electionId ${electionId}`);
      }

      const voteInfo = await getOwnVoteInfo(electionId, nullifier);
      if (Array.isArray(voteInfo) && voteInfo.length === 2) {
        const [hasVoted, option] = voteInfo;
        if (hasVoted && option == localParticipation?.candidateSelected?.partyName) {
          setSyncedWithBlockchain('synced');
        } else {
          setSyncedWithBlockchain('not_synced');
        }
      }
    } catch (error) {
      setSyncedWithBlockchain('failed');
    }
  }

  /**
   * Registra un voto localmente
   * @param {string} candidateId - ID del candidato seleccionado
   * @param {boolean} synced - Si el voto ya fue sincronizado con el servidor
   * @param {Object} metadata - Datos extras para recibo/listado
   */
  const recordVote = useCallback(
    async (candidateId, synced = false, metadata = {}) => {
      try {
        const receipt = buildParticipationRecord({
          electionId,
          candidateId,
          synced,
          metadata,
        });

        const currentParticipationsRaw = await AsyncStorage.getItem(STORAGE_KEYS.PARTICIPATIONS);
        const currentParticipations = safeParseJson(currentParticipationsRaw);
        const nextParticipationsBase = Array.isArray(currentParticipations)
          ? currentParticipations
          : [];
        const nextParticipations = [
          receipt,
          ...nextParticipationsBase.filter(
            item => item?.id !== receipt.id && !matchesElection(item, receipt.electionId),
          ),
        ];

        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.HAS_VOTED, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.VOTE_SYNCED, synced ? 'true' : 'false'),
          AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CANDIDATE_ID, candidateId),
          AsyncStorage.setItem(STORAGE_KEYS.ELECTION_ID, electionId),
          AsyncStorage.setItem(
            STORAGE_KEYS.VOTE_TIMESTAMP,
            String(Date.parse(receipt.participatedAt) || Date.now()),
          ),
          AsyncStorage.setItem(STORAGE_KEYS.PARTICIPATION_ID, receipt.id),
          AsyncStorage.setItem(STORAGE_KEYS.LAST_RECEIPT, JSON.stringify(receipt)),
          AsyncStorage.setItem(
            STORAGE_KEYS.PARTICIPATIONS,
            JSON.stringify(nextParticipations),
          ),
        ]);

        setHasVoted(true);
        setVoteSynced(synced);
        setSelectedCandidateId(candidateId);
        setParticipationId(receipt.id);
        setLastReceipt(receipt);
        setParticipations(nextParticipations);

        return receipt;
      } catch (error) {
        console.error('[Voting] Error recording vote:', error);
        return null;
      }
    },
    [electionId],
  );

  const updateParticipation = useCallback(async (targetParticipationId, patch = {}) => {
    try {
      const currentParticipationsRaw = await AsyncStorage.getItem(STORAGE_KEYS.PARTICIPATIONS);
      const currentParticipations = safeParseJson(currentParticipationsRaw);
      const source = Array.isArray(currentParticipations) ? currentParticipations : [];
      const nextParticipations = source.map(item =>
        item?.id === targetParticipationId
          ? {
              ...item,
              ...patch,
              status:
                patch.synced === true ? 'VOTO_REGISTRADO' : patch.status || item.status,
              statusLabel:
                patch.synced === true ? 'VOTO REGISTRADO' : patch.statusLabel || item.statusLabel,
            }
          : item,
      );
      const nextReceipt =
        (lastReceipt?.id === targetParticipationId
          ? nextParticipations.find(item => item?.id === targetParticipationId)
          : lastReceipt) || null;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PARTICIPATIONS, JSON.stringify(nextParticipations)),
        nextReceipt
          ? AsyncStorage.setItem(STORAGE_KEYS.LAST_RECEIPT, JSON.stringify(nextReceipt))
          : Promise.resolve(),
      ]);

      if (patch.synced === true) {
        await AsyncStorage.setItem(STORAGE_KEYS.VOTE_SYNCED, 'true');
        setVoteSynced(true);
      }

      setParticipations(nextParticipations);
      if (nextReceipt) {
        setLastReceipt(nextReceipt);
      }

      return nextParticipations.find(item => item?.id === targetParticipationId) || null;
    } catch (error) {
      console.error('[Voting] Error updating participation:', error);
      return null;
    }
  }, [lastReceipt]);

  /**
   * Marca el voto como sincronizado (cuando se procesa la cola offline)
   */
  const markVoteSynced = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOTE_SYNCED, 'true');
      setVoteSynced(true);
      if (participationId) {
        await updateParticipation(participationId, { synced: true });
      }
      return true;
    } catch (error) {
      console.error('[Voting] Error marking vote synced:', error);
      return false;
    }
  }, [participationId, updateParticipation]);

  /**
   * Resetea el estado (solo para desarrollo/testing)
   */
  const resetState = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.HAS_VOTED),
        AsyncStorage.removeItem(STORAGE_KEYS.VOTE_SYNCED),
        AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CANDIDATE_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.ELECTION_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.VOTE_TIMESTAMP),
        AsyncStorage.removeItem(STORAGE_KEYS.PARTICIPATION_ID),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_RECEIPT),
        AsyncStorage.removeItem(STORAGE_KEYS.PARTICIPATIONS),
      ]);

      setHasVoted(false);
      setVoteSynced(false);
      setSelectedCandidateId(null);
      setParticipationId(null);
      setLastReceipt(null);
      setParticipations([]);

      return true;
    } catch (error) {
      console.error('[Voting] Error resetting state:', error);
      return false;
    }
  }, []);

  /**
   * Refresca el estado desde AsyncStorage
   */
  const refreshState = useCallback(async () => {
    try {
      const [storedVoteSynced, storedLastReceipt, storedParticipations, storedParticipationId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VOTE_SYNCED),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_RECEIPT),
        AsyncStorage.getItem(STORAGE_KEYS.PARTICIPATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PARTICIPATION_ID),
      ]);
      const parsedLastReceipt = safeParseJson(storedLastReceipt);
      const parsedParticipations = safeParseJson(storedParticipations);
      const normalizedParticipations = Array.isArray(parsedParticipations)
        ? parsedParticipations
        : [];
      const scopedState = buildScopedState({
        electionId,
        participations: normalizedParticipations,
        lastReceipt: parsedLastReceipt,
        storedVoteSynced,
        storedParticipationId,
      });
      setHasVoted(scopedState.hasVoted);
      setVoteSynced(scopedState.voteSynced);
      setSelectedCandidateId(scopedState.selectedCandidateId);
      setLastReceipt(scopedState.lastReceipt || parsedLastReceipt || null);
      setParticipations(normalizedParticipations);
      setParticipationId(scopedState.participationId);
    } catch (error) {
      console.error('[Voting] Error refreshing state:', error);
    }
  }, []);

  // DEV_FLAG: Forzar estado "no ha votado" para testing
  const effectiveHasVoted = DEV_FLAGS.FORCE_HAS_NOT_VOTED ? false : hasVoted;
  const effectiveVoteSynced = DEV_FLAGS.FORCE_HAS_NOT_VOTED ? false : voteSynced;

  return {
    isLoading,
    hasVoted: effectiveHasVoted,
    voteSynced: effectiveVoteSynced,
    selectedCandidateId,
    syncedWithBlockchain,
    syncStateWithBlockchain,
    participationId,
    lastReceipt,
    participations,
    recordVote,
    updateParticipation,
    markVoteSynced,
    resetState,
    refreshState,
  };
};

export default useVotingState;
