import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser5 from '../../../../src/container/Auth/RegisterUser5';
import Strings from '../../../../src/i18n/String';
import {
  IdentityApiUnreachableError,
  IdentityDocumentAnalysisError,
} from '@privado-id/expo-sdk';
import {getPrivadoClient} from '../../../../src/services/privado/privadoSession';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
}));

const DOCUMENT = {
  numeroDoc: '00000000',
  fullName: 'Ana Pérez',
  fechaNacimiento: '1990-01-02',
  fechaExpedicion: '2020-03-04',
  lugarExpedicion: 'La Paz',
  faceMatch: true,
};

const mockClient = {
  analyzeIdentityDocument: jest.fn(),
};

const baseParams = {
  dni: '00000000',
  frontImage: {uri: 'file://front.jpg'},
  backImage: {uri: 'file://back.jpg'},
  selfie: {uri: 'file://selfie.jpg'},
};

describe('RegisterUser5', () => {
  beforeEach(() => {
    configurarMocksRegistro();
    mockClient.analyzeIdentityDocument.mockReset();
    mockClient.analyzeIdentityDocument.mockResolvedValue({
      data: DOCUMENT,
      identityToken: 'header.claims.signature',
      identityTokenExpiresAt: '2026-11-06T12:10:00.000Z',
    });
    getPrivadoClient.mockResolvedValue(mockClient);
  });

  const renderScreen = (params = baseParams) => {
    const localNavigation = {...mockNavigation, replace: jest.fn(), reset: jest.fn()};
    const screen = renderWithProviders(
      <RegisterUser5 navigation={localNavigation} route={{params}} />,
    );
    return {...screen, localNavigation};
  };

  it('reemplaza la vista hacia RegisterUser6 con el identityToken cuando el analisis es exitoso', async () => {
    const {localNavigation} = renderScreen();

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RegisterUser6,
        expect.objectContaining({
          dni: '00000000',
          identityToken: 'header.claims.signature',
          identityTokenExpiresAt: '2026-11-06T12:10:00.000Z',
        }),
      );
    });
  });

  it('muestra modal de error y permite reintentar cuando falla el analisis', async () => {
    mockClient.analyzeIdentityDocument.mockRejectedValueOnce(
      new IdentityDocumentAnalysisError('ci-analysis-failed', 'front-back-order'),
    );

    const {getByTestId, getByText, localNavigation} = renderScreen();

    await waitFor(() => {
      expect(getByTestId('registerUser5ErrorModalButton')).toBeTruthy();
    });
    expect(getByText(Strings.frontBackOrderError)).toBeTruthy();

    fireEvent.press(getByTestId('registerUser5ErrorModalButton'));

    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        {
          name: AuthNav.RegisterUser2,
          params: {
            dni: '00000000',
            frontImage: baseParams.frontImage,
            backImage: baseParams.backImage,
          },
        },
      ],
    });
  });

  it.each([
    ['face-mismatch', () => Strings.faceMatchFailedError],
    ['missing-data', () => Strings.missingDataError],
    ['unavailable', () => Strings.analysisUnavailableError],
  ])('muestra el mensaje del analysisCode %s', async (analysisCode, message) => {
    mockClient.analyzeIdentityDocument.mockRejectedValueOnce(
      new IdentityDocumentAnalysisError('ci-analysis-failed', analysisCode),
    );
    const {getByText} = renderScreen();
    await waitFor(() => expect(getByText(message())).toBeTruthy());
  });

  it('muestra el error generico cuando la prueba de vida ya no es valida', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockClient.analyzeIdentityDocument.mockRejectedValueOnce(
      new IdentityDocumentAnalysisError('liveness-invalid'),
    );
    const {getByText} = renderScreen();
    await waitFor(() => expect(getByText(Strings.defaultVerificationError)).toBeTruthy());
    consoleErrorSpy.mockRestore();
  });

  it('muestra el error de red cuando backend-identity no responde', async () => {
    mockClient.analyzeIdentityDocument.mockRejectedValueOnce(
      new IdentityApiUnreachableError('registry/analyze', new Error('Network request failed')),
    );
    const {getByText} = renderScreen();
    await waitFor(() => expect(getByText(Strings.networkError)).toBeTruthy());
  });

  it('no avanza si el numero del carnet no coincide con el DNI ingresado', async () => {
    mockClient.analyzeIdentityDocument.mockResolvedValueOnce({
      data: {...DOCUMENT, numeroDoc: '99999999'},
      identityToken: 'header.claims.signature',
    });
    const {getByTestId, localNavigation} = renderScreen();
    await waitFor(() => {
      expect(getByTestId('registerUser5ErrorModalButton')).toBeTruthy();
    });
    expect(localNavigation.replace).not.toHaveBeenCalled();
  });

  it('LIV-47 - Exigencia de la prueba de vida en /registry/analyze · envía la selfie verificada y el resultado firmado', async () => {
    renderScreen({
      ...baseParams,
      selfie: {base64: 'SELFIE_VERIFICADA'},
      livenessResult: 'JWT_FIRMADO',
    });

    await waitFor(() => {
      expect(mockClient.analyzeIdentityDocument).toHaveBeenCalled();
    });
    const [input] = mockClient.analyzeIdentityDocument.mock.calls[0];
    expect(input.selfieImage).toBe('SELFIE_VERIFICADA');
    expect(input.livenessResult).toBe('JWT_FIRMADO');
  });

  it('LIV-47 - Exigencia de la prueba de vida en /registry/analyze · sin prueba de vida no envía resultado firmado', async () => {
    renderScreen();

    await waitFor(() => {
      expect(mockClient.analyzeIdentityDocument).toHaveBeenCalled();
    });
    expect(mockClient.analyzeIdentityDocument.mock.calls[0][0].livenessResult).toBeUndefined();
  });
});
