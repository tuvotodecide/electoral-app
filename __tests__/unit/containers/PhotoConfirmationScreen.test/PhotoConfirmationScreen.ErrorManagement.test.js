import './jestMocks';

import {fireEvent} from '@testing-library/react-native';
import {
  renderPhotoConfirmation,
  resetMocks,
  NetInfo,
  validateBallotLocally,
  flushPromises,
  act,
  enqueue,
} from './testUtils';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

describe('PhotoConfirmationScreen - Manejo de Errores', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
    NetInfo.fetch.mockResolvedValue({isConnected: false, isInternetReachable: false});
    validateBallotLocally.mockReturnValue({ok: true});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra error cuando falta la foto del acta en params', async () => {
    const {getByTestId, getByText} = renderPhotoConfirmation({
      params: {
        tableData: {
          tableNumber: '1234',
          codigo: 'C-1234',
          idRecinto: 'loc-001',
        },
        photoUri: '',
        partyResults: [{partido: 'unidad', presidente: '1', diputado: '1'}],
        voteSummaryResults: [{id: 'validos', value1: '1', value2: '1'}],
      },
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
      await flushPromises();
    });

    expect(getByTestId('photoConfirmationInfoModal')).toBeTruthy();
    expect(getByText('No se encontró la foto del acta. Vuelve a capturarla.')).toBeTruthy();
  });

  test('muestra error específico cuando falla la cola offline', async () => {
    enqueue.mockRejectedValue(new Error('queue down'));

    const {getByTestId, getByText} = renderPhotoConfirmation();

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationPublishButton'));
      await flushPromises();
    });

    await act(async () => {
      fireEvent.press(getByTestId('photoConfirmationModalConfirmButton'));
      await flushPromises();
    });

    expect(getByTestId('photoConfirmationInfoModal')).toBeTruthy();
    expect(getByText('queue down')).toBeTruthy();
  });
});
