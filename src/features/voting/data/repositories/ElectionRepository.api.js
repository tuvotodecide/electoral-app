import axios from 'axios';
import {BACKEND_RESULT} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from '../../../../redux/store';
import { executeOperation } from '@/src/api/account';
import { castVote } from '@/src/api/vote';
import { CHAIN } from "@env";
import { getCredentialForVote, getNullifierForVote, saveNullifierForVote } from '@/src/data/credentials';
import { authenticateWithBackend, getVoteRequestForBackend } from '../../../../utils/offlineQueueHandler';
import { clearVoteJournal, markVoteJournalChainConfirmed } from '../../offline/voteJournal';
import wira from 'wira-sdk';

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

const getCurrentDid = () => {
  const payload = getWalletPayload();
  const subject = getCredentialSubject(payload);
  return String(
    payload?.did ||
      payload?.payloadQr?.did ||
      subject?.did ||
      '',
  ).trim();
};

const getCurrentPrivKey = () => {
  const payload = getWalletPayload();
  return String(
    payload?.privKey ||
      payload?.payloadQr?.privKey ||
      '',
  ).trim();
};

const getVotingAuthHeaders = async () => {
  const did = getCurrentDid();
  const privKey = getCurrentPrivKey();

  if (!did || !privKey) {
    throw new Error('No se pudo validar tu acceso para esta consulta');
  }

  const apiKey = await authenticateWithBackend(did, privKey);

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
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

const resolveReferendumQuestion = event =>
  String(
    event?.objective ||
      event?.description ||
      event?.questionTitle ||
      event?.name ||
      '',
  ).trim();

const buildElectionModel = ({
  event,
  eligibility,
  participationStatus,
}) => {
  const eligibilityStatus = eligibility?.status || 'UNKNOWN';
  const participationCode = String(participationStatus?.status || '').toUpperCase();

  let statusMessage = '';
  if (eligibilityStatus === 'ROLL_IN_VALIDATION') {
    statusMessage = 'Padrón en validación';
  } else if (eligibilityStatus === 'PUBLIC_CHECK_DISABLED') {
    statusMessage = 'Consulta no disponible';
  } else if (eligibilityStatus === 'DISABLED') {
    statusMessage = 'Estás empadronado, pero no habilitado para votar';
  } else if (eligibilityStatus === 'NOT_ELIGIBLE') {
    statusMessage = 'No habilitado para votar';
  } else if (participationCode === 'OUTSIDE_VOTING_WINDOW') {
    statusMessage = 'Fuera del horario de votación';
  } else if (participationCode === 'ALREADY_VOTED') {
    statusMessage = 'Ya registraste tu participación';
  }

  const organizationName =
    event?.organizationName ||
    event?.institutionName ||
    event?.tenantName ||
    event?.institution?.name ||
    event?.tenant?.name ||
    event?.name ||
    '';
  const isReferendum = event?.isReferendum === true;
  const questionTitle = resolveReferendumQuestion(event);

  return {
    id: String(event?.id || ''),
    title: event?.name || 'Votación institucional',
    questionTitle,
    objective: questionTitle,
    status: phaseToCardStatus(event?.phase),
    closesInLabel:
      event?.phase === 'UPCOMING' ? 'Inicia pronto' : 'Cierra pronto',
    instituteName: questionTitle,
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
    presentialKioskEnabled: event?.presentialKioskEnabled === true,
    isReferendum,
    statusMessage,
  };
};

const findCandidateByRoleName = (candidates = [], matcher) =>
  candidates.find(candidate => matcher(String(candidate?.roleName || '').toLowerCase()));

const mapTicketEntries = candidates =>
  (Array.isArray(candidates) ? candidates : [])
    .map(candidate => ({
      roleName: String(candidate?.roleName || candidate?.role?.name || '').trim(),
      name: String(candidate?.name || '').trim(),
    }))
    .filter(candidate => candidate.name);

const normalizeOptionColors = option => {
  const colors = Array.isArray(option?.colors)
    ? option.colors
        .map(color => String(color || '').trim())
        .filter(Boolean)
    : [];

  if (colors.length > 0) {
    return colors;
  }

  const legacyColor = String(option?.color || '').trim();
  return [legacyColor || '#2563EB'];
};

const mapOptionToCandidate = (option, event = null) => {
  const isReferendum = event?.isReferendum === true;
  const questionTitle = resolveReferendumQuestion(event);
  const candidates = Array.isArray(option?.candidates) ? option.candidates : [];
  const ticketEntries = mapTicketEntries(candidates);
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
    partyName: option?.name || 'Opción',
    presidentName: president?.name || option?.name || 'Sin candidato',
    viceName: vice?.name || '',
    ticketEntries,
    avatarUrl: president?.photoUrl || option?.logoUrl || null,
    partyColor: normalizeOptionColors(option)[0] || '#2563EB',
    partyColors: normalizeOptionColors(option),
    ...(isReferendum
      ? {
          isReferendum: true,
          questionTitle,
          electionObjective: questionTitle,
        }
      : {}),
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
    .map(option => mapOptionToCandidate(option, detail))
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
  if (normalized === 'OUTSIDE_VOTING_WINDOW') return 'Fuera del horario de votación';
  if (normalized === 'ROLL_IN_VALIDATION') return 'Padrón en validación';
  if (normalized === 'NOT_IN_ROLL') return 'No habilitado para votar';
  if (normalized === 'VOTER_DISABLED') return 'Estás empadronado, pero no habilitado para votar';
  if (normalized === 'PADRON_NOT_AVAILABLE') return 'Padrón no disponible';
  if (normalized === 'EVENT_NOT_PUBLISHED') return 'Evento no disponible';
  return fallback || 'No se pudo registrar la participación';
};

const resolveParticipationTitle = participation =>
  String(
    participation?.eventName ||
      participation?.eventTitle ||
      participation?.title ||
      participation?.name ||
      participation?.electionTitle ||
      participation?.event?.name ||
      '',
  ).trim() || 'Votación institucional';

const resolveParticipationOrganization = participation =>
  String(
    participation?.organizationName ||
      participation?.organization ||
      participation?.institutionName ||
      participation?.tenantName ||
      participation?.event?.organizationName ||
      participation?.event?.institutionName ||
      '',
  ).trim();

const normalizeParticipationStatus = participation => {
  const rawStatus = String(
    participation?.statusLabel || participation?.status || '',
  ).toUpperCase();

  if (rawStatus.includes('ERROR') || rawStatus.includes('FAILED')) {
    return {status: 'ERROR', statusLabel: 'ERROR'};
  }

  if (
    rawStatus.includes('COLA') ||
    rawStatus.includes('QUEUE') ||
    rawStatus.includes('PENDING')
  ) {
    return {status: 'EN_COLA', statusLabel: 'EN COLA'};
  }

  return {status: 'VOTO_REGISTRADO', statusLabel: 'VOTO REGISTRADO'};
};

const formatParticipationDateParts = rawDate => {
  const parsedDate = new Date(rawDate || Date.now());
  const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return {
    participatedAt: validDate.toISOString(),
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
  };
};

const mapParticipationRecord = participation => {
  const {status, statusLabel} = normalizeParticipationStatus(participation);
  const dateParts = formatParticipationDateParts(
    participation?.participatedAt ||
      participation?.createdAt ||
      participation?.timestamp,
  );

  return {
    id: String(
      participation?.id ||
        participation?.participationId ||
        `${participation?.eventId || 'participation'}:${dateParts.participatedAt}`,
    ),
    electionId: String(
      participation?.eventId || participation?.electionId || participation?.event?.id || '',
    ),
    electionTitle: resolveParticipationTitle(participation),
    status,
    statusLabel,
    date: dateParts.date,
    time: dateParts.time,
    fullDate: dateParts.fullDate,
    organization: resolveParticipationOrganization(participation),
    transactionId: participation?.transactionId || participation?.txHash || null,
    blockchainHash:
      participation?.blockchainHash ||
      participation?.txHash ||
      participation?.transactionId ||
      null,
    candidateSelected: participation?.candidateSelected || null,
    errorMessage: participation?.errorMessage || null,
    nftId: participation?.nftId || null,
    nftImageUrl: participation?.nftImageUrl || null,
    participatedAt: dateParts.participatedAt,
    selectedCandidateId:
      participation?.selectedCandidateId ||
      participation?.candidateId ||
      participation?.optionId ||
      null,
    synced: status === 'VOTO_REGISTRADO',
  };
};

const extractParticipations = data => {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.participations)) {
    return data.participations;
  }
  return [];
};

