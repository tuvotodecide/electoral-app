/**
 * University Election State Hook
 *
 * Maneja el estado persistente de la votación universitaria.
 * Usa AsyncStorage con keys namespaced para evitar colisiones.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEATURE_FLAGS } from '../../../config/featureFlags';

// Storage keys - namespaced para evitar colisiones
const STORAGE_KEYS = {
  HAS_VOTED: 'universityElection.hasVoted',
  VOTE_SYNCED: 'universityElection.voteSynced',
  SELECTED_CANDIDATE_ID: 'universityElection.selectedCandidateId',
  ELECTION_ID: 'universityElection.electionId',
  VOTE_TIMESTAMP: 'universityElection.voteTimestamp',
};

/**
 * Hook para manejar el estado de la votación universitaria
 * @param {string} electionId - ID de la elección
 */
export const useUniversityElectionState = (electionId = 'election_univ_1') => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteSynced, setVoteSynced] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // Cargar estado inicial desde AsyncStorage
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_UNIVERSITY_ELECTION) {
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
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HAS_VOTED),
          AsyncStorage.getItem(STORAGE_KEYS.VOTE_SYNCED),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CANDIDATE_ID),
          AsyncStorage.getItem(STORAGE_KEYS.ELECTION_ID),
        ]);

        // Solo cargar estado si es la misma elección
        if (storedElectionId === electionId) {
          setHasVoted(storedHasVoted === 'true');
          setVoteSynced(storedVoteSynced === 'true');
          setSelectedCandidateId(storedCandidateId || null);
        }
      } catch (error) {
        console.error('[UniversityElection] Error loading state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [electionId]);

  /**
   * Registra un voto localmente
   * @param {string} candidateId - ID del candidato seleccionado
   * @param {boolean} synced - Si el voto ya fue sincronizado con el servidor
   */
  const recordVote = useCallback(
    async (candidateId, synced = false) => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.HAS_VOTED, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.VOTE_SYNCED, synced ? 'true' : 'false'),
          AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CANDIDATE_ID, candidateId),
          AsyncStorage.setItem(STORAGE_KEYS.ELECTION_ID, electionId),
          AsyncStorage.setItem(STORAGE_KEYS.VOTE_TIMESTAMP, Date.now().toString()),
        ]);

        setHasVoted(true);
        setVoteSynced(synced);
        setSelectedCandidateId(candidateId);

        return true;
      } catch (error) {
        console.error('[UniversityElection] Error recording vote:', error);
        return false;
      }
    },
    [electionId],
  );

  /**
   * Marca el voto como sincronizado (cuando se procesa la cola offline)
   */
  const markVoteSynced = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOTE_SYNCED, 'true');
      setVoteSynced(true);
      return true;
    } catch (error) {
      console.error('[UniversityElection] Error marking vote synced:', error);
      return false;
    }
  }, []);

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
      ]);

      setHasVoted(false);
      setVoteSynced(false);
      setSelectedCandidateId(null);

      return true;
    } catch (error) {
      console.error('[UniversityElection] Error resetting state:', error);
      return false;
    }
  }, []);

  /**
   * Refresca el estado desde AsyncStorage
   */
  const refreshState = useCallback(async () => {
    try {
      const [storedVoteSynced] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VOTE_SYNCED),
      ]);
      setVoteSynced(storedVoteSynced === 'true');
    } catch (error) {
      console.error('[UniversityElection] Error refreshing state:', error);
    }
  }, []);

  return {
    isLoading,
    hasVoted,
    voteSynced,
    selectedCandidateId,
    recordVote,
    markVoteSynced,
    resetState,
    refreshState,
  };
};

export default useUniversityElectionState;
