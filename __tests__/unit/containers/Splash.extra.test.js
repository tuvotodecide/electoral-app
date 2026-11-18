import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  createMockSession,
  createPersistentPrivadoExpoClient,
} from '@privado-id/expo-sdk';
import Splash from '../../../src/container/Splash';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../src/utils/AsyncStorage', () => ({
  initialStorageValueGet: jest.fn(async () => null),
  getThemeColor: jest.fn(async () => null),
}));

jest.mock('../../../src/utils/RegisterDraft', () => ({
  getDraft: jest.fn(async () => null),
}));

const REQUIRED_CIRCUITS = [
  'AuthV2',
  'credentialAtomicQuerySigV2',
  'credentialAtomicQueryMTPV2',
];

describe('Splash', () => {
  let session;
  let prepare;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      headers: {get: () => String(50 * 1024 * 1024)},
    }));

    session = createMockSession();
    // Nada en caché: hay que descargar, y la descarga falla.
    session.circuits.registerCached.mockResolvedValue({
      descriptors: [],
      missing: ['Missing required circuit artifact: authV2.zkey'],
    });
    prepare = jest.fn(async () => {
      throw new Error('network down');
    });
    session.circuits.createDownloader.mockImplementation(() => ({prepare}));
    createPersistentPrivadoExpoClient.mockImplementation(async () => session);
  });

  it('pide los tres circuitos y muestra retry cuando falla la descarga', async () => {
    const {getByTestId} = render(
      <Splash navigation={{replace: mockReplace, navigate: mockNavigate}} />,
    );

    await waitFor(() =>
      expect(getByTestId('downloadSizeModalOkButton')).toBeTruthy(),
    );
    expect(session.circuits.registerCached).toHaveBeenCalledWith({
      requiredCircuits: REQUIRED_CIRCUITS,
    });

    await act(async () => {
      fireEvent.press(getByTestId('downloadSizeModalOkButton'));
    });

    await waitFor(() =>
      expect(getByTestId('retryDownloadButton')).toBeTruthy(),
    );
    expect(session.circuits.createDownloader).toHaveBeenCalledWith(
      expect.objectContaining({
        zipUrl: 'https://circuits.example',
        requiredCircuits: REQUIRED_CIRCUITS,
      }),
    );
    expect(session.client.init).toHaveBeenCalledTimes(1);

    // El reintento descarga de nuevo con la misma sesión.
    prepare.mockResolvedValueOnce({status: 'downloaded', descriptors: []});
    await act(async () => {
      fireEvent.press(getByTestId('retryDownloadButton'));
    });
    await waitFor(() =>
      expect(getByTestId('downloadSizeModalOkButton')).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(getByTestId('downloadSizeModalOkButton'));
    });
    await waitFor(() => expect(prepare).toHaveBeenCalledTimes(2));
    expect(createPersistentPrivadoExpoClient).toHaveBeenCalledTimes(1);
  });
});
