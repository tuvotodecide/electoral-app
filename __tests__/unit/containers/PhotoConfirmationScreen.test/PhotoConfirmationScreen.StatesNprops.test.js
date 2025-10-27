import './jestMocks';

import {
  renderPhotoConfirmation,
  resetMocks,
  pinataService,
  validateBallotLocally,
  flushPromises,
  String,
  act,
  NetInfo,
} from './testUtils';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

describe('PhotoConfirmationScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
    NetInfo.fetch.mockResolvedValue({isConnected: true, isInternetReachable: true});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra el InfoModal cuando la validación local encuentra errores', async () => {
    validateBallotLocally.mockReturnValue({
      ok: false,
      errors: ['Totales inconsistentes', 'Faltan datos'],
    });

    const {getByTestId} = renderPhotoConfirmation();

    await flushAsyncTasks();

    expect(getByTestId('photoConfirmationInfoModal')).toBeTruthy();
    const infoModalMessage = getByTestId('photoConfirmationInfoModalMessage');
    const messageText = Array.isArray(infoModalMessage.props.children)
      ? infoModalMessage.props.children.join(' ')
      : String(infoModalMessage.props.children);
    expect(messageText).toContain('Totales inconsistentes');
    expect(messageText).toContain('Faltan datos');
  });

  test('presenta el modal de duplicado cuando el backend lo detecta', async () => {
    validateBallotLocally.mockReturnValue({ok: true});
    pinataService.checkDuplicateBallot.mockResolvedValue({
      exists: true,
      ballot: {id: 'ballot-1'},
    });

    const {getByText} = renderPhotoConfirmation();

    await flushAsyncTasks();

    expect(getByText(String.duplicateBallotTitle)).toBeTruthy();
    expect(getByText(String.duplicateBallotMessage)).toBeTruthy();
  });

  test('abre el modal de confirmación cuando no existen duplicados', async () => {
    validateBallotLocally.mockReturnValue({ok: true});
    pinataService.checkDuplicateBallot.mockResolvedValue({exists: false});

  const {getAllByText, getByText} = renderPhotoConfirmation();

    await flushAsyncTasks();

  const nameMatches = getAllByText(/Test User/);
  expect(nameMatches.length).toBeGreaterThan(0);
    expect(
      getByText(
        /Certifico que los datos que ingreso coinciden con la foto del acta de la mesa/,
      ),
    ).toBeTruthy();
  });
});

const flushAsyncTasks = async () => {
  await actAsync(async () => {
    jest.runAllTimers();
  });
  await actAsync(async () => {
    await flushPromises();
  });
};

const actAsync = async callback => {
  await act(async () => {
    await callback();
  });
};
