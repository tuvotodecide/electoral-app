import axios from 'axios';
import wira from 'wira-sdk';
import ElectionRepositoryApi from '../../../../src/features/voting/data/repositories/ElectionRepository.api';

jest.mock('axios');

const defaultWalletState = () => ({
  wallet: {
    payload: {
      dni: '12345678',
      did: 'did:test:123',
      privKey: 'priv-key-test',
      vc: {
        credentialSubject: {
          nationalIdNumber: '12345678',
        },
      },
    },
  },
});

jest.mock('../../../../src/redux/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
  },
}));

jest.mock('@/src/api/account', () => ({
  executeOperation: jest.fn(),
}));

jest.mock('@/src/api/vote', () => ({
  castVote: jest.fn(),
  getVoteInfo: jest.fn(() => Promise.resolve({registeredVoters: []}))
}));

jest.mock('@/src/data/credentials', () => ({
  getCredentialForVote: jest.fn(() => Promise.resolve({
    id: 'credential-1',
    info: {credentialSubject: {nullifier: '0x123'}}
  })),
  getNullifierForVote: jest.fn(),
}));

jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('api-key-test')),
  getVoteRequestForBackend: jest.fn(() =>
    Promise.resolve({
      body: {
        callbackUrl: 'https://callback.example/vote',
      },
    }),
  ),
}));

jest.mock('../../../../src/features/voting/offline/voteJournal', () => ({
  clearVoteJournal: jest.fn(() => Promise.resolve()),
  markVoteJournalChainConfirmed: jest.fn(() => Promise.resolve()),
}));

jest.mock('wira-sdk', () => ({
  authenticateWithVerifier: jest.fn(() => Promise.resolve()),
}));

const store = require('../../../../src/redux/store').default;
const {getCredentialForVote} = require('@/src/data/credentials');
const {getVoteRequestForBackend} = require('../../../../src/utils/offlineQueueHandler');
const {clearVoteJournal} = require('../../../../src/features/voting/offline/voteJournal');
const {markVoteJournalChainConfirmed} = require('../../../../src/features/voting/offline/voteJournal');
const Sentry = require('@sentry/react-native');