const buildWitnessPartyResults = ballot => {
  const presidentVotes = (ballot?.votes?.parties?.partyVotes || []).map(party => ({
    partyId: party.partyId,
    presidente: party.votes ? party.votes.toString() : '0',
  }));

  return presidentVotes.reduce((acc, current) => {
    const existing = acc.find(item => item.partyId === current.partyId);
    if (existing) {
      existing.presidente = (
        parseInt(existing.presidente, 10) + parseInt(current.presidente, 10)
      ).toString();
      return acc;
    }

    acc.push({
      partyId: current.partyId,
      presidente: current.presidente || '0',
    });
    return acc;
  }, []);
};

const buildWitnessVoteSummaryResults = ballot => [
  {
    label: 'Validos',
    value1: ballot?.votes?.parties?.validVotes?.toString() || '0',
  },
  {
    label: 'Blanco',
    value1: ballot?.votes?.parties?.blankVotes?.toString() || '0',
  },
  {
    label: 'Nulos',
    value1: ballot?.votes?.parties?.nullVotes?.toString() || '0',
  },
  {
    label: 'Total',
    value1: ballot?.votes?.parties?.totalVotes?.toString() || '0',
  },
];

const mapWitnessRecord = (attestation, ballot) => {
  const rawDate = ballot?.createdAt || attestation?.createdAt || Date.now();
  const dateParts = formatParticipationDateParts(rawDate);
  const tableNumber = ballot?.tableNumber || attestation?.tableNumber || '';
  const certificateUrl = attestation?.certificateUrl || null;

  return {
    id: `attestation:${String(ballot?._id || attestation?.ballotId || dateParts.participatedAt)}`,
    itemType: 'attestation',
    electionId: '',
    electionTitle: tableNumber ? `Mesa ${tableNumber}` : 'Atestiguamiento',
    status: 'ATESTIGUAMIENTO',
    statusLabel: 'ATESTIGUAMIENTO',
    date: dateParts.date,
    time: dateParts.time,
    fullDate: dateParts.fullDate,
    organization:
      ballot?.electoralLocation?.name ||
      ballot?.locationName ||
      ballot?.precinctName ||
      '',
    transactionId: null,
    blockchainHash: null,
    candidateSelected: null,
    errorMessage: null,
    nftId: null,
    nftImageUrl: certificateUrl,
    participatedAt: dateParts.participatedAt,
    selectedCandidateId: null,
    synced: true,
    photoUri: ballot?.image
      ? String(ballot.image).replace('ipfs://', 'https://ipfs.io/ipfs/')
      : null,
    mesaData: {
      tableNumber,
      tableCode: ballot?.tableCode || null,
      numero: tableNumber || null,
      mesa: tableNumber ? `Mesa ${tableNumber}` : null,
      fecha: new Date(rawDate).toLocaleDateString('es-ES'),
    },
    partyResults: buildWitnessPartyResults(ballot),
    voteSummaryResults: buildWitnessVoteSummaryResults(ballot),
    attestationData: {
      tableNumber,
      tableCode: ballot?.tableCode || null,
      fecha: new Date(rawDate).toLocaleDateString('es-ES'),
      hora: new Date(rawDate).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      certificateUrl,
    },
    certificateUrl,
  };
};

