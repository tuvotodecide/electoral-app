import axios from 'axios';
import wira from 'wira-sdk';
import ElectionRepositoryApi from '../../../../src/features/voting/data/repositories/ElectionRepository.api';

jest.mock('axios');

jest.mock('../../../../src/redux/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
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
    }),
  },
}));

jest.mock('@/src/api/account', () => ({
  executeOperation: jest.fn(),
}));

jest.mock('@/src/api/vote', () => ({
  castVote: jest.fn(),
}));

jest.mock('@/src/data/credentials', () => ({
  getCredentialForVote: jest.fn(() => Promise.resolve({id: 'credential-1'})),
  getNullifierForVote: jest.fn(),
  saveNullifierForVote: jest.fn(),
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

describe('ElectionRepository.api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mapea presentialKioskEnabled desde el evento publico de backend', async () => {
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

    expect(elections).toHaveLength(1);
    expect(elections[0]).toMatchObject({
      id: 'event-1',
      title: 'Eleccion presencial',
      presentialKioskEnabled: true,
    });
  });

  it('mapea candidatos desde opciones publicas activas con colores y roles', async () => {
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

  it('verifica QR presencial enviando token y carnet y devuelve presentialSessionId', async () => {
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

  it('incluye presentialSessionId en el payload final de participacion cuando corresponde', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'CAN_VOTE',
        canVote: true,
        alreadyVoted: false,
      },
    });
    axios.post.mockResolvedValueOnce({
      data: {
        id: 'participation-1',
        participatedAt: '2026-01-01T10:00:00.000Z',
      },
    });

    const result = await ElectionRepositoryApi.submitVote(
      'event-1',
      'option-1',
      'session-1',
    );

    expect(result).toMatchObject({
      success: true,
      participationId: 'participation-1',
    });
    const verifierRequest = JSON.parse(wira.authenticateWithVerifier.mock.calls[0][0]);
    expect(verifierRequest.body.callbackUrl).toBe(
      'https://callback.example/vote?optionId=option-1',
    );
    expect(axios.post).toHaveBeenCalledWith(
      'https://test-backend.com/api/v1/voting/events/event-1/participations',
      {
        carnet: '12345678',
        presentialSessionId: 'session-1',
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          'idempotency-key': 'vote:event-1:12345678:option-1',
        }),
      }),
    );
  });

  it('no manda presentialSessionId cuando la participacion no viene de QR', async () => {
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
    expect(axios.post).toHaveBeenCalledWith(
      'https://test-backend.com/api/v1/voting/events/event-remote/participations',
      {
        carnet: '12345678',
      },
      expect.any(Object),
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
      'event-1',
      'option-1',
      'session-pending-1',
    );

    expect(result).toMatchObject({
      success: false,
      blockchainCommitted: true,
      shouldQueueBackendSync: true,
      presentialSessionId: 'session-pending-1',
    });
  });
});
