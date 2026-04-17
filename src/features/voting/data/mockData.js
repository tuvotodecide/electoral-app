/**
 * Mock data del flujo de votación
 */

export const MOCK_ELECTION = {
  id: 'election_voting_1',
  title: 'Votación General',
  status: 'ACTIVA',
  closesInLabel: 'Cierra en 2h',
  instituteName: 'Recinto Principal',
  organization: 'Tu Voto Decide',
  // Timestamp de cierre para countdown (2 horas desde ahora para demo)
  closesAt: Date.now() + 2 * 60 * 60 * 1000,
  // Timestamp de inicio (para "Inicia en X") - null = ya empezó
  startsAt: null,
};

export const MOCK_CANDIDATES = [
  {
    id: 'candidate_1',
    partyName: 'Movimiento al Socialismo',
    presidentName: 'Juan Carlos Pérez',
    viceName: 'Roberto Gutiérrez',
    avatarUrl: null,
    partyColor: '#2563EB', // azul
  },
  {
    id: 'candidate_2',
    partyName: 'Frente Para la Victoria',
    presidentName: 'Carlos Mamani',
    viceName: 'Jorge Quispe',
    avatarUrl: null,
    partyColor: '#41A44D', // verde
  },
  {
    id: 'candidate_blanco',
    partyName: 'Voto en Blanco',
    presidentName: 'Voto en Blanco',
    viceName: '',
    avatarUrl: null,
    partyColor: '#9CA3AF', // gris
    isSpecial: true,
    specialType: 'blanco',
  },
  {
    id: 'candidate_nulo',
    partyName: 'Voto Nulo',
    presidentName: 'Voto Nulo',
    viceName: '',
    avatarUrl: null,
    partyColor: '#EF4444', // rojo
    isSpecial: true,
    specialType: 'nulo',
  },
];

/**
 * Mock de participaciones del usuario
 */
export const MOCK_PARTICIPATIONS = [
  {
    id: 'participation_1',
    electionTitle: 'Votación general',
    status: 'VOTO_REGISTRADO',
    statusLabel: 'VOTO REGISTRADO',
    date: '12 Feb',
    time: '09:12',
    fullDate: '12 Feb 2026 · 09:12',
    organization: 'UMSA',
    transactionId: '0x7a8f...3d2e',
    blockchainHash: 'b4c9...8f1a',
    candidateSelected: {
      partyName: 'Informatica por siempre',
      presidentName: 'Juan Perez',
      viceName: 'Ana Gomez',
    },
    nftId: 'nft_12345',
  },
  {
    id: 'participation_2',
    electionTitle: 'Elección Municipal',
    status: 'EN_COLA',
    statusLabel: 'EN COLA',
    date: '11 Feb',
    time: '16:23',
    fullDate: '11 Feb 2026 · 16:23',
    organization: 'Municipio',
    transactionId: null,
    blockchainHash: null,
    candidateSelected: null,
    nftId: null,
  },
];

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
  chooseCandidate: 'Elige a un candidato',
  selectCandidate: 'Selecciona un candidato',
  voteBlank: 'Votar en Blanco',
  votedBlank: 'Votaste en Blanco',
  voteFor: 'VOTAR POR',
  voteSecureNote: 'Tu voto será registrado de forma segura y anónima',
  president: 'Presidente:',
  vicePresident: 'Vicepresidente:',

  // Confirm modal
  confirmVoteTitle: '¿Confirmar voto por',
  confirmVoteBlank: '¿Confirmar voto en Blanco?',
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
};
