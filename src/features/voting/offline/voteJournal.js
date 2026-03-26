import AsyncStorage from '@react-native-async-storage/async-storage';

const VOTE_JOURNAL_KEY = 'voting.pendingJournal';

const safeParseJson = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const readJournal = async () => {
  const raw = await AsyncStorage.getItem(VOTE_JOURNAL_KEY);
  const parsed = safeParseJson(raw);
  return parsed && typeof parsed === 'object' ? parsed : {};
};

const writeJournal = async journal => {
  await AsyncStorage.setItem(VOTE_JOURNAL_KEY, JSON.stringify(journal || {}));
};

export const startVoteJournal = async voteData => {
  const journal = await readJournal();
  journal[String(voteData?.electionId || '').trim()] = {
    electionId: voteData?.electionId || '',
    candidateId: voteData?.candidateId || '',
    candidateName: voteData?.candidateName || '',
    presidentName: voteData?.presidentName || '',
    electionTitle: voteData?.electionTitle || '',
    organization: voteData?.organization || '',
    candidateSelected: voteData?.candidateSelected || null,
    status: 'PREPARING',
    updatedAt: Date.now(),
  };
  await writeJournal(journal);
};

export const markVoteJournalChainConfirmed = async (electionId, patch = {}) => {
  const normalizedElectionId = String(electionId || '').trim();
  if (!normalizedElectionId) return;

  const journal = await readJournal();
  const current = journal[normalizedElectionId];
  if (!current) return;

  journal[normalizedElectionId] = {
    ...current,
    ...patch,
    status: 'CHAIN_CONFIRMED',
    updatedAt: Date.now(),
  };
  await writeJournal(journal);
};

export const clearVoteJournal = async electionId => {
  const normalizedElectionId = String(electionId || '').trim();
  if (!normalizedElectionId) return;

  const journal = await readJournal();
  delete journal[normalizedElectionId];
  await writeJournal(journal);
};

export const getPendingVoteJournalEntries = async () => {
  const journal = await readJournal();
  return Object.values(journal || {});
};
