/**
 * Offline Queue Adapter for University Election
 *
 * Usa el sistema de offlineQueue existente del repo.
 * NO reimplementa la cola ni el backoff.
 */

import { enqueue, getAll, processQueue } from '../../../utils/offlineQueue';
import { getElectionRepository } from '../data/useElectionRepository';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Task type identifier for university election votes
const TASK_TYPE = 'universityElectionVote';

// Storage key for synced status
const VOTE_SYNCED_KEY = 'universityElection.voteSynced';

/**
 * Encola un voto para procesamiento posterior (cuando hay conexión)
 *
 * @param {Object} voteData
 * @param {string} voteData.electionId
 * @param {string} voteData.candidateId
 * @param {string} voteData.presidentName - Para mostrar en UI
 * @returns {Promise<string>} ID del item en cola
 */
export const enqueueVote = async (voteData) => {
  if (!FEATURE_FLAGS.ENABLE_UNIVERSITY_ELECTION) {
    throw new Error('University election feature is disabled');
  }

  const task = {
    type: TASK_TYPE,
    payload: {
      electionId: voteData.electionId,
      candidateId: voteData.candidateId,
      presidentName: voteData.presidentName,
      timestamp: Date.now(),
    },
  };

  const queueId = await enqueue(task);
  return queueId;
};

/**
 * Handler para procesar votos de la cola
 * Es llamado por el sistema de offlineQueue existente
 *
 * @param {Object} item - Item de la cola
 */
export const handleUniversityElectionVote = async (item) => {
  if (item?.task?.type !== TASK_TYPE) {
    // No es un voto de elección universitaria, ignorar
    return;
  }

  const { electionId, candidateId } = item.task.payload || {};

  if (!electionId || !candidateId) {
    // Item malformado, marcarlo como error terminal
    const error = new Error('Invalid vote data: missing electionId or candidateId');
    error.removeFromQueue = true;
    throw error;
  }

  // Usar el repositorio para enviar el voto
  const repository = getElectionRepository();
  const result = await repository.submitVote(electionId, candidateId);

  if (!result.success) {
    throw new Error(result.error || 'Vote submission failed');
  }

  // Voto enviado exitosamente, marcar como sincronizado
  await AsyncStorage.setItem(VOTE_SYNCED_KEY, 'true');

  // Opcional: Mint NFT después de voto exitoso
  try {
    await repository.mintNFT(electionId, candidateId);
  } catch (nftError) {
    // NFT es secundario, no fallar si no se puede generar
    console.warn('[UniversityElection] NFT mint failed:', nftError);
  }

  return result;
};

/**
 * Verifica si hay votos pendientes en la cola
 * @returns {Promise<boolean>}
 */
export const hasPendingVotes = async () => {
  if (!FEATURE_FLAGS.ENABLE_UNIVERSITY_ELECTION) {
    return false;
  }

  const queue = await getAll();
  return queue.some((item) => item?.task?.type === TASK_TYPE);
};

/**
 * Obtiene los votos pendientes en la cola
 * @returns {Promise<Array>}
 */
export const getPendingVotes = async () => {
  if (!FEATURE_FLAGS.ENABLE_UNIVERSITY_ELECTION) {
    return [];
  }

  const queue = await getAll();
  return queue.filter((item) => item?.task?.type === TASK_TYPE);
};

/**
 * Procesa la cola de votos manualmente
 * Nota: Normalmente el sistema existente procesa automáticamente con backoff
 *
 * @returns {Promise<{processed: number, failed: number}>}
 */
export const processVoteQueue = async () => {
  if (!FEATURE_FLAGS.ENABLE_UNIVERSITY_ELECTION) {
    return { processed: 0, failed: 0 };
  }

  return processQueue(handleUniversityElectionVote);
};

/**
 * Registra el handler de votos con el sistema de cola existente
 * Debe llamarse al iniciar la app si el feature está habilitado
 */
export const registerVoteHandler = () => {
  // El handler se registra devolviendo la función para que el sistema
  // de offlineQueue lo pueda usar
  return {
    type: TASK_TYPE,
    handler: handleUniversityElectionVote,
  };
};

export default {
  enqueueVote,
  handleUniversityElectionVote,
  hasPendingVotes,
  getPendingVotes,
  processVoteQueue,
  registerVoteHandler,
  TASK_TYPE,
};
