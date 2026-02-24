import './jestMocks';

import {fireEvent} from '@testing-library/react-native';
import {
  act,
  buildRouteParams,
  flushPromises,
  NetInfo,
  renderPhotoConfirmation,
  resetMocks,
  validateBallotLocally,
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
    NetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra InfoModal cuando la validacion local falla al presionar Siguiente', async () => {
    validateBallotLocally.mockReturnValue({
      ok: false,
      errors: ['Totales inconsistentes', 'Faltan datos'],
    });

    const {getByTestId} = renderPhotoConfirmation();

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    expect(getByTestId('photoConfirmationInfoModal')).toBeTruthy();
    const infoModalMessage = getByTestId('photoConfirmationInfoModalMessage');
    const messageText = Array.isArray(infoModalMessage.props.children)
      ? infoModalMessage.props.children.join(' ')
      : String(infoModalMessage.props.children);
    expect(messageText).toContain('Totales inconsistentes');
    expect(messageText).toContain('Faltan datos');
  });

  test('abre el modal de confirmacion cuando la validacion local es correcta', async () => {
    validateBallotLocally.mockReturnValue({ok: true});

    const {getByTestId} = renderPhotoConfirmation();

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    expect(getByTestId('photoConfirmationModalBody')).toBeTruthy();
    expect(getByTestId('photoConfirmationModalConfirmButton')).toBeTruthy();
  });

  test('muestra InfoModal cuando hay observacion marcada sin texto', async () => {
    validateBallotLocally.mockReturnValue({ok: true});
    const params = buildRouteParams();
    params.mode = 'upload';
    params.hasObservation = true;
    params.observationText = '   ';

    const {getByTestId} = renderPhotoConfirmation({params});

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    expect(getByTestId('photoConfirmationInfoModal')).toBeTruthy();
    const infoModalMessage = getByTestId('photoConfirmationInfoModalMessage');
    const messageText = Array.isArray(infoModalMessage.props.children)
      ? infoModalMessage.props.children.join(' ')
      : String(infoModalMessage.props.children);
    expect(messageText).toContain('observacion del acta');
  });

  test('al confirmar encola el acta y muestra finalizacion del proceso', async () => {
    validateBallotLocally.mockReturnValue({ok: true});

    const {getByTestId} = renderPhotoConfirmation();

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
      await flushPromises();
    });

    expect(getByTestId('photoConfirmationModalFinishedSubtext')).toBeTruthy();
  });
});
