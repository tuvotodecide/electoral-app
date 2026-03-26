/**
 * Offline Queue Adapter for Voting
 */

import { enqueue, getAll, processQueue } from '../../../utils/offlineQueue';
import { getElectionRepository } from '../data/useElectionRepository';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureError } from '../../../config/sentry';
import {
  clearVoteJournal,
  getPendingVoteJournalEntries,
} from './voteJournal';

const TASK_TYPE = 'votingFlowVote';

const HAS_VOTED_KEY = 'voting.hasVoted';
const VOTE_SYNCED_KEY = 'voting.voteSynced';
const SELECTED_CANDIDATE_ID_KEY = 'voting.selectedCandidateId';
const ELECTION_ID_KEY = 'voting.electionId';
const VOTE_TIMESTAMP_KEY = 'voting.voteTimestamp';
const PARTICIPATION_ID_KEY = 'voting.participationId';
const LAST_RECEIPT_KEY = 'voting.lastReceipt';
const PARTICIPATIONS_KEY = 'voting.participations';

const safeParseJson = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const matchesElection = (participation, electionId) =>
  String(participation?.electionId || '') === String(electionId || '');

const getLatestParticipation = participations =>
  Array.isArray(participations) && participations.length > 0
    ? participations[0]
    : null;

const persistVotingState = async ({participations, lastReceipt}) => {
  const latest = getLatestParticipation(participations) || lastReceipt || null;

  const tasks = [
    AsyncStorage.setItem(PARTICIPATIONS_KEY, JSON.stringify(participations || [])),
  ];

  if (lastReceipt) {
    tasks.push(AsyncStorage.setItem(LAST_RECEIPT_KEY, JSON.stringify(lastReceipt)));
  } else {
    tasks.push(AsyncStorage.removeItem(LAST_RECEIPT_KEY));
  }

  if (latest) {
    tasks.push(
      AsyncStorage.setItem(HAS_VOTED_KEY, 'true'),
      AsyncStorage.setItem(VOTE_SYNCED_KEY, latest?.synced === true ? 'true' : 'false'),
      AsyncStorage.setItem(
        SELECTED_CANDIDATE_ID_KEY,
        String(latest?.selectedCandidateId || ''),
      ),
      AsyncStorage.setItem(ELECTION_ID_KEY, String(latest?.electionId || '')),
      AsyncStorage.setItem(
        VOTE_TIMESTAMP_KEY,
        String(Date.parse(latest?.participatedAt || '') || Date.now()),
      ),
      AsyncStorage.setItem(PARTICIPATION_ID_KEY, String(latest?.id || '')),
    );
  } else {
    tasks.push(
      AsyncStorage.removeItem(HAS_VOTED_KEY),
      AsyncStorage.removeItem(VOTE_SYNCED_KEY),
      AsyncStorage.removeItem(SELECTED_CANDIDATE_ID_KEY),
      AsyncStorage.removeItem(ELECTION_ID_KEY),
      AsyncStorage.removeItem(VOTE_TIMESTAMP_KEY),
      AsyncStorage.removeItem(PARTICIPATION_ID_KEY),
    );
  }

  await Promise.all(tasks);
};

const buildReceiptFromJournal = journal => {
  const now = new Date();
  return {
    id: journal?.participationId || `participation_${now.getTime()}`,
    electionId: journal?.electionId || '',
    electionTitle: journal?.electionTitle || 'Votacion institucional',
    status: 'EN_COLA',
    statusLabel: 'EN COLA',
    date: now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
    time: now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fullDate: now.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    organization: journal?.organization || '',
    transactionId: journal?.transactionId || null,
    blockchainHash: journal?.transactionId || null,
    candidateSelected: journal?.candidateSelected || null,
    errorMessage: null,
    nftId: null,
    nftImageUrl: null,
    participatedAt: now.toISOString(),
    selectedCandidateId: journal?.candidateId || null,
    synced: false,
  };
};