const fetchWitnessRecordsByDni = async dni => {
  if (!dni) {
    return [];
  }

  const attestationsResponse = await axios.get(
    `${API_BASE}/attestations/by-user/${encodeURIComponent(dni)}`,
    {
      timeout: 30000,
    },
  );

  const attestations = Array.isArray(attestationsResponse?.data?.data)
    ? attestationsResponse.data.data
    : [];

  if (attestations.length === 0) {
    return [];
  }

  const ballots = await Promise.all(
    attestations.map(async attestation => {
      try {
        const ballotResponse = await axios.get(
          `${API_BASE}/ballots/${encodeURIComponent(attestation?.ballotId)}`,
          {
            timeout: 30000,
          },
        );

        return {
          attestation,
          ballot: ballotResponse?.data || null,
        };
      } catch {
        return null;
      }
    }),
  );

  return ballots
    .filter(entry => entry?.ballot)
    .map(entry => mapWitnessRecord(entry.attestation, entry.ballot))
    .sort(
      (left, right) =>
        new Date(right?.participatedAt || 0).getTime() -
        new Date(left?.participatedAt || 0).getTime(),
    );
};

const postParticipation = async (electionId, candidateId, dni, presentialSessionId) => {
  try {
    const body = {carnet: dni};
    if (presentialSessionId) {
      body.presentialSessionId = presentialSessionId;
    }

    const {data} = await axios.post(
      `${API_BASE}/voting/events/${encodeURIComponent(electionId)}/participations`,
      body,
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
          : 'No se pudo registrar la participación',
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

  async getParticipations() {
    const dni = getCurrentDni();
    if (!dni) {
      return [];
    }

    const requestUrl = `${API_BASE}/voting/events/participations`;
    let headers = await getVotingAuthHeaders();
    let data;
    try {
      const response = await axios.get(requestUrl, {
        params: {carnet: dni},
        headers,
        timeout: 30000,
      });
      data = response.data;
    } catch (error) {
      if (Number(error?.response?.status) !== 401) {
        throw error;
      }

      headers = await getVotingAuthHeaders();
      const retryResponse = await axios.get(requestUrl, {
        params: {carnet: dni},
        headers,
        timeout: 30000,
      });
      data = retryResponse.data;
    }

    return extractParticipations(data)
      .map(mapParticipationRecord)
      .sort(
        (left, right) =>
          new Date(right?.participatedAt || 0).getTime() -
          new Date(left?.participatedAt || 0).getTime(),
      );
  },

  async getWitnessRecords() {
    const dni = getCurrentDni();
    return fetchWitnessRecordsByDni(dni);
  },

  async submitVote(electionId, candidateId, presentialSessionId) {
    if (!String(electionId || '').trim()) {
      return {
        success: false,
        error: 'No se encontró una elección válida',
      };
    }

    const dni = getCurrentDni();
    if (!dni) {
      return {
        success: false,
        error: 'No se encontró el carnet del usuario actual',
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
          'No se pudo registrar la participación',
        ),
      };
    }

    try {
      const did = getCurrentDid();
      const privKey = getCurrentPrivKey();

      const voteRequest = await getVoteRequestForBackend();
      const callbackUrl = voteRequest.body.callbackUrl;
      if(!callbackUrl) {
        throw new Error('No se pudo preparar la confirmación del voto');
      }
      voteRequest.body.callbackUrl = callbackUrl + `?optionId=${candidateId}`

      const credential = await getCredentialForVote(electionId, did, privKey);
      if (!credential) {
        throw new Error('No se pudo validar tu acceso para emitir el voto');
      }

      await wira.authenticateWithVerifier(
        JSON.stringify(voteRequest),
        did,
        privKey,
        [credential.id]
      );

      await markVoteJournalChainConfirmed(electionId);
    } catch (error) {
      await clearVoteJournal(electionId);
      return {
        success: false,
        error: 'No se pudo registrar el voto. Intenta nuevamente.',
      }
    }

    const backendResult = await postParticipation(electionId, candidateId, dni, presentialSessionId);
    if (backendResult.success) {
      await clearVoteJournal(electionId);
      return backendResult;
    }

    return {
      success: false,
      error: backendResult.error,
      blockchainCommitted: true,
      shouldQueueBackendSync: true,
      presentialSessionId: presentialSessionId || null,
    };
  },

  async verifyVoteQrCode(qrData) {
    const verifyUrl = `${API_BASE}/voting/presential-sessions/scan`;
    try {
      const response = await axios.post(
        verifyUrl,
        {
          token: qrData,
          carnet: getCurrentDni(),
        }
      );

      return response.data.presentialSessionId;
    } catch (error) {
      throw new Error(`No se pudo validar el código QR.`);
    }
  },

  async registerParticipation(electionId, candidateId, presentialSessionId) {
    if (!String(electionId || '').trim()) {
      return {
        success: false,
        error: 'No se encontró una elección válida',
      };
    }

    const dni = getCurrentDni();
    if (!dni) {
      return {
        success: false,
        error: 'No se encontró el carnet del usuario actual',
      };
    }

    return postParticipation(electionId, candidateId, dni, presentialSessionId);
  },
};

export default ElectionRepositoryApi;
