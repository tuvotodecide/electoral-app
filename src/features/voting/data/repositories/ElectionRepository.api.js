import axios from 'axios';
import {BACKEND_RESULT} from '@env';
import store from '../../../../redux/store';
import { executeOperation } from '@/src/api/account';
import { castVote } from '@/src/api/vote';
import { CHAIN } from "@env";
import { generateNullifierForVote, saveNullifierForVote } from '@/src/data/voteNullifier';
import { getNullifierForVote } from '@/src/data/credentials';

const API_BASE = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1`;

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

const pickFeaturedEvent = data => {
  const active = Array.isArray(data?.active) ? data.active : [];
  const upcoming = Array.isArray(data?.upcoming) ? data.upcoming : [];
  return active[0] || upcoming[0] || null;
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

  return {
    id: String(event?.id || ''),
    title: event?.name || 'Votacion institucional',
    status: phaseToCardStatus(event?.phase),
    closesInLabel:
      event?.phase === 'UPCOMING' ? 'Inicia pronto' : 'Cierra pronto',
    instituteName: event?.objective || '',
    organization: event?.objective || '',
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

const ElectionRepositoryApi = {
  async getElection() {
    const {data} = await axios.get(`${API_BASE}/voting/events/public/landing`, {
      headers: {Accept: 'application/json'},
      timeout: 30000,
    });

    const event = pickFeaturedEvent(data);
    if (!event) {
      return null;
    }

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
  },

  async getCandidates(electionId) {
    if (!String(electionId || '').trim()) {
      return [];
    }
    const candidates = await requestCandidates(electionId);
    return candidates;
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
    } catch (error) {
      console.log('Error during on-chain voting process:', error);
      return {
        success: false,
        error: 'Failed to submit vote:' + error.message,
      }
    }

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
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'No se pudo registrar la participacion';
      return {
        success: false,
        error: typeof message === 'string' ? message : 'No se pudo registrar la participacion',
      };
    }
  },
};

export default ElectionRepositoryApi;