const ensurePendingParticipationFromJournal = async journalEntry => {
  const [lastReceiptRaw, participationsRaw] = await Promise.all([
    AsyncStorage.getItem(LAST_RECEIPT_KEY),
    AsyncStorage.getItem(PARTICIPATIONS_KEY),
  ]);
  const lastReceipt = safeParseJson(lastReceiptRaw);
  const participations = safeParseJson(participationsRaw);
  const list = Array.isArray(participations) ? participations : [];
  const exists = list.some(item => matchesElection(item, journalEntry?.electionId));
  if (exists) return;

  const receipt = buildReceiptFromJournal(journalEntry);
  await persistVotingState({
    participations: [receipt, ...list],
    lastReceipt:
      matchesElection(lastReceipt, journalEntry?.electionId) || !lastReceipt
        ? receipt
        : lastReceipt,
  });
};

export const reconcileVoteJournal = async () => {
  const entries = await getPendingVoteJournalEntries();
  const queue = await getAll();
  const reconciled = [];

  for (const entry of entries) {
    const electionId = String(entry?.electionId || '').trim();
    if (!electionId) continue;

    if (entry?.status === 'CHAIN_CONFIRMED') {
      await ensurePendingParticipationFromJournal(entry);

      const alreadyQueued = queue.some(
        item =>
          item?.task?.type === TASK_TYPE &&
          item?.task?.payload?.mode === 'backendOnly' &&
          String(item?.task?.payload?.electionId || '') === electionId,
      );

      if (!alreadyQueued) {
        await enqueueBackendParticipationSync(entry);
      }
      reconciled.push(electionId);
      continue;
    }

    if (
      entry?.status === 'PREPARING' &&
      Number(entry?.updatedAt || 0) > 0 &&
      Date.now() - Number(entry.updatedAt) > 10 * 60 * 1000
    ) {
      await clearVoteJournal(electionId);
    }
  }

  return reconciled;
};

export const markVoteFailed = async ({electionId, reason = null}) => {
  if (!String(electionId || '').trim()) {
    return null;
  }

  const [lastReceiptRaw, participationsRaw] = await Promise.all([
    AsyncStorage.getItem(LAST_RECEIPT_KEY),
    AsyncStorage.getItem(PARTICIPATIONS_KEY),
  ]);
  const lastReceipt = safeParseJson(lastReceiptRaw);
  const participations = safeParseJson(participationsRaw);
  const nextParticipations = Array.isArray(participations)
    ? participations.map(participation =>
        matchesElection(participation, electionId) && participation?.synced !== true
          ? {
              ...participation,
              synced: false,
              status: 'ERROR',
              statusLabel: 'ERROR',
              errorMessage: reason,
            }
          : participation,
      )
    : [];
  const nextReceipt =
    lastReceipt && matchesElection(lastReceipt, electionId)
      ? {
          ...lastReceipt,
          synced: false,
          status: 'ERROR',
          statusLabel: 'ERROR',
          errorMessage: reason,
        }
      : lastReceipt;

  await persistVotingState({
    participations: nextParticipations,
    lastReceipt: nextReceipt,
  });
  await clearVoteJournal(electionId);

  return nextParticipations.find(item => matchesElection(item, electionId)) || nextReceipt;
};

export const releaseVoteForElection = async electionId => {
  if (!String(electionId || '').trim()) {
    return false;
  }

  const [lastReceiptRaw, participationsRaw] = await Promise.all([
    AsyncStorage.getItem(LAST_RECEIPT_KEY),
    AsyncStorage.getItem(PARTICIPATIONS_KEY),
  ]);
  const lastReceipt = safeParseJson(lastReceiptRaw);
  const participations = safeParseJson(participationsRaw);
  const nextParticipations = Array.isArray(participations)
    ? participations.filter(item => !matchesElection(item, electionId))
    : [];
  const nextReceipt =
    lastReceipt && matchesElection(lastReceipt, electionId) ? null : lastReceipt;

  await persistVotingState({
    participations: nextParticipations,
    lastReceipt: nextReceipt,
  });
  await clearVoteJournal(electionId);

  return true;
};

