/**
 * Fixtures del flujo de votación.
 *
 * Se usan en dos escenarios:
 *  - modo demostración (cuenta de revisión de App Store)
 *  - desarrollo local con ENABLE_VOTING_FLOW = false
 *
 * Los nombres de campo replican la salida de `buildElectionModel` y
 * `mapOptionToCandidate` de ElectionRepository.api.js, para que ninguna
 * pantalla note la diferencia entre este repositorio y el real.
 */

import {DEMO_ID_PREFIX} from '../../demo/demoConfig';

export const DEMO_ELECTION_ID = `${DEMO_ID_PREFIX}election_active`;
const DEMO_PAST_ELECTION_ID = `${DEMO_ID_PREFIX}election_past`;
export const DEMO_ELECTION_ORGANIZATION = 'Tu Voto Decide';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const DEMO_ELECTION_TITLE = 'Elecciones Universitarias';
const DEMO_ELECTION_INSTITUTE = 'Carrera de Informática';

/**
 * La elección demo debe estar SIEMPRE abierta, sin importar la fecha en que
 * Apple revise la app: las marcas de tiempo se calculan en cada llamada.
 */
export const buildMockElection = (overrides = {}) => {
  const now = Date.now();

  return {
    id: DEMO_ELECTION_ID,
    title: DEMO_ELECTION_TITLE,
    questionTitle: DEMO_ELECTION_INSTITUTE,
    objective: DEMO_ELECTION_INSTITUTE,
    phase: 'ACTIVE',
    state: 'PUBLISHED',
    status: 'ACTIVA',
    closesInLabel: 'Cierra pronto',
    instituteName: DEMO_ELECTION_INSTITUTE,
    organization: DEMO_ELECTION_ORGANIZATION,
    startsAt: now - DAY_MS,
    closesAt: now + 3 * DAY_MS,
    resultsAt: now + 4 * DAY_MS,
    resultsAvailable: false,
    isEligible: true,
    eligibilityStatus: 'ELIGIBLE',
    participationCode: 'CAN_VOTE',
    canVote: true,
    alreadyVoted: false,
    publicEligibilityEnabled: true,
    // Mantiene al revisor fuera del flujo presencial de cámara/QR.
    presentialKioskEnabled: false,
    isReferendum: false,
    statusMessage: '',
    participationId: undefined,
    participatedAt: undefined,
    ...overrides,
  };
};

/** Compatibilidad con `ElectionCard`, que lo usa como default prop. */
export const MOCK_ELECTION = buildMockElection();

/**
 * Sin "voto en blanco" ni "voto nulo": `CandidateScreen` ya añade una tarjeta
 * de voto en blanco por su cuenta (desde `params.js`), así que incluirlas aquí
 * las duplicaría en pantalla.
 */
export const MOCK_CANDIDATES = [
  {
    id: `${DEMO_ID_PREFIX}candidate_1`,
    partyName: 'Movimiento al Socialismo',
    presidentName: 'Juan Carlos Pérez',
    viceName: 'Roberto Gutiérrez',
    ticketEntries: [
      {roleName: 'Presidente', name: 'Juan Carlos Pérez'},
      {roleName: 'Vicepresidente', name: 'Roberto Gutiérrez'},
    ],
    avatarUrl: null,
    partyColor: '#2563EB',
    partyColors: ['#2563EB'],
  },
  {
    id: `${DEMO_ID_PREFIX}candidate_2`,
    partyName: 'Frente Para la Victoria',
    presidentName: 'Carlos Mamani',
    viceName: 'Jorge Quispe',
    ticketEntries: [
      {roleName: 'Presidente', name: 'Carlos Mamani'},
      {roleName: 'Vicepresidente', name: 'Jorge Quispe'},
    ],
    avatarUrl: null,
    partyColor: '#41A44D',
    partyColors: ['#41A44D'],
  },
  {
    id: `${DEMO_ID_PREFIX}candidate_3`,
    partyName: 'Unidad Ciudadana',
    presidentName: 'María Elena Choque',
    viceName: 'Ana Lucía Vargas',
    ticketEntries: [
      {roleName: 'Presidente', name: 'María Elena Choque'},
      {roleName: 'Vicepresidente', name: 'Ana Lucía Vargas'},
    ],
    avatarUrl: null,
    partyColor: '#D97706',
    partyColors: ['#D97706'],
  },
];

/**
 * Una participación pasada, en una elección distinta, para que el historial no
 * aparezca vacío sin bloquear el voto en la elección activa.
 */