describe('ElectionRepository.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // No conservar respuestas `mockResolvedValueOnce` de un caso a otro.
    axios.get.mockReset();
    axios.post.mockReset();
    wira.authenticateWithVerifier.mockResolvedValue(undefined);
    store.getState.mockReturnValue(defaultWalletState());
  });

  it('VOT-ACC-P0-001 / VOT-ACC-P0-002 | mapea disponibilidad ACTIVE y bloquea estados no disponibles sin administrar padron', async () => {
    axios.get.mockImplementation(url => {
      if (String(url).includes('/voting/events/public/landing')) {
        return Promise.resolve({
          data: {
            active: [
              {
                id: 'event-1',
                name: 'Eleccion presencial',
                phase: 'ACTIVE',
                presentialKioskEnabled: true,
                publicEligibilityEnabled: true,
              },
            ],
            upcoming: [
              {
                id: 'event-2',
                name: 'Eleccion futura',
                phase: 'UPCOMING',
                publicEligibilityEnabled: true,
              },
            ],
            results: [
              {
                id: 'event-3',
                name: 'Eleccion cerrada',
                phase: 'RESULTS',
                publicEligibilityEnabled: true,
              },
            ],
          },
        });
      }

      if (String(url).includes('/eligibility/public')) {
        return Promise.resolve({
          data: {
            status: 'ELIGIBLE',
            referenceVersion: 'v1',
          },
        });
      }

      if (String(url).includes('/participations/status')) {
        if (String(url).includes('event-2')) {
          return Promise.resolve({
            data: {
              status: 'OUTSIDE_VOTING_WINDOW',
              canVote: false,
              alreadyVoted: false,
            },
          });
        }
        if (String(url).includes('event-3')) {
          return Promise.resolve({
            data: {
              status: 'ALREADY_VOTED',
              canVote: false,
              alreadyVoted: true,
            },
          });
        }
        return Promise.resolve({
          data: {
            status: 'CAN_VOTE',
            canVote: true,
            alreadyVoted: false,
          },
        });
      }

      if (String(url).includes('/public/detail')) {
        return Promise.resolve({data: {options: []}});
      }

      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    const elections = await ElectionRepositoryApi.getElections();

    expect(elections).toHaveLength(3);
    expect(elections[0]).toMatchObject({
      id: 'event-1',
      title: 'Eleccion presencial',
      phase: 'ACTIVE',
      status: 'ACTIVA',
      canVote: true,
      presentialKioskEnabled: true,
    });
    expect(elections[1]).toMatchObject({
      id: 'event-2',
      phase: 'UPCOMING',
      status: 'PROXIMA',
      canVote: false,
      statusMessage: 'Fuera del horario de votación',
    });
    expect(elections[2]).toMatchObject({
      id: 'event-3',
      phase: 'RESULTS',
      status: 'FINALIZADA',
      canVote: false,
      alreadyVoted: true,
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('VOT-BAL-P0-001 / VOT-BAL-P0-002 | mapea candidatos, imagenes y solo opciones publicas activas', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        options: [
          {
            id: 'option-1',
            name: 'Lista Azul',
            active: true,
            colors: ['#123456', ''],
            candidates: [
              {name: 'Ana Perez', roleName: 'Presidente', photoUrl: 'https://img.test/ana.png'},
              {name: 'Luis Rojas', roleName: 'Vicepresidente'},
              {name: '', roleName: 'Vocal'},
            ],
          },
          {
            id: 'option-2',
            name: 'Lista Inactiva',
            active: false,
            candidates: [{name: 'No Visible', roleName: 'Presidente'}],
          },
          {
            id: 'option-3',
            name: 'Lista Verde',
            active: true,
            color: '#00FF00',
            candidates: [{name: 'Marta Soto', roleName: 'Candidata'}],
          },
        ],
      },
    });

    const candidates = await ElectionRepositoryApi.getCandidates('event-1');

    expect(candidates).toEqual([
      {
        id: 'option-1',
        partyName: 'Lista Azul',
        presidentName: 'Ana Perez',
        viceName: 'Luis Rojas',
        ticketEntries: [
          {roleName: 'Presidente', name: 'Ana Perez'},
          {roleName: 'Vicepresidente', name: 'Luis Rojas'},
        ],
        avatarUrl: 'https://img.test/ana.png',
        partyColor: '#123456',
        partyColors: ['#123456'],
      },
      {
        id: 'option-3',
        partyName: 'Lista Verde',
        presidentName: 'Marta Soto',
        viceName: '',
        ticketEntries: [{roleName: 'Candidata', name: 'Marta Soto'}],
        avatarUrl: null,
        partyColor: '#00FF00',
        partyColors: ['#00FF00'],
      },
    ]);
  });

  it('VOT-BAL-P0-002 | preserva isReferendum y objective como questionTitle para la papeleta de consulta', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        isReferendum: true,
        objective: '¿Aprueba la nueva normativa institucional?',
        options: [
          {
            id: 'option-1',
            name: 'Sí',
            active: true,
            logoUrl: 'https://img.test/si.png',
            candidates: [],
          },
        ],
      },
    });

    const candidates = await ElectionRepositoryApi.getCandidates('event-ref-1');

    expect(candidates).toEqual([
      {
        id: 'option-1',
        partyName: 'Sí',
        presidentName: 'Sí',
        viceName: '',
        ticketEntries: [],
        avatarUrl: 'https://img.test/si.png',
        partyColor: '#2563EB',
        partyColors: ['#2563EB'],
        isReferendum: true,
        questionTitle: '¿Aprueba la nueva normativa institucional?',
        electionObjective: '¿Aprueba la nueva normativa institucional?',
      },
    ]);
  });

  it('VOT-BAL-P1-003 | propaga error de red sin exponer informacion privada del padron', async () => {
    axios.get.mockRejectedValueOnce(new Error('network unavailable'));

    await expect(ElectionRepositoryApi.getCandidates('event-error')).rejects.toThrow(
      'network unavailable',
    );
    expect(JSON.stringify(axios.get.mock.calls)).not.toContain('registeredVoters');
    expect(JSON.stringify(axios.get.mock.calls)).not.toContain('padron');
    expect(JSON.stringify(axios.get.mock.calls)).not.toContain('12345678');
  });

  it('KIO-SCN-P0-005 KIO-VAL-P0-004 KIO-AUT-P0-001 KIO-SEC-P0-001 | verifica QR presencial enviando token y carnet y devuelve presentialSessionId', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        presentialSessionId: 'session-1',
      },
    });

    await expect(ElectionRepositoryApi.verifyVoteQrCode('qr-token-1')).resolves.toBe(
      'session-1',
    );

    expect(axios.post).toHaveBeenCalledWith(
      'https://test-backend.com/api/v1/voting/presential-sessions/scan',
      {
        token: 'qr-token-1',
        carnet: '12345678',
      },
    );
  });

  it('KIO-SCN-P0-004 KIO-VAL-P0-001 KIO-VAL-P0-002 KIO-VAL-P0-003 KIO-VAL-P0-005 KIO-SEC-P0-003 | mapea errores de scan sin filtrar detalles internos del QR', async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          error: 'QR_EXPIRED',
          token: 'pqs.full-internal-token',
          presentialSessionId: 'internal-session',
        },
      },
    });

    await expect(ElectionRepositoryApi.verifyVoteQrCode('pqs.full-internal-token')).rejects.toThrow(
      'No se pudo validar el código QR.',
    );

    expect(axios.post).toHaveBeenCalledWith(
      'https://test-backend.com/api/v1/voting/presential-sessions/scan',
      {
        token: 'pqs.full-internal-token',
        carnet: '12345678',
      },
    );
  });

  it('VOT-PRE-P0-001 / VOT-PRE-P0-002 / VOT-PRE-P0-003 / VOT-PRE-P0-004 | prepara proof controlado, callback y opcion confirmada antes de participacion', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          status: 'CAN_VOTE',
          canVote: true,
          alreadyVoted: false,
        },
      })
      .mockResolvedValueOnce({
        data: {
          status: 'ALREADY_VOTED',
          canVote: false,
          alreadyVoted: true,
          participationId: 'participation-1',
          participatedAt: '2026-01-01T10:00:00.000Z',
        },
      });
    axios.post.mockResolvedValueOnce({
      data: {
        id: 'participation-1',
        participatedAt: '2026-01-01T10:00:00.000Z',
      },
    });

    const result = await ElectionRepositoryApi.submitVote(
      '123abc',
      'option-1',
      'session-1',
    );

    expect(result).toMatchObject({
      success: true,
      participationId: 'participation-1',
    });
    expect(getCredentialForVote).toHaveBeenCalledWith(
      '123abc',
      'did:test:123',
      'priv-key-test',
    );
    const verifierRequest = JSON.parse(wira.authenticateWithVerifier.mock.calls[0][0]);
    expect(verifierRequest.body.callbackUrl).toContain(
      'https://callback.example/vote?optionId=option-1',
    );
    expect(verifierRequest.body.callbackUrl).not.toContain('12345678');
    expect(verifierRequest.body.callbackUrl).not.toContain('priv-key-test');
    expect(verifierRequest.body.callbackUrl).not.toContain('credential-1');
    expect(wira.authenticateWithVerifier).toHaveBeenCalledWith(
      expect.any(String),
      'did:test:123',
      'priv-key-test',
      ['credential-1'],
    );
    expect(markVoteJournalChainConfirmed).toHaveBeenCalledWith('123abc');
    expect(axios.post).toHaveBeenCalledWith(
      'https://test-backend.com/api/v1/voting/events/123abc/participations',
      {
        carnet: '12345678',
        presentialSessionId: 'session-1',
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          'idempotency-key': 'vote:123abc:12345678:option-1',
        }),
      }),
    );
  });

  it('realiza la generación de la prueba ZK con did, privKey y credentialId, y arma el callbackUrl con el optionId provisto', async () => {
    store.getState.mockReturnValue({
      wallet: {
        payload: {
          dni: '87654321',
          did: 'did:test:custom-did',
          privKey: 'custom-priv-key',
          vc: {credentialSubject: {nationalIdNumber: '87654321'}},
        },
      },
    });
    getCredentialForVote.mockResolvedValueOnce({
      id: 'credential-custom-1',
      info: {credentialSubject: {nullifier: '0xabc'}},
    });
    axios.get
      .mockResolvedValueOnce({
        data: {
          status: 'CAN_VOTE',
          canVote: true,
          alreadyVoted: false,
        },
      })
      .mockResolvedValueOnce({
        data: {
          status: 'ALREADY_VOTED',
          canVote: false,
          alreadyVoted: true,
          participationId: 'participation-custom-1',
          participatedAt: '2026-01-01T10:00:00.000Z',
        },
      });
    axios.post.mockResolvedValueOnce({
      data: {
        id: 'participation-custom-1',
        participatedAt: '2026-01-01T10:00:00.000Z',
      },
    });

    await ElectionRepositoryApi.submitVote('event-custom', 'option-custom-1', null);

    expect(wira.authenticateWithVerifier).toHaveBeenCalledTimes(1);
    const [requestJson, did, privKey, credentialIds] =
      wira.authenticateWithVerifier.mock.calls[0];
    expect(did).toBe('did:test:custom-did');
    expect(privKey).toBe('custom-priv-key');
    expect(credentialIds).toEqual(['credential-custom-1']);

    const verifierRequest = JSON.parse(requestJson);
    expect(verifierRequest.body.callbackUrl).toBe(
      'https://callback.example/vote?optionId=option-custom-1',
    );
  });

  it('no manda presentialSessionId cuando la participacion no viene de QR', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'ALREADY_VOTED',
        canVote: false,
        alreadyVoted: true,
        participationId: 'participation-remote-1',
        participatedAt: '2026-01-01T10:00:00.000Z',
      },
    });
    axios.post.mockResolvedValueOnce({
      data: {
        id: 'participation-remote-1',
        participatedAt: '2026-01-01T10:00:00.000Z',
      },
    });

    const result = await ElectionRepositoryApi.registerParticipation(
      'event-remote',
      'option-remote',
    );

    expect(result.success).toBe(true);
    expect(wira.authenticateWithVerifier).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      'https://test-backend.com/api/v1/voting/events/event-remote/participations',
      {
        carnet: '12345678',
      },
      expect.any(Object),
    );
  });

  it('no registra participación cuando /vote falla', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'CAN_VOTE',
        canVote: true,
        alreadyVoted: false,
      },
    });
    wira.authenticateWithVerifier.mockRejectedValueOnce(new Error('vote failed'));

    const result = await ElectionRepositoryApi.submitVote(
      'abc123',
      'option-1',
      null,
    );

    expect(result).toMatchObject({
      success: false,
      error: 'No se pudo registrar el voto. Intenta nuevamente.',
    });
    expect(axios.post).not.toHaveBeenCalledWith(
      expect.stringContaining('/participations'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('si backend falla despues del voto on-chain, devuelve sync pendiente conservando presentialSessionId', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'CAN_VOTE',
        canVote: true,
        alreadyVoted: false,
      },
    });
    axios.post.mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          error: 'SERVICE_UNAVAILABLE',
          message: 'Servidor no disponible',
        },
      },
    });

    const result = await ElectionRepositoryApi.submitVote(
      'adc123',
      'option-1',
      'session-pending-1',
    );

    expect(result).toMatchObject({
      success: false,
      blockchainCommitted: true,
      shouldQueueBackendSync: true,
      presentialSessionId: 'session-pending-1',
    });
    expect(wira.authenticateWithVerifier).toHaveBeenCalledTimes(1);
  });

  describe('submitVote - validaciones y errores', () => {
    beforeEach(() => {
      // Aisla estos tests de mocks de axios.get sin consumir que puedan
      // quedar encolados por otros tests de este archivo.
      axios.get.mockReset();
    });

    it('devuelve error "No se encontró una elección válida" cuando no hay electionId', async () => {
      const result = await ElectionRepositoryApi.submitVote('', 'option-1', null);

      expect(result).toEqual({
        success: false,
        error: 'No se encontró una elección válida',
      });
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('devuelve error "No se encontró el carnet del usuario actual" cuando no hay dni en la wallet', async () => {
      store.getState.mockReturnValue({wallet: {payload: null}});

      const result = await ElectionRepositoryApi.submitVote('event-1', 'option-1', null);

      expect(result).toEqual({
        success: false,
        error: 'No se encontró el carnet del usuario actual',
      });
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('devuelve error "No se pudo registrar la participación" cuando el estado no tiene un mensaje especifico', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          status: 'ALGUN_ESTADO_NO_MAPEADO',
          canVote: false,
          alreadyVoted: false,
        },
      });

      const result = await ElectionRepositoryApi.submitVote('event-1', 'option-1', null);

      expect(result).toEqual({
        success: false,
        error: 'No se pudo registrar la participación',
      });
      expect(wira.authenticateWithVerifier).not.toHaveBeenCalled();
    });

    it('registra "No se pudo preparar la confirmación del voto" cuando falta el callbackUrl', async () => {
      axios.get.mockResolvedValueOnce({
        data: {status: 'CAN_VOTE', canVote: true, alreadyVoted: false},
      });
      getVoteRequestForBackend.mockResolvedValueOnce({body: {}});

      const result = await ElectionRepositoryApi.submitVote('event-1', 'option-1', null);

      expect(result).toEqual({
        success: false,
        error: 'No se pudo registrar el voto. Intenta nuevamente.',
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({message: 'No se pudo preparar la confirmación del voto'}),
      );
      expect(clearVoteJournal).toHaveBeenCalledWith('event-1');
      expect(wira.authenticateWithVerifier).not.toHaveBeenCalled();
    });

    it('registra "No se pudo validar tu acceso para emitir el voto" cuando no hay credencial', async () => {
      axios.get.mockResolvedValueOnce({
        data: {status: 'CAN_VOTE', canVote: true, alreadyVoted: false},
      });
      getCredentialForVote.mockResolvedValueOnce(null);

      const result = await ElectionRepositoryApi.submitVote('event-1', 'option-1', null);

      expect(result).toEqual({
        success: false,
        error: 'No se pudo registrar el voto. Intenta nuevamente.',
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({message: 'No se pudo validar tu acceso para emitir el voto'}),
      );
      expect(clearVoteJournal).toHaveBeenCalledWith('event-1');
      expect(wira.authenticateWithVerifier).not.toHaveBeenCalled();
    });

    it('devuelve "No se pudo registrar el voto. Intenta nuevamente." cuando falla la firma on-chain', async () => {
      axios.get.mockResolvedValueOnce({
        data: {status: 'CAN_VOTE', canVote: true, alreadyVoted: false},
      });
      wira.authenticateWithVerifier.mockRejectedValueOnce(new Error('vote failed'));

      const result = await ElectionRepositoryApi.submitVote('event-1', 'option-1', null);

      expect(result).toEqual({
        success: false,
        error: 'No se pudo registrar el voto. Intenta nuevamente.',
      });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({message: 'vote failed'}),
      );
      expect(clearVoteJournal).toHaveBeenCalledWith('event-1');
      expect(axios.post).not.toHaveBeenCalled();
    });
  });
});
