import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser7 from '../../../../src/container/Auth/RegisterUser7';
import {biometryAvailability, biometricLogin} from '../../../../src/utils/Biometry';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

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
    expect(biometryAvailability).toHaveBeenCalled();
    expect(biometricLogin).toHaveBeenCalled();
  });

  it('muestra modal informativo cuando el dispositivo no tiene biometria', async () => {
    biometryAvailability.mockResolvedValueOnce({available: false, biometryType: null});
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
});
