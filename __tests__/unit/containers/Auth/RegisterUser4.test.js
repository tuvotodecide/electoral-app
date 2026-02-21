import React from 'react';
import {Alert} from 'react-native';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {launchCamera} from 'react-native-image-picker';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser4 from '../../../../src/container/Auth/RegisterUser4';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RegisterUser4', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('navega a RegisterUser5 despues de capturar selfie', async () => {
    launchCamera.mockImplementationOnce((_options, callback) =>
      callback({assets: [{uri: 'file://selfie.jpg'}]}),
    );

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

    await waitFor(() => expect(getByTestId('registerUser4SelfieImage')).toBeTruthy());

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
    launchCamera.mockImplementationOnce((_options, callback) => callback({}));

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
});
