/**
 * Voting Feature
 *
 * Exports all feature components, screens, and utilities.
 * Use this file for clean imports:
 *
 * import { ElectionCard, CandidateScreen, useVotingState } from '../features/voting';
 */

// Components
export { default as ElectionCard } from './components/ElectionCard';
export { default as CandidateCard } from './components/CandidateCard';
export { default as ConfirmVoteModal } from './components/ConfirmVoteModal';
export { default as OfflineQueuedModal } from './components/OfflineQueuedModal';

// Screens
export { default as CandidateScreen } from './screens/CandidateScreen';
export { default as VoteReceiptScreen } from './screens/VoteReceiptScreen';
export { default as ParticipationsListScreen } from './screens/ParticipationsListScreen';
export { default as NotificationDetailScreen } from './screens/NotificationDetailScreen';
export { default as ClaimCredScreen } from './screens/ClaimCredScreen';

// State
export { useVotingState } from './state/useVotingState';

// Utils
export { useCountdown } from './utils/useCountdown';

// Data
export { useElectionRepository, getElectionRepository } from './data/useElectionRepository';
export { MOCK_ELECTION, MOCK_CANDIDATES, UI_STRINGS } from './data/mockData';

// Offline
export {
  reconcileVoteJournal,
  enqueueVote,
  enqueueBackendParticipationSync,
  hasPendingVotes,
  getPendingVotes,
  processVoteQueue,
  handleVotingQueueVote,
  markVoteFailed,
  releaseVoteForElection,
} from './offline/queueAdapter';

export {
  startVoteJournal,
  markVoteJournalChainConfirmed,
  clearVoteJournal,
  getPendingVoteJournalEntries,
} from './offline/voteJournal';
