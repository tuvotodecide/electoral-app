import './jestMocks';

import {
  renderPhotoConfirmation,
  resetMocks,
  pinataService,
  NetInfo,
  validateBallotLocally,
  flushPromises,
  act,
  axios,
  String,
} from './testUtils';
import {fireEvent} from '@testing-library/react-native';

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
  BACKEND_SECRET: 'test-secret',
  CHAIN: 'test-chain',
}));

describe('PhotoConfirmationScreen - Manejo de Errores', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMocks();
    NetInfo.fetch.mockResolvedValue({isConnected: true, isInternetReachable: true});
    validateBallotLocally.mockReturnValue({ok: true});
    pinataService.checkDuplicateBallot.mockResolvedValue({exists: false});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('muestra error genérico cuando la subida a IPFS falla', async () => {
    pinataService.uploadElectoralActComplete.mockRejectedValue(
      new Error('pinata down'),
    );

    const {getAllByText, getByTestId, getByText} = renderPhotoConfirmation();

    await runAutoVerification();

    await act(async () => {
      fireEvent.press(getAllByText(String.publishAndCertify).slice(-1)[0]);
      await flushPromises();
    });

    expect(getByTestId('infoModal')).toBeTruthy();
    expect(getByText(String.genericError)).toBeTruthy();
    expect(getByText('pinata down')).toBeTruthy();
  });

  test('propaga mensajes específicos cuando el backend responde con 404', async () => {
    pinataService.uploadElectoralActComplete.mockResolvedValue({
      success: true,
      data: {
        jsonUrl: 'https://ipfs/json',
        imageUrl: 'https://ipfs/image',
      },
    });

    axios.post.mockImplementation(async url => {
      if (url.endsWith('/validate-ballot-data')) {
        const error = new Error('Not found');
        error.response = {
          status: 404,
          data: {message: 'Acta no encontrada'},
        };
        throw error;
      }
      return {data: {}};
    });

    const {getAllByText, getByTestId, getByText} = renderPhotoConfirmation();

    await runAutoVerification();

    await act(async () => {
      fireEvent.press(getAllByText(String.publishAndCertify).slice(-1)[0]);
      await flushPromises();
    });

    expect(getByTestId('infoModal')).toBeTruthy();
    expect(getByText(String.genericError)).toBeTruthy();
    expect(
      getByText(`${String.validationError404} Acta no encontrada`),
    ).toBeTruthy();
  });
});

const runAutoVerification = async () => {
  await act(async () => {
    jest.runAllTimers();
  });
  await act(async () => {
    await flushPromises();
  });
};
