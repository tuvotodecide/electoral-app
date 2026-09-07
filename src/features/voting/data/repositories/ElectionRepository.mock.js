/**
 * Repositorio de elecciones simulado (mock / demostración).
 *
 * Implementa el mismo contrato que ElectionRepository.api.js sin red, sin
 * cadena y sin SDK nativo. Se usa cuando el modo demostración está activo y
 * cuando ENABLE_VOTING_FLOW está apagado.
 *
 * El estado es MUTABLE y se persiste en AsyncStorage para que, tras votar, la
 * participación aparezca en `getParticipations()` y la elección reporte
 * `alreadyVoted: true` incluso después de reiniciar la app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {DEMO_ID_PREFIX} from '../../../demo/demoConfig';
import {
  buildMockElection,
  buildMockPastParticipation,
  DEMO_ELECTION_ID,
  DEMO_ELECTION_ORGANIZATION,
  MOCK_CANDIDATES,
} from '../mockData';
import {blankVote} from '../params';

const STATE_STORAGE_KEY = 'demo.repository.state';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Estado en memoria; `null` hasta la primera lectura. */
let state = null;

const buildInitialState = () => ({
  participations: [buildMockPastParticipation()],
});

const loadState = async () => {
  if (state) {
    return state;
  }
  try {
    const raw = await AsyncStorage.getItem(STATE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    state =
      parsed && Array.isArray(parsed.participations)
        ? parsed
        : buildInitialState();
  } catch (_) {
    state = buildInitialState();
  }
  return state;
};

const persistState = async () => {
  try {
    await AsyncStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    // el modo demostración sigue funcionando en memoria
  }
};

/** La participación de la elección activa, si ya se votó en esta sesión. */
const findActiveParticipation = current =>
  current.participations.find(item => item.electionId === DEMO_ELECTION_ID) ||
  null;

const resolveCandidate = candidateId => {
  if (candidateId === blankVote.id) {
    return {
      partyName: 'Voto en Blanco',
      presidentName: 'Voto en Blanco',
      viceName: '',
      ticketEntries: [],
    };
  }
  return MOCK_CANDIDATES.find(candidate => candidate.id === candidateId) || null;
};

const buildParticipationRecord = (candidateId, candidate) => {
  const participatedAt = new Date();

  return {
    id: `${DEMO_ID_PREFIX}participation_${participatedAt.getTime()}`,
    electionId: DEMO_ELECTION_ID,
    electionTitle: buildMockElection().title,
    status: 'VOTO_REGISTRADO',
    statusLabel: 'VOTO REGISTRADO',
    date: participatedAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
    time: participatedAt.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fullDate: participatedAt.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    organization: DEMO_ELECTION_ORGANIZATION,
    transactionId: `${DEMO_ID_PREFIX}tx_${participatedAt.getTime()}`,
    blockchainHash: `${DEMO_ID_PREFIX}tx_${participatedAt.getTime()}`,
    candidateSelected: candidate
      ? {
          partyName: candidate.partyName,
          presidentName: candidate.presidentName,
          viceName: candidate.viceName || '',
          ticketEntries: candidate.ticketEntries || [],
        }
      : null,
    errorMessage: null,
    nftId: null,
    nftImageUrl: null,
    participatedAt: participatedAt.toISOString(),
    selectedCandidateId: candidateId,
    synced: true,
  };
};

/**
 * Registra el voto. Compartido por `submitVote` y `registerParticipation`.
 */
const recordParticipation = async (electionId, candidateId) => {
  const current = await loadState();

  if (electionId !== DEMO_ELECTION_ID) {
    return {success: false, error: 'Evento no disponible'};
  }

  const existing = findActiveParticipation(current);
  if (existing) {
    return {
      success: false,
      error: 'Ya participaste en este evento',
      alreadyVoted: true,
      participationId: existing.id,
      participatedAt: existing.participatedAt,
    };
  }

  const candidate = resolveCandidate(candidateId);
  if (!candidate) {
    return {success: false, error: 'Opción no encontrada'};
  }

  const participation = buildParticipationRecord(candidateId, candidate);
  current.participations = [participation, ...current.participations];
  await persistState();

  return {
    success: true,
    participationId: participation.id,
    participatedAt: participation.participatedAt,
    transactionId: participation.transactionId,
    alreadyVoted: false,
    status: 'VOTO_REGISTRADO',
  };
};

const ElectionRepositoryMock = {
  async getElections() {
    await delay(300);
    const current = await loadState();
    const participation = findActiveParticipation(current);

    return [
      buildMockElection(
        participation
          ? {
              alreadyVoted: true,
              canVote: false,
              participationCode: 'ALREADY_VOTED',
              statusMessage: 'Ya registraste tu participación',
              participationId: participation.id,
              participatedAt: participation.participatedAt,
            }
          : {},
      ),
    ];
  },

  async getElection() {
    const elections = await this.getElections();
    return elections.find(item => item.status === 'ACTIVA') || elections[0] || null;
  },

  async getCandidates(electionId) {
    await delay(400);
    if (electionId && electionId !== DEMO_ELECTION_ID) {
      return [];
    }
    return [...MOCK_CANDIDATES];
  },

  async getParticipations() {
    await delay(300);
    const current = await loadState();
    return [...current.participations].sort((a, b) =>
      String(b.participatedAt).localeCompare(String(a.participatedAt)),
    );
  },

  async getWitnessRecords() {
    // Sin atestiguamientos: ParticipationsListScreen solo dibuja el bloque de
    // imagen cuando `nftImageUrl` resuelve, así que un registro inventado
    // aparecería como una tarjeta vacía.
    await delay(200);
    return [];
  },

  async submitVote(electionId, candidateId, _presentialSessionId) {
    await delay(800);
    return recordParticipation(electionId, candidateId);
  },

  /** En el repositorio real esto solo toca el backend, nunca la cadena. */
  async registerParticipation(electionId, candidateId, _presentialSessionId) {
    await delay(300);
    return recordParticipation(electionId, candidateId);
  },

  async verifyVoteQrCode(qrData) {
    await delay(300);
    if (!qrData) {
      throw new Error('No se pudo validar el código QR.');
    }
    return `${DEMO_ID_PREFIX}presential_session`;
  },

  /** Devuelve el repositorio a su estado inicial (salida del modo demo). */
  async reset() {
    state = buildInitialState();
    try {
      await AsyncStorage.removeItem(STATE_STORAGE_KEY);
    } catch (_) {
      // ignorar
    }
    state = null;
  },
};

export default ElectionRepositoryMock;
