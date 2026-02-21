import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksSignup} from './helpers/signupFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import CreateNewPassword from '../../../../src/container/Auth/CreateNewPassword';
import {validateConfirmPassword} from '../../../../src/utils/Validation';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/utils/Validation', () => ({
  validPassword: jest.fn(() => ({msg: ''})),
  validateConfirmPassword: jest.fn(() => ({msg: ''})),
}));

describe('CreateNewPassword', () => {
  beforeEach(() => {
    limpiarMocksSignup();
  });

  it('permite editar ambos campos de contrasena', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <CreateNewPassword navigation={localNavigation} />,
    );

    fireEvent.changeText(getByTestId('createNewPasswordInput'), 'Abcdefg1');
    fireEvent.changeText(getByTestId('createNewPasswordConfirmInput'), 'Abcdefg1');

    expect(getByTestId('createNewPasswordInput').props.value).toBe('Abcdefg1');
    expect(getByTestId('createNewPasswordConfirmInput').props.value).toBe('Abcdefg1');
  });

  it('navega a SuccessfulPassword al confirmar nueva contrasena', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};

    const {getByTestId} = renderWithProviders(
      <CreateNewPassword navigation={localNavigation} />,
    );

    fireEvent.press(getByTestId('createNewPasswordResetButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SuccessfulPassword);
  });

  it('muestra error de confirmacion cuando la contrasena no coincide', () => {
    validateConfirmPassword.mockReturnValueOnce({msg: 'Las contrasenas no coinciden'});

    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId, getByText} = renderWithProviders(
      <CreateNewPassword navigation={localNavigation} />,
    );

    fireEvent.changeText(getByTestId('createNewPasswordInput'), 'Abcdefg1');
    fireEvent.changeText(getByTestId('createNewPasswordConfirmInput'), 'Qwerty12');

    expect(getByText('Las contrasenas no coinciden')).toBeTruthy();
  });
});
