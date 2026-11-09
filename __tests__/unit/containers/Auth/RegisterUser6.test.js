import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser6 from '../../../../src/container/Auth/RegisterUser6';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

const TOKEN_PARAMS = {
  identityToken: 'header.claims.signature',
  identityTokenExpiresAt: '2026-11-06T12:10:00.000Z',
};

const route = {
  params: {
    dni: '00000000',
    ocrData: {fullName: 'Test', governmentIdentifier: '00000000', dateOfBirth: 0},
  },
};

describe('RegisterUser6', () => {
  beforeEach(() => {
    configurarMocksRegistro();
  });

  it('mantiene deshabilitado confirmar hasta marcar el checkbox', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser6 navigation={localNavigation} route={route} />,
    );

    expect(getByTestId('registerUser6ConfirmButton').props.disabled).toBe(true);
    fireEvent.press(getByTestId('registerUser6CheckboxButton'));
    expect(getByTestId('registerUser6ConfirmButton').props.disabled).toBe(false);
  });

  it('confirma datos y navega a RegisterUser7 con parametros', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser6 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser6CheckboxButton'));
    fireEvent.press(getByTestId('registerUser6ConfirmButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser7, {
      ocrData: route.params.ocrData,
      dni: '00000000',
    });
  });

  it('usa el boton volver para reiniciar en RegisterUser2', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser6 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser6ReturnButton'));

    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: AuthNav.RegisterUser2}],
    });
  });

  it('usa atras del header para volver a RegisterUser4', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser6 navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('registerUser6HeaderBackButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser4);
  });

  it('reenvia el identityToken a RegisterUser7', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), reset: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser6
        navigation={localNavigation}
        route={{params: {...route.params, ...TOKEN_PARAMS}}}
      />,
    );

    fireEvent.press(getByTestId('registerUser6CheckboxButton'));
    fireEvent.press(getByTestId('registerUser6ConfirmButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(
      AuthNav.RegisterUser7,
      expect.objectContaining(TOKEN_PARAMS),
    );
  });
});
