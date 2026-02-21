import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksSignup} from './helpers/signupFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import SignUpWithMobileNumber from '../../../../src/container/Auth/SignUpWithMobileNumber';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SignUpWithMobileNumber', () => {
  beforeEach(() => {
    limpiarMocksSignup();
  });

  it('continua a OTPCode conservando el titulo recibido', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {title: 'Forgot password'}};

    const {getByTestId} = renderWithProviders(
      <SignUpWithMobileNumber navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('signUpWithMobileNumberContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.OTPCode, {
      title: 'Forgot password',
    });
  });

  it('continua a OTPCode incluso cuando no llega titulo', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <SignUpWithMobileNumber navigation={localNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('signUpWithMobileNumberContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.OTPCode, {
      title: undefined,
    });
  });
});
