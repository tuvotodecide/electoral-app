import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksSignup} from './helpers/signupFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import SignUp from '../../../../src/container/Auth/SignUp';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SignUp', () => {
  beforeEach(() => {
    limpiarMocksSignup();
  });

  it('navega a SignUpWithMobileNumber desde el botón principal', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SignUp navigation={localNavigation} />);

    fireEvent.press(getByTestId('signUpButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SignUpWithMobileNumber);
  });

  it('navega a Login desde el enlace de iniciar sesión', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SignUp navigation={localNavigation} />);

    fireEvent.press(getByTestId('signInLinkButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.Login);
  });
});
