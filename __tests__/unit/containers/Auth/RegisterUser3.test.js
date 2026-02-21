import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser3 from '../../../../src/container/Auth/RegisterUser3';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RegisterUser3', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('navega a RegisterUser4 con los parámetros recibidos', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {dni: '00000000'}};
    const {getByTestId} = renderWithProviders(
      <RegisterUser3 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('scanFaceButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser4, route.params);
  });
});
