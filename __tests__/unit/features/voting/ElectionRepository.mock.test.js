import AsyncStorage from '@react-native-async-storage/async-storage';

import ElectionRepositoryMock from '../../../../src/features/voting/data/repositories/ElectionRepository.mock';
import {
  DEMO_ELECTION_ID,
  MOCK_CANDIDATES,
} from '../../../../src/features/voting/data/mockData';
import {blankVote} from '../../../../src/features/voting/data/params';

describe('ElectionRepositoryMock', () => {
  // El repositorio simula latencia con setTimeout; aquí se resuelve al
  // instante para no dejar temporizadores vivos al terminar la suite.
  let setTimeoutOriginal;

  beforeAll(() => {
    setTimeoutOriginal = global.setTimeout;
    global.setTimeout = fn => {
      fn();
      return 0;
    };
  });

  afterAll(() => {
    global.setTimeout = setTimeoutOriginal;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    await ElectionRepositoryMock.reset();
  });

  describe('getElections', () => {
    it('devuelve una elección abierta y habilitada', async () => {
      const [eleccion] = await ElectionRepositoryMock.getElections();

      expect(eleccion.id).toBe(DEMO_ELECTION_ID);
      expect(eleccion.status).toBe('ACTIVA');
      expect(eleccion.isEligible).toBe(true);
      expect(eleccion.canVote).toBe(true);
      expect(eleccion.alreadyVoted).toBe(false);
      expect(eleccion.presentialKioskEnabled).toBe(false);
    });

    it('la ventana de votación siempre contiene el momento actual', async () => {
      const [eleccion] = await ElectionRepositoryMock.getElections();
      const ahora = Date.now();

      expect(eleccion.startsAt).toBeLessThan(ahora);
      expect(eleccion.closesAt).toBeGreaterThan(ahora);
    });
  });

  describe('getCandidates', () => {
    it('devuelve las opciones sin duplicar el voto en blanco', async () => {
      const candidatos = await ElectionRepositoryMock.getCandidates(
        DEMO_ELECTION_ID,
      );

      expect(candidatos).toHaveLength(MOCK_CANDIDATES.length);
      expect(candidatos.some(item => item.isSpecial)).toBe(false);
      expect(candidatos.some(item => item.id === blankVote.id)).toBe(false);
      candidatos.forEach(candidato => {
        expect(Array.isArray(candidato.partyColors)).toBe(true);
        expect(Array.isArray(candidato.ticketEntries)).toBe(true);
      });
    });

    it('devuelve vacío para una elección desconocida en vez de lanzar', async () => {
      await expect(
        ElectionRepositoryMock.getCandidates('otro_evento'),
      ).resolves.toEqual([]);
    });
  });

  describe('submitVote', () => {
    it('devuelve la forma que consume CandidateScreen', async () => {
      const resultado = await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        MOCK_CANDIDATES[0].id,
        null,
      );

      expect(resultado.success).toBe(true);
      expect(resultado.participationId).toEqual(expect.any(String));
      expect(resultado.participatedAt).toEqual(expect.any(String));
      expect(resultado.transactionId).toEqual(expect.any(String));
    });

    it('acepta el voto en blanco que añade CandidateScreen', async () => {
      const resultado = await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        blankVote.id,
        null,
      );

      expect(resultado.success).toBe(true);
    });

    it('tras votar la participación aparece en el historial', async () => {
      const resultado = await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        MOCK_CANDIDATES[0].id,
        null,
      );
      const participaciones = await ElectionRepositoryMock.getParticipations();

      expect(
        participaciones.some(item => item.id === resultado.participationId),
      ).toBe(true);
    });

    it('tras votar la elección reporta alreadyVoted', async () => {
      const resultado = await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        MOCK_CANDIDATES[0].id,
        null,
      );
      const [eleccion] = await ElectionRepositoryMock.getElections();

      expect(eleccion.alreadyVoted).toBe(true);
      expect(eleccion.canVote).toBe(false);
      expect(eleccion.participationId).toBe(resultado.participationId);
    });

    it('rechaza un segundo voto', async () => {
      await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        MOCK_CANDIDATES[0].id,
        null,
      );
      const segundo = await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        MOCK_CANDIDATES[1].id,
        null,
      );

      expect(segundo).toMatchObject({
        success: false,
        error: 'Ya participaste en este evento',
        alreadyVoted: true,
      });
    });

    it('rechaza una opción inexistente', async () => {
      const resultado = await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        'no_existe',
        null,
      );

      expect(resultado).toMatchObject({success: false});
    });
  });

  describe('getParticipations', () => {
    it('arranca con una participación pasada para que el historial no quede vacío', async () => {
      const participaciones = await ElectionRepositoryMock.getParticipations();

      expect(participaciones.length).toBeGreaterThan(0);
      // La participación previa es de OTRA elección: no bloquea el voto activo.
      expect(
        participaciones.every(item => item.electionId !== DEMO_ELECTION_ID),
      ).toBe(true);
    });
  });

  describe('getWitnessRecords', () => {
    it('devuelve vacío', async () => {
      await expect(ElectionRepositoryMock.getWitnessRecords()).resolves.toEqual(
        [],
      );
    });
  });

  describe('verifyVoteQrCode', () => {
    it('existe y devuelve un id de sesión presencial', async () => {
      await expect(
        ElectionRepositoryMock.verifyVoteQrCode('token'),
      ).resolves.toEqual(expect.any(String));
    });

    it('lanza sin datos de QR', async () => {
      await expect(ElectionRepositoryMock.verifyVoteQrCode('')).rejects.toThrow(
        'No se pudo validar el código QR.',
      );
    });
  });

  describe('reset', () => {
    it('descarta el voto emitido', async () => {
      await ElectionRepositoryMock.submitVote(
        DEMO_ELECTION_ID,
        MOCK_CANDIDATES[0].id,
        null,
      );

      await ElectionRepositoryMock.reset();
      AsyncStorage.getItem.mockResolvedValue(null);
      const [eleccion] = await ElectionRepositoryMock.getElections();

      expect(eleccion.alreadyVoted).toBe(false);
    });
  });
});
