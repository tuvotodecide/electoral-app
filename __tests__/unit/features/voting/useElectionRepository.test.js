import {FEATURE_FLAGS} from '../../../../src/config/featureFlags';
import ElectionRepositoryApi from '../../../../src/features/voting/data/repositories/ElectionRepository.api';
import ElectionRepositoryMock from '../../../../src/features/voting/data/repositories/ElectionRepository.mock';
import {getElectionRepository} from '../../../../src/features/voting/data/useElectionRepository';
import {
  __resetDemoSessionForTests,
  startDemoSession,
} from '../../../../src/features/demo/demoSession';

describe('useElectionRepository', () => {
  const flagOriginal = FEATURE_FLAGS.ENABLE_VOTING_FLOW;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetDemoSessionForTests();
    FEATURE_FLAGS.ENABLE_VOTING_FLOW = flagOriginal;
  });

  afterAll(() => {
    FEATURE_FLAGS.ENABLE_VOTING_FLOW = flagOriginal;
  });

  it('usa el repositorio API cuando el flujo está activo y no hay demo', () => {
    FEATURE_FLAGS.ENABLE_VOTING_FLOW = true;

    expect(getElectionRepository()).toBe(ElectionRepositoryApi);
  });

  it('usa el mock cuando el flujo de votación está apagado', () => {
    FEATURE_FLAGS.ENABLE_VOTING_FLOW = false;

    expect(getElectionRepository()).toBe(ElectionRepositoryMock);
  });

  it('el modo demostración gana sobre ENABLE_VOTING_FLOW', async () => {
    // Importante: la demo NO debe apagar el flag, porque queueAdapter lanza
    // 'Voting flow is disabled' en ese caso.
    FEATURE_FLAGS.ENABLE_VOTING_FLOW = true;
    await startDemoSession();

    expect(getElectionRepository()).toBe(ElectionRepositoryMock);
    expect(FEATURE_FLAGS.ENABLE_VOTING_FLOW).toBe(true);
  });

  it('refleja el cambio sin re-render, como lo consume queueAdapter', async () => {
    FEATURE_FLAGS.ENABLE_VOTING_FLOW = true;
    expect(getElectionRepository()).toBe(ElectionRepositoryApi);

    await startDemoSession();

    expect(getElectionRepository()).toBe(ElectionRepositoryMock);
  });
});