export const buildMockPastParticipation = () => {
  const participatedAt = new Date(Date.now() - 30 * DAY_MS);

  return {
    id: `${DEMO_ID_PREFIX}participation_past`,
    electionId: DEMO_PAST_ELECTION_ID,
    electionTitle: 'Elección de Centro de Estudiantes',
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
    transactionId: `${DEMO_ID_PREFIX}tx_past`,
    blockchainHash: `${DEMO_ID_PREFIX}tx_past`,
    candidateSelected: null,
    errorMessage: null,
    nftId: null,
    nftImageUrl: null,
    participatedAt: participatedAt.toISOString(),
    selectedCandidateId: `${DEMO_ID_PREFIX}candidate_2`,
    synced: true,
  };
};

/**
 * Mensajes de UI
 */
export const UI_STRINGS = {
  electionTitle: 'Votación General',
  statusActive: 'ACTIVA',
  voteNow: 'Votar ahora',
  inProgress: 'En proceso...',
  viewDetails: 'Ver detalles',
  alreadyVoted: 'Ya participaste en esta votación',

  // Candidate screen
  candidateHeader: 'Papeleta',
  referendumHeader: 'Referéndum',
  chooseCandidate: 'Elige a un candidato',
  chooseOption: 'Selecciona una opción',
  selectCandidate: 'Selecciona un candidato',
  voteBlank: 'Votar en Blanco',
  votedBlank: 'Votaste en Blanco',
  blankVoteHeader: 'Sin apoyo a ninguna',
  blankVoteName: 'Voto en blanco',
  voteFor: 'VOTAR POR',
  voteForOption: 'VOTAR ESTA OPCIÓN',
  voteSecureNote: 'Tu voto será registrado de forma segura y anónima',
  president: 'Presidente:',
  vicePresident: 'Vicepresidente:',
  option: 'Opción',
  response: 'Respuesta',

  // Confirm modal
  confirmVoteTitle: '¿Confirmar voto por',
  confirmVoteBlank: '¿Confirmar voto en Blanco?',
  confirmReferendumVoteTitle: '¿Confirmar tu respuesta?',
  nftSubtext: 'Se generará un NFT de participación',
  confirmButton: 'Sí, confirmar mi voto',
  cancelButton: 'Cancelar',
  processing: 'Procesando...',
  cantVoteOfflineTitle: 'Sin conexión',
  cantVoteOfflineDesc: 'No se puede votar presencialmente sin conexión, revise su internet',
  cantVoteWithoutCameraTitle: 'Permiso de cámara requerido',
  cantVoteWithoutCameraDesc: 'Para votar presencialmente, se requiere acceso a la cámara para escanear el código QR en el recinto de votación.',
  badQrTitle: 'Código QR no reconocido',
  badQrDesc: 'El código QR escaneado no es válido para esta votación. Por favor, asegúrate de estar escaneando el código correcto proporcionado en el recinto de votación.',
  qrVoteErrorTitle: 'Error al procesar el voto',
  qrVoteErrorDesc: 'Ocurrió un error al procesar tu voto. Puedes intentar escaneando el código QR nuevamente.',

  // Offline modal
  offlineTitle: 'Voto Guardado en Dispositivo',
  offlineMessage: 'Se enviará al recuperar conexión. Tu NFT se generará entonces.',
  offlineButton: 'Entendido',

  // Receipt/Comprobante screen
  receiptHeader: 'Comprobante',
  voteRegisteredSuccess: 'Voto registrado exitosamente',
  selectionDetail: 'Detalle de mi selección',
  selectionDetailReferendum: 'Detalle de tu opción',
  dateTime: 'Fecha y hora',
  organization: 'Organización',
  transactionId: 'ID de transacción',
  blockchainHash: 'Hash blockchain',
  syncedWithBlockchain: 'Sincronizado con la blockchain',
  viewMyNft: 'Ver mi NFT',
  party: 'Partido',

  // Participations list
  participationsHeader: 'Mis participaciones',
  voteRegistered: 'VOTO REGISTRADO',
  inQueue: 'EN COLA',

  // Notification detail
  notificationHeader: 'Notificaciones',
  resultsAvailable: 'Resultados disponibles',
  preliminaryResults: 'Resultados preliminares',
  realTimeCount: 'Conteo en tiempo real',
  goToResultsPage: 'Ir a la página de resultados',

  // Mis participaciones (conditional rename)
  myParticipations: 'Mis participaciones',
  myWitnesses: 'Mis atestiguamientos', // original

  // Countdown
  startsIn: 'Inicia en',
  closesIn: 'Cierra en',

  // Special votes
  blancoVote: 'Voto en Blanco',
  nuloVote: 'Voto Nulo',

  // Error messages
  credentialNotFound: 'No se encontró la credencial de esta votación',
};
