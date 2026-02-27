/**
 * University Election Feature
 *
 * Exports all feature components, screens, and utilities.
 * Use this file for clean imports:
 *
 * import { ElectionCard, CandidateScreen, useUniversityElectionState } from '../features/universityElection';
 */

// Components
export { default as ElectionCard } from './components/ElectionCard';
export { default as CandidateCard } from './components/CandidateCard';
export { default as ConfirmVoteModal } from './components/ConfirmVoteModal';
export { default as OfflineQueuedModal } from './components/OfflineQueuedModal';

// Screens
export { default as CandidateScreen } from './screens/CandidateScreen';

// State
export { useUniversityElectionState } from './state/useUniversityElectionState';

// Data
export { useElectionRepository, getElectionRepository } from './data/useElectionRepository';
export { MOCK_ELECTION, MOCK_CANDIDATES, UI_STRINGS } from './data/mockData';

// Offline
export {
  enqueueVote,
  hasPendingVotes,
  getPendingVotes,
  processVoteQueue,
  handleUniversityElectionVote,
} from './offline/queueAdapter';
