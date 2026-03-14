/**
 * Offline Queue Adapter for Voting
 */

import { enqueue, getAll, processQueue } from '../../../utils/offlineQueue';
import { getElectionRepository } from '../data/useElectionRepository';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASK_TYPE = 'votingFlowVote';

const VOTE_SYNCED_KEY = 'voting.voteSynced';
const LAST_RECEIPT_KEY = 'voting.lastReceipt';
const PARTICIPATIONS_KEY = 'voting.participations';

const safeParseJson = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

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
  if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
    throw new Error('Voting flow is disabled');
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
export const handleVotingQueueVote = async (item) => {
  if (item?.task?.type !== TASK_TYPE) {
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

  const [lastReceiptRaw, participationsRaw] = await Promise.all([
    AsyncStorage.getItem(LAST_RECEIPT_KEY),
    AsyncStorage.getItem(PARTICIPATIONS_KEY),
  ]);
  const lastReceipt = safeParseJson(lastReceiptRaw);
  const participations = safeParseJson(participationsRaw);
  const patch = participation => ({
    ...participation,
    synced: true,
    status: 'VOTO_REGISTRADO',
    statusLabel: 'VOTO REGISTRADO',
    id: result.participationId || participation?.id,
    participatedAt: result.participatedAt || participation?.participatedAt,
  });

  const nextParticipations = Array.isArray(participations)
    ? participations.map(participation => {
        const sameElection =
          String(participation?.electionId || '') === String(electionId);
        const sameCandidate =
          String(participation?.selectedCandidateId || '') === String(candidateId);
        return sameElection && sameCandidate && participation?.synced !== true
          ? patch(participation)
          : participation;
      })
    : [];
  const nextLastReceipt =
    lastReceipt &&
    String(lastReceipt?.electionId || '') === String(electionId) &&
    String(lastReceipt?.selectedCandidateId || '') === String(candidateId)
      ? patch(lastReceipt)
      : lastReceipt;

  await Promise.all([
    nextParticipations.length > 0
      ? AsyncStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(nextParticipations))
      : Promise.resolve(),
    nextLastReceipt
      ? AsyncStorage.setItem(LAST_RECEIPT_KEY, JSON.stringify(nextLastReceipt))
      : Promise.resolve(),
  ]);

  return result;
};

/**
 * Verifica si hay votos pendientes en la cola
 * @returns {Promise<boolean>}
 */
export const hasPendingVotes = async () => {
  if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
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
  if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
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
  if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
    return { processed: 0, failed: 0 };
  }

  return processQueue(handleVotingQueueVote);
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
    handler: handleVotingQueueVote,
  };
};

export default {
  enqueueVote,
  handleVotingQueueVote,
  hasPendingVotes,
  getPendingVotes,
  processVoteQueue,
  registerVoteHandler,
  TASK_TYPE,
};
