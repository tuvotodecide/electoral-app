import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import SelectRecuperation from '../../../../src/container/Auth/SelectRecuperation';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SelectRecuperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('regresa a Connect al presionar atrás en el header', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <SelectRecuperation navigation={localNavigation} route={{params: {}}} />,
    );

    fireEvent.press(getByTestId('selectRecuperationHeaderBackButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.Connect);
  });

  it('la opción CI navega a RegisterUser1 con modo recuperación', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <SelectRecuperation navigation={localNavigation} route={{params: {}}} />,
    );

    fireEvent.press(getByTestId('selectRecuperationCiOption'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RegisterUser1, {
      isRecovery: true,
    });
  });

  it('las opciones de guardianes y archivo navegan a sus pantallas correctas', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <SelectRecuperation navigation={localNavigation} route={{params: {}}} />,
    );

    fireEvent.press(getByTestId('selectRecuperationGuardiansOption'));
    fireEvent.press(getByTestId('selectRecuperationFileOption'));

    expect(localNavigation.navigate).toHaveBeenNthCalledWith(1, AuthNav.FindMyUser);
    expect(localNavigation.navigate).toHaveBeenNthCalledWith(2, AuthNav.RecoveryQr);
  });

  it('oculta la opción CI cuando disableCI es true', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {queryByTestId} = renderWithProviders(
      <SelectRecuperation navigation={localNavigation} route={{params: {disableCI: true}}} />,
    );

    expect(queryByTestId('selectRecuperationCiOption')).toBeNull();
  });
});
