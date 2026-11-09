/* eslint-disable import/namespace */
import React from 'react';
import {Alert} from 'react-native';
import {fireEvent, waitFor} from '@testing-library/react-native';
import * as ExpoCamera from 'expo-camera';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser4 from '../../../../src/container/Auth/RegisterUser4';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import Strings from '../../../../src/i18n/String';
import {
  IdentityApiUnreachableError,
  RegistryRecoveryError,
} from '@privado-id/expo-sdk';
import {getPrivadoClient} from '../../../../src/services/privado/privadoSession';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

const mockClient = {
  downloadRegistryBackup: jest.fn(),
};

// Estas pruebas cubren el flujo de foto simple; la prueba de vida tiene las suyas
// en RegisterUser4.liveness.test.js.
jest.mock('../../../../src/config/featureFlags', () => ({
  ...jest.requireActual('../../../../src/config/featureFlags'),
  isFeatureEnabled: flag =>
    flag === 'ENABLE_FACE_LIVENESS'
      ? false
      : jest.requireActual('../../../../src/config/featureFlags').isFeatureEnabled(flag),
}));

describe('RegisterUser4', () => {
  const originalDev = global.__DEV__;

  beforeAll(() => {
    global.__DEV__ = false;
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
  });

  beforeEach(() => {
    configurarMocksRegistro();
    mockClient.downloadRegistryBackup.mockReset();
    mockClient.downloadRegistryBackup.mockResolvedValue({
      discoverableHash: '0xhash',
      storedAt: '2026-11-06T00:00:00.000Z',
      isPrivadoBackup: true,
    });
    getPrivadoClient.mockResolvedValue(mockClient);
  });

  const takeSelfieFromCameraModal = async getByTestId => {
    fireEvent(getByTestId('mockCamera'), 'onCameraReady');
    fireEvent.press(getByTestId('selfieCameraModal_captureButton'));

    await waitFor(() => {
      expect(getByTestId('registerUser4SelfieImage')).toBeTruthy();
    });
  };

  it('navega a RegisterUser5 despues de capturar selfie', async () => {
    ExpoCamera.__takePictureAsyncMock.mockResolvedValueOnce({
      uri: 'file://selfie.jpg',
      width: 1200,
      height: 900,
    });

    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {
      params: {
        dni: '00000000',
        frontImage: {uri: 'file://front.jpg'},
        backImage: {uri: 'file://back.jpg'},
      },
    };

    const {getByTestId} = renderWithProviders(
      <RegisterUser4 navigation={localNavigation} route={route} />,
    );

    await takeSelfieFromCameraModal(getByTestId);

    fireEvent.press(getByTestId('registerUser4NextButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(
      AuthNav.RegisterUser5,
      expect.objectContaining({
        dni: '00000000',
        frontImage: route.params.frontImage,
        backImage: route.params.backImage,
        selfie: expect.objectContaining({uri: 'file://selfie.jpg'}),
      }),
    );
  });

  it('muestra alerta si se intenta continuar sin selfie', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {
      params: {
        dni: '00000000',
        frontImage: {uri: 'file://front.jpg'},
        backImage: {uri: 'file://back.jpg'},
      },
    };

    const {getByTestId} = renderWithProviders(
      <RegisterUser4 navigation={localNavigation} route={route} />,
    );

    await waitFor(() => expect(getByTestId('registerUser4LoadingText')).toBeTruthy());
    fireEvent.press(getByTestId('registerUser4NextButton'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Foto requerida',
      'Debes tomar una foto para continuar.',
    );
    expect(localNavigation.navigate).not.toHaveBeenCalledWith(
      AuthNav.RegisterUser5,
      expect.anything(),
    );

    alertSpy.mockRestore();
  });

  it('en modo recovery exitoso guarda datos y redirige a LoginUser CI', async () => {
    ExpoCamera.__takePictureAsyncMock.mockResolvedValueOnce({
      uri: 'file://selfie.jpg',
      width: 1200,
      height: 900,
    });

    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      reset: jest.fn(),
    };
    const route = {
      params: {
        dni: '00000000',
        frontImage: {uri: 'file://front.jpg'},
        backImage: {uri: 'file://back.jpg'},
        isRecovery: true,
      },
    };

    const {getByTestId} = renderWithProviders(
      <RegisterUser4 navigation={localNavigation} route={route} />,
    );

    await takeSelfieFromCameraModal(getByTestId);
    fireEvent.press(getByTestId('registerUser4NextButton'));

    await waitFor(() => {
      expect(mockClient.downloadRegistryBackup).toHaveBeenCalledTimes(1);
    });
    // resizeImage está mockeado: aquí solo importan el DNI y la falta de prueba de vida.
    expect(mockClient.downloadRegistryBackup).toHaveBeenCalledWith(
      expect.objectContaining({dni: '00000000', livenessResult: undefined}),
    );
    await waitFor(() => {
      expect(getByTestId('loadingModalCloseButton')).toBeTruthy();
    });

    fireEvent.press(getByTestId('loadingModalCloseButton'));

    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: AuthNav.LoginUser,
          params: {
            isCIRecovery: true,
            dni: '00000000',
          },
        },
      ],
    });
  });

  it('si falla recovery permite volver a RegisterUser1 con "Revisar datos"', async () => {
    ExpoCamera.__takePictureAsyncMock.mockResolvedValueOnce({
      uri: 'file://selfie.jpg',
      width: 1200,
      height: 900,
    });
    mockClient.downloadRegistryBackup.mockRejectedValueOnce(
      new Error('Recovery failed'),
    );
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      reset: jest.fn(),
    };
    const route = {
      params: {
        dni: '00000000',
        frontImage: {uri: 'file://front.jpg'},
        backImage: {uri: 'file://back.jpg'},
        isRecovery: true,
      },
    };

    const {getByTestId} = renderWithProviders(
      <RegisterUser4 navigation={localNavigation} route={route} />,
    );

    await takeSelfieFromCameraModal(getByTestId);
    fireEvent.press(getByTestId('registerUser4NextButton'));

    await waitFor(() => {
      expect(getByTestId('loadingModalSecondButton')).toBeTruthy();
    });
    fireEvent.press(getByTestId('loadingModalSecondButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser1, {
      isRecovery: true,
    });

    consoleErrorSpy.mockRestore();
  });

  it('si falla recovery y se presiona reintentar vuelve a ejecutar la recuperación', async () => {
    ExpoCamera.__takePictureAsyncMock.mockResolvedValue({
      uri: 'file://selfie.jpg',
      width: 1200,
      height: 900,
    });
    mockClient.downloadRegistryBackup.mockRejectedValueOnce(
      new Error('Recovery failed'),
    );
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      reset: jest.fn(),
    };
    const route = {
      params: {
        dni: '00000000',
        frontImage: {uri: 'file://front.jpg'},
        backImage: {uri: 'file://back.jpg'},
        isRecovery: true,
      },
    };

    const {getByTestId} = renderWithProviders(
      <RegisterUser4 navigation={localNavigation} route={route} />,
    );

    await takeSelfieFromCameraModal(getByTestId);
    fireEvent.press(getByTestId('registerUser4NextButton'));

    await waitFor(() => {
      expect(getByTestId('loadingModalCloseButton')).toBeTruthy();
    });
    fireEvent.press(getByTestId('loadingModalCloseButton'));

    await waitFor(() => {
      expect(mockClient.downloadRegistryBackup).toHaveBeenCalledTimes(2);
    });

    consoleErrorSpy.mockRestore();
  });

  const recoverWithError = async error => {
    ExpoCamera.__takePictureAsyncMock.mockResolvedValueOnce({
      uri: 'file://selfie.jpg',
      width: 1200,
      height: 900,
    });
    mockClient.downloadRegistryBackup.mockRejectedValueOnce(error);
    const route = {
      params: {
        dni: '00000000',
        frontImage: {uri: 'file://front.jpg'},
        backImage: {uri: 'file://back.jpg'},
        isRecovery: true,
      },
    };
    const screen = renderWithProviders(
      <RegisterUser4 navigation={{...mockNavigation, navigate: jest.fn()}} route={route} />,
    );
    await takeSelfieFromCameraModal(screen.getByTestId);
    fireEvent.press(screen.getByTestId('registerUser4NextButton'));
    await waitFor(() => {
      expect(screen.getByTestId('loadingModalSecondButton')).toBeTruthy();
    });
    return screen;
  };

  it.each([
    ['front-back-order', () => Strings.frontBackOrderError],
    ['face-mismatch', () => Strings.faceMatchFailedError],
    ['missing-data', () => Strings.missingDataError],
    ['unavailable', () => Strings.analysisUnavailableError],
  ])('muestra el mensaje del analysisCode %s', async (analysisCode, message) => {
    const {getByText} = await recoverWithError(
      new RegistryRecoveryError('ci-analysis-failed', analysisCode, 'detalle'),
    );
    expect(getByText(message())).toBeTruthy();
  });

  it('muestra el error generico cuando el DNI no tiene cuenta', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const {getByText} = await recoverWithError(new RegistryRecoveryError('not-found'));
    expect(getByText(Strings.recoveryError)).toBeTruthy();
    consoleErrorSpy.mockRestore();
  });

  it('muestra el error de red cuando backend-identity no responde', async () => {
    const {getByText} = await recoverWithError(
      new IdentityApiUnreachableError('registry/recovery-ci', new Error('Network request failed')),
    );
    expect(getByText(Strings.networkError)).toBeTruthy();
  });
});
