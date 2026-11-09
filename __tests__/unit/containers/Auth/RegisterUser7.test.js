import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser7 from '../../../../src/container/Auth/RegisterUser7';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import * as LocalAuthentication from 'expo-local-authentication';

const TOKEN_PARAMS = {
  identityToken: 'header.claims.signature',
  identityTokenExpiresAt: '2026-11-06T12:10:00.000Z',
};

const route = {params: {ocrData: {dni: '00000000'}, dni: '00000000'}};

describe('RegisterUser7', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('navega a RegisterUser8 tanto al habilitar biometria como al omitirla', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};

    const {getByTestId} = renderWithProviders(
      <RegisterUser7 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser7ActivateButton'));
    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser8, {
        ocrData: route.params.ocrData,
        useBiometry: true,
        dni: '00000000',
      });
    });

    fireEvent.press(getByTestId('registerUser7LaterButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser8, {
      ocrData: route.params.ocrData,
      useBiometry: false,
      dni: '00000000',
    });
    expect(LocalAuthentication.hasHardwareAsync).toHaveBeenCalled();
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'Escanea tu huella dactilar',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
  });

  it('usa el texto de rostro cuando el dispositivo tiene reconocimiento facial', async () => {
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValueOnce([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser7 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser7ActivateButton'));

    await waitFor(() => {
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({promptMessage: 'Escanea tu rostro'}),
      );
    });
  });

  it('muestra modal cuando no hay biometria registrada', async () => {
    LocalAuthentication.isEnrolledAsync.mockResolvedValueOnce(false);
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId, getByText} = renderWithProviders(
      <RegisterUser7 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser7ActivateButton'));

    await waitFor(() => {
      expect(getByText(/No hay huellas ni Face ID registradas/)).toBeTruthy();
    });
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    expect(localNavigation.navigate).not.toHaveBeenCalled();
  });

  it('muestra modal y no avanza si la autenticacion falla o se cancela', async () => {
    LocalAuthentication.authenticateAsync.mockResolvedValueOnce({success: false, error: 'user_cancel'});
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId, getByText} = renderWithProviders(
      <RegisterUser7 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser7ActivateButton'));

    await waitFor(() => {
      expect(getByText(/La autenticación falló/)).toBeTruthy();
    });
    expect(localNavigation.navigate).not.toHaveBeenCalled();
  });

  it('muestra modal informativo cuando el dispositivo no tiene biometria', async () => {
    LocalAuthentication.hasHardwareAsync.mockResolvedValueOnce(false);
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser7 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser7ActivateButton'));

    await waitFor(() => {
      expect(getByTestId('registerUser7InfoModalMessageLine_0')).toBeTruthy();
    });
    expect(localNavigation.navigate).not.toHaveBeenCalledWith(
      AuthNav.RegisterUser8,
      expect.anything(),
    );
  });

  it('reenvia el identityToken a RegisterUser8', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser7
        navigation={localNavigation}
        route={{params: {...route.params, ...TOKEN_PARAMS}}}
      />,
    );

    fireEvent.press(getByTestId('registerUser7LaterButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(
      AuthNav.RegisterUser8,
      expect.objectContaining({useBiometry: false, ...TOKEN_PARAMS}),
    );
  });
});
