import axios from 'axios';
import {BACKEND_RESULT} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../../../../redux/store';
import { executeOperation } from '@/src/api/account';
import { castVote } from '@/src/api/vote';
import { CHAIN } from "@env";
import { saveNullifierForVote } from '@/src/data/voteNullifier';
import { getNullifierForVote } from '@/src/data/credentials';
import { clearVoteJournal, markVoteJournalChainConfirmed } from '../../offline/voteJournal';

const API_BASE = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1`;
const LANDING_CACHE_KEY = 'voting.cache.publicLanding';
const CANDIDATES_CACHE_PREFIX = 'voting.cache.candidates:';

const safeParseJson = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const buildCacheEnvelope = data => {
  const expiry = new Date();
  expiry.setHours(23, 59, 59, 999);
  return {
    expiresAt: expiry.getTime(),
    data,
  };
};

const readCacheEnvelope = async key => {
  const raw = await AsyncStorage.getItem(key);
  const parsed = safeParseJson(raw);
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  const expiresAt = Number(parsed?.expiresAt || 0);
  if (!expiresAt || expiresAt < Date.now()) {
    await AsyncStorage.removeItem(key);
    return null;
  }
  return parsed?.data;
};

const getWalletPayload = () => store.getState()?.wallet?.payload || null;

const getCredentialSubject = payload =>
  payload?.vc?.credentialSubject || payload?.vc?.vc?.credentialSubject || {};

const getCurrentDni = () => {
  const payload = getWalletPayload();
  const subject = getCredentialSubject(payload);
  return String(
    payload?.dni ||
      subject?.governmentIdentifier ||
      subject?.documentNumber ||
      subject?.nationalIdNumber ||
      '',
  ).trim();
};

const getLandingEvents = data => {
  const groups = [
    Array.isArray(data?.active) ? data.active : [],
    Array.isArray(data?.upcoming) ? data.upcoming : [],
    Array.isArray(data?.results) ? data.results : [],
  ];
  const seen = new Set();

  return groups
    .flat()
    .filter(event => {
      const id = String(event?.id || '').trim();
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
};

const phaseToCardStatus = phase => {
  if (phase === 'ACTIVE') return 'ACTIVA';
  if (phase === 'UPCOMING') return 'PROXIMA';
  if (phase === 'RESULTS') return 'FINALIZADA';
  return 'ACTIVA';
};

const buildElectionModel = ({
  event,
  eligibility,
  participationStatus,
}) => {
  const eligibilityStatus = eligibility?.status || 'UNKNOWN';
  const participationCode = String(participationStatus?.status || '').toUpperCase();

  let statusMessage = '';
  if (eligibilityStatus === 'ROLL_IN_VALIDATION') {
    statusMessage = 'Padron en validacion';
  } else if (eligibilityStatus === 'PUBLIC_CHECK_DISABLED') {
    statusMessage = 'Consulta no disponible';
  } else if (eligibilityStatus === 'DISABLED') {
    statusMessage = 'Estas empadronado, pero no habilitado para votar';
  } else if (eligibilityStatus === 'NOT_ELIGIBLE') {
    statusMessage = 'No habilitado para votar';
  } else if (participationCode === 'OUTSIDE_VOTING_WINDOW') {
    statusMessage = 'Fuera del horario de votacion';
  } else if (participationCode === 'ALREADY_VOTED') {
    statusMessage = 'Ya registraste tu participacion';
  }

  const organizationName =
    event?.organizationName ||
    event?.institutionName ||
    event?.tenantName ||
    event?.institution?.name ||
    event?.tenant?.name ||
    event?.name ||
    '';

  return {
    id: String(event?.id || ''),
    title: event?.name || 'Votacion institucional',
    status: phaseToCardStatus(event?.phase),
    closesInLabel:
      event?.phase === 'UPCOMING' ? 'Inicia pronto' : 'Cierra pronto',
    instituteName: event?.objective || '',
    organization: organizationName,
    startsAt: event?.votingStart ? new Date(event.votingStart).getTime() : null,
    closesAt: event?.votingEnd ? new Date(event.votingEnd).getTime() : null,
    resultsAt: event?.resultsPublishAt
      ? new Date(event.resultsPublishAt).getTime()
      : null,
    isEligible: eligibility?.eligible === true,
    eligibilityStatus,
    canVote: participationStatus?.canVote === true,
    alreadyVoted: participationStatus?.alreadyVoted === true,
    publicEligibilityEnabled: event?.publicEligibilityEnabled !== false,
    statusMessage,
  };
};

const findCandidateByRoleName = (candidates = [], matcher) =>
  candidates.find(candidate => matcher(String(candidate?.roleName || '').toLowerCase()));

const mapOptionToCandidate = option => {
  const candidates = Array.isArray(option?.candidates) ? option.candidates : [];
  const president =
    findCandidateByRoleName(candidates, role => role.includes('president')) ||
    findCandidateByRoleName(candidates, role => role.includes('presidente')) ||
    candidates[0] ||
    null;
  const vice =
    findCandidateByRoleName(candidates, role => role.includes('vice')) ||
    findCandidateByRoleName(candidates, role => role.includes('suplente')) ||
    candidates[1] ||
    null;

  return {
    id: String(option?.id || ''),
    partyName: option?.name || 'Opcion',
    presidentName: president?.name || option?.name || 'Sin candidato',
    viceName: vice?.name || '',
    avatarUrl: president?.photoUrl || option?.logoUrl || null,
    partyColor: option?.color || '#2563EB',
  };
};

const buildIdempotencyKey = (electionId, candidateId) =>
  `vote:${String(electionId).trim()}:${getCurrentDni()}:${String(candidateId).trim()}`;

const requestPublicEventDetail = async electionId => {
  const {data} = await axios.get(
    `${API_BASE}/voting/events/public/detail/${encodeURIComponent(electionId)}`,
    {
      headers: {Accept: 'application/json'},
      timeout: 30000,
    },
  );
  return data;
};

const requestEligibility = async electionId => {
  const dni = getCurrentDni();
  if (!dni) {
    return {status: 'NO_DNI', eligible: false};
  }

  const {data} = await axios.get(
    `${API_BASE}/voting/events/${encodeURIComponent(
      electionId,
    )}/eligibility/public`,
    {
      params: {carnet: dni},
      headers: {Accept: 'application/json'},
      timeout: 30000,
    },
  );

  const status = String(data?.status || 'NOT_ELIGIBLE').toUpperCase();
  return {
    status,
    eligible: status === 'ELIGIBLE',
    referenceVersion: data?.referenceVersion || null,
  };
};

const requestParticipationStatus = async electionId => {
  const dni = getCurrentDni();
  if (!dni) {
    return {status: 'NO_DNI', canVote: false, alreadyVoted: false};
  }

  const {data} = await axios.get(
    `${API_BASE}/voting/events/${encodeURIComponent(
      electionId,
    )}/participations/status`,
    {
      params: {carnet: dni},
      headers: {Accept: 'application/json'},
      timeout: 30000,
    },
  );

  return {
    status: String(data?.status || 'UNKNOWN'),
    canVote: Boolean(data?.canVote),
    alreadyVoted: Boolean(data?.alreadyVoted),
    participatedAt: data?.participatedAt || null,
  };
};

const requestCandidates = async electionId => {
  const detail = await requestPublicEventDetail(electionId);
  const options = Array.isArray(detail?.options) ? detail.options : [];
  return options
    .filter(option => option?.active !== false)
    .map(mapOptionToCandidate)
    .filter(candidate => candidate.id);
};

const cacheCandidates = async (electionId, candidates) => {
  await AsyncStorage.setItem(
    `${CANDIDATES_CACHE_PREFIX}${String(electionId || '').trim()}`,
    JSON.stringify(buildCacheEnvelope(candidates || [])),
  );
};

const getCachedCandidates = async electionId => {
  const parsed = await readCacheEnvelope(
    `${CANDIDATES_CACHE_PREFIX}${String(electionId || '').trim()}`,
  );
  return Array.isArray(parsed) ? parsed : [];
};

const cacheLandingModels = async elections => {
  await AsyncStorage.setItem(
    LANDING_CACHE_KEY,
    JSON.stringify(buildCacheEnvelope(elections || [])),
  );
};

const getCachedLandingModels = async () => {
  const parsed = await readCacheEnvelope(LANDING_CACHE_KEY);
  return Array.isArray(parsed) ? parsed : [];
};

const shouldShowElectionInHome = election => {
  const eligibilityStatus = String(election?.eligibilityStatus || '').toUpperCase();
  if (election?.alreadyVoted) {
    return true;
  }
  if (election?.isEligible === true) {
    return true;
  }

  return ['DISABLED', 'ROLL_IN_VALIDATION', 'PUBLIC_CHECK_DISABLED'].includes(
    eligibilityStatus,
  );
};

const buildParticipationErrorMessage = (status, fallback = null) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ALREADY_VOTED') return 'Ya participaste en este evento';
  if (normalized === 'OUTSIDE_VOTING_WINDOW') return 'Fuera del horario de votacion';
  if (normalized === 'ROLL_IN_VALIDATION') return 'Padron en validacion';
  if (normalized === 'NOT_IN_ROLL') return 'No habilitado para votar';
  if (normalized === 'VOTER_DISABLED') return 'Estas empadronado, pero no habilitado para votar';
  if (normalized === 'PADRON_NOT_AVAILABLE') return 'Padron no disponible';
  if (normalized === 'EVENT_NOT_PUBLISHED') return 'Evento no disponible';
  return fallback || 'No se pudo registrar la participacion';
};

const postParticipation = async (electionId, candidateId, dni) => {
  try {
    const {data} = await axios.post(
      `${API_BASE}/voting/events/${encodeURIComponent(electionId)}/participations`,
      {carnet: dni},
      {
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': buildIdempotencyKey(electionId, candidateId),
        },
        timeout: 30000,
      },
    );

    return {
      success: true,
      participationId: String(data?.id || ''),
      participatedAt: data?.participatedAt || new Date().toISOString(),
      transactionId: null,
    };
  } catch (error) {
    const backendError =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.response?.data?.status ||
      error?.message;
    return {
      success: false,
      error: buildParticipationErrorMessage(
        error?.response?.data?.error,
        typeof backendError === 'string'
          ? backendError
          : 'No se pudo registrar la participacion',
      ),
      statusCode: Number(error?.response?.status || 0),
    };
  }
};

const ElectionRepositoryApi = {
  async getElections() {
    try {
      const dni = getCurrentDni();
      if (!dni) {
        await cacheLandingModels([]);
        return [];
      }

      const {data} = await axios.get(`${API_BASE}/voting/events/public/landing`, {
        params: {carnet: dni},
        headers: {Accept: 'application/json'},
        timeout: 30000,
      });

      const events = getLandingEvents(data);
      if (events.length === 0) {
        await cacheLandingModels([]);
        return [];
      }

      const elections = await Promise.all(
        events.map(async event => {
          const [eligibility, participationStatus] = await Promise.all([
            requestEligibility(event.id).catch(() => ({
              status: 'UNKNOWN',
              eligible: false,
            })),
            requestParticipationStatus(event.id).catch(() => ({
              status: 'UNKNOWN',
              canVote: false,
              alreadyVoted: false,
            })),
          ]);

          return buildElectionModel({
            event,
            eligibility,
            participationStatus,
          });
        }),
      );

      const visibleElections = elections.filter(shouldShowElectionInHome);

      await cacheLandingModels(visibleElections);
      await Promise.all(
        visibleElections
          .filter(election => election?.isEligible === true)
          .map(async election => {
            try {
              const candidates = await requestCandidates(election.id);
              await cacheCandidates(election.id, candidates);
            } catch {
              // no bloquear el landing por un fallo de precarga
            }
          }),
      );
      return visibleElections;
    } catch (error) {
      const cached = await getCachedLandingModels();
      if (cached.length > 0) {
        return cached;
      }
      throw error;
    }
  },

  async getElection() {
    const elections = await this.getElections();
    return elections.find(election => election?.status === 'ACTIVA') || elections[0] || null;
  },

  async getCandidates(electionId) {
    if (!String(electionId || '').trim()) {
      return [];
    }
    try {
      const candidates = await requestCandidates(electionId);
      await cacheCandidates(electionId, candidates);
      return candidates;
    } catch (error) {
      const cached = await getCachedCandidates(electionId);
      if (cached.length > 0) {
        return cached;
      }
      throw error;
    }
  },

  async submitVote(electionId, candidateId, candidateName) {
    if (!String(electionId || '').trim()) {
      return {
        success: false,
        error: 'No se encontro una eleccion valida',
      };
    }

    const dni = getCurrentDni();
    if (!dni) {
      return {
        success: false,
        error: 'No se encontro el carnet del usuario actual',
      };
    }

    const participationStatus = await requestParticipationStatus(electionId).catch(() => ({
      status: 'UNKNOWN',
      canVote: true,
      alreadyVoted: false,
    }));
    if (participationStatus?.alreadyVoted || participationStatus?.canVote === false) {
      return {
        success: false,
        error: buildParticipationErrorMessage(
          participationStatus?.status,
          'No se pudo registrar la participacion',
        ),
      };
    }

    try {
      const nullifier = await getNullifierForVote(electionId);
      console.log('Nullifier for vote obtained:', nullifier);

      const response = await executeOperation(
        '',
        '',
        CHAIN,
        castVote(electionId, candidateName, nullifier),
        null,
        null,
        true
      );

      console.log('Vote transaction response:', response);
      await saveNullifierForVote(electionId, nullifier);
      await markVoteJournalChainConfirmed(electionId);
    } catch (error) {
      await clearVoteJournal(electionId);
      console.log('Error during on-chain voting process:', error);
      return {
        success: false,
        error: 'Failed to submit vote:' + error.message,
      }
    }

    const backendResult = await postParticipation(electionId, candidateId, dni);
    if (backendResult.success) {
      await clearVoteJournal(electionId);
      return backendResult;
    }

    return {
      success: false,
      error: backendResult.error,
      blockchainCommitted: true,
      shouldQueueBackendSync: true,
    };
  },

  async registerParticipation(electionId, candidateId) {
    if (!String(electionId || '').trim()) {
      return {
        success: false,
        error: 'No se encontro una eleccion valida',
      };
    }

    const dni = getCurrentDni();
    if (!dni) {
      return {
        success: false,
        error: 'No se encontro el carnet del usuario actual',
      };
    }

    return postParticipation(electionId, candidateId, dni);
  },
};

export default ElectionRepositoryApi;
