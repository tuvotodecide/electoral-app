import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser5 from '../../../../src/container/Auth/RegisterUser5';
import wira from 'wira-sdk';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

const baseParams = {
  dni: '00000000',
  frontImage: {uri: 'file://front.jpg'},
  backImage: {uri: 'file://back.jpg'},
  selfie: {uri: 'file://selfie.jpg'},
};

describe('RegisterUser5', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('reemplaza la vista hacia RegisterUser6 cuando el analisis es exitoso', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};

    renderWithProviders(
      <RegisterUser5
        navigation={localNavigation}
        route={{
          params: baseParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RegisterUser6,
        expect.objectContaining({dni: '00000000'}),
      );
    });
  });

  it('muestra modal de error y permite reintentar cuando falla el analisis', async () => {
    wira.idCardAnalyzer.analyzeFromRegistry.mockResolvedValueOnce({
      success: false,
      error: 'front/back order',
    });

    const localNavigation = {...mockNavigation, replace: jest.fn(), reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser5
        navigation={localNavigation}
        route={{
          params: baseParams,
        }}
      />,
    );

    await waitFor(() => {
      expect(getByTestId('registerUser5ErrorModalButton')).toBeTruthy();
    });

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

  it('LIV-47 - Exigencia de la prueba de vida en /registry/analyze · envía la selfie verificada y el resultado firmado', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    wira.idCardAnalyzer.analyzeFromRegistry.mockClear();

    renderWithProviders(
      <RegisterUser5
        navigation={localNavigation}
        route={{
          params: {
            ...baseParams,
            selfie: {base64: 'SELFIE_VERIFICADA'},
            livenessResult: 'JWT_FIRMADO',
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(wira.idCardAnalyzer.analyzeFromRegistry).toHaveBeenCalled();
    });
    const args = wira.idCardAnalyzer.analyzeFromRegistry.mock.calls[0];
    expect(args[4]).toBe('SELFIE_VERIFICADA');
    expect(args[5]).toBe('JWT_FIRMADO');
  });

  it('LIV-47 - Exigencia de la prueba de vida en /registry/analyze · sin prueba de vida no envía resultado firmado', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    wira.idCardAnalyzer.analyzeFromRegistry.mockClear();

    renderWithProviders(
      <RegisterUser5 navigation={localNavigation} route={{params: baseParams}} />,
    );

    await waitFor(() => {
      expect(wira.idCardAnalyzer.analyzeFromRegistry).toHaveBeenCalled();
    });
    expect(wira.idCardAnalyzer.analyzeFromRegistry.mock.calls[0][5]).toBeUndefined();
  });
});