/**
 * Encola un voto para procesamiento posterior (cuando hay conexión)
 *
 * @param {Object} voteData
 * @param {string} voteData.electionId
 * @param {string} voteData.candidateId
 * @param {string} voteData.candidateName - Para votacion on-chain
 * @param {string} voteData.presidentName - Para mostrar en UI
 * @returns {Promise<string>} ID del item en cola
 */
export const enqueueVote = async (voteData) => {
  if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
    throw new Error('Voting flow is disabled');
  }

  const queue = await getAll();
  const existing = queue.find(
    item =>
      item?.task?.type === TASK_TYPE &&
      String(item?.task?.payload?.electionId || '') === String(voteData?.electionId || ''),
  );
  if (existing?.id) {
    return existing.id;
  }

  const task = {
    type: TASK_TYPE,
    payload: {
      mode: 'full',
      electionId: voteData.electionId,
      candidateId: voteData.candidateId,
      candidateName: voteData.candidateName,
      presidentName: voteData.presidentName,
      electionTitle: voteData.electionTitle || '',
      timestamp: Date.now(),
    },
  };

  const queueId = await enqueue(task);
  return queueId;
};

export const enqueueBackendParticipationSync = async voteData => {
  if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
    throw new Error('Voting flow is disabled');
  }

  const queue = await getAll();
  const existing = queue.find(
    item =>
      item?.task?.type === TASK_TYPE &&
      item?.task?.payload?.mode === 'backendOnly' &&
      String(item?.task?.payload?.electionId || '') === String(voteData?.electionId || ''),
  );
  if (existing?.id) {
    return existing.id;
  }

  return enqueue({
    type: TASK_TYPE,
    payload: {
      mode: 'backendOnly',
      electionId: voteData.electionId,
      candidateId: voteData.candidateId,
      candidateName: voteData.candidateName,
      presidentName: voteData.presidentName,
      electionTitle: voteData.electionTitle || '',
      timestamp: Date.now(),
    },
  });
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

  const { electionId, candidateId, candidateName, mode, electionTitle } = item.task.payload || {};

  if (!electionId || !candidateId || !candidateName) {
    // Item malformado, marcarlo como error terminal
    const error = new Error('Invalid vote data: missing electionId, candidateId, or candidateName');
    error.removeFromQueue = true;
    throw error;
  }

  // Usar el repositorio para enviar el voto
  try {
    const repository = getElectionRepository();
    const result =
      mode === 'backendOnly'
        ? await repository.registerParticipation(electionId, candidateId)
        : await repository.submitVote(electionId, candidateId, candidateName);

    if (!result.success) {
      throw new Error(result.error || 'Vote submission failed');
    }

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
      errorMessage: null,
      id: result.participationId || participation?.id,
      participatedAt: result.participatedAt || participation?.participatedAt,
    });

    const nextParticipations = Array.isArray(participations)
      ? participations.map(participation =>
          matchesElection(participation, electionId) && participation?.synced !== true
            ? patch(participation)
            : participation,
        )
      : [];
    const nextLastReceipt =
      lastReceipt &&
      matchesElection(lastReceipt, electionId) &&
      String(lastReceipt?.selectedCandidateId || '') === String(candidateId)
        ? patch(lastReceipt)
        : lastReceipt;

    await persistVotingState({
      participations: nextParticipations,
      lastReceipt: nextLastReceipt,
    });
    await clearVoteJournal(electionId);

    return result;
  } catch (error) {
    captureError(error, {
      flow: 'voting_flow',
      step: 'process_offline_vote',
      critical: false,
      allowPii: false,
      extra: {
        electionId,
        candidateId,
      },
    });
    throw error;
  }
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
  reconcileVoteJournal,
  enqueueVote,
  enqueueBackendParticipationSync,
  handleVotingQueueVote,
  hasPendingVotes,
  getPendingVotes,
  processVoteQueue,
  markVoteFailed,
  releaseVoteForElection,
  registerVoteHandler,
  TASK_TYPE,
};
