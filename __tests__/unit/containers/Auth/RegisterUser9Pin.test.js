import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser9 from '../../../../src/container/Auth/RegisterUser9Pin';
import {setTmpPin} from '../../../../src/utils/TempRegister';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RegisterUser9Pin', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('guarda el PIN temporal y navega a RegisterUser10 cuando coincide', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        ocrData: {dni: '00000000'},
        useBiometry: true,
        dni: '00000000',
      },
    };

    const {getByTestId} = renderWithProviders(
      <RegisterUser9 navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('registerUser9PinInput'), '1234');
    fireEvent.press(getByTestId('registerUser9PinConfirmButton'));

    await waitFor(() => {
      expect(setTmpPin).toHaveBeenCalledWith('1234');
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser10, {
        originalPin: '1234',
        ocrData: route.params.ocrData,
        useBiometry: true,
        dni: '00000000',
      });
    });
  });

  it('muestra error cuando el PIN de confirmacion no coincide', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        ocrData: {dni: '00000000'},
        useBiometry: true,
        dni: '00000000',
      },
    };

    const {getByTestId, findByTestId} = renderWithProviders(
      <RegisterUser9 navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('registerUser9PinInput'), '9999');
    fireEvent.press(getByTestId('registerUser9PinConfirmButton'));

    expect(await findByTestId('registerUser9PinErrorAlert')).toBeTruthy();
    expect(localNavigation.navigate).not.toHaveBeenCalledWith(
      AuthNav.RegisterUser10,
      expect.anything(),
    );
  });
});
