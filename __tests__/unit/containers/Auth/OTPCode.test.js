import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksSignup} from './helpers/signupFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import OTPCode from '../../../../src/container/Auth/OTPCode';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('OTPCode', () => {
  beforeEach(() => {
    limpiarMocksSignup();
  });

  it('navega a CreateNewPassword cuando recibe titulo en route.params', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {title: 'Forgot password'}};

    const {getByTestId} = renderWithProviders(
      <OTPCode navigation={localNavigation} route={route} />,
    );

    fireEvent.press(getByTestId('continueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.CreateNewPassword);
  });

  it('navega a FaceIdScreen cuando no recibe titulo', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};

    const {getByTestId} = renderWithProviders(
      <OTPCode navigation={localNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('continueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.FaceIdScreen);
  });

  it('al reenviar codigo dispara alerta de reenvio', () => {
    const originalAlert = global.alert;
    const alertMock = jest.fn();
    global.alert = alertMock;
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <OTPCode navigation={localNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('resendCodeButton'));

    expect(alertMock).toHaveBeenCalledWith('Otp Resend');
    global.alert = originalAlert;
  });

  it('expone el input OTP con longitud esperada y permite escribir', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <OTPCode navigation={localNavigation} route={{}} />,
    );

    const otpInput = getByTestId('otpInput');
    fireEvent.changeText(otpInput, '12345');

    expect(otpInput.props.maxLength).toBe(5);
    expect(otpInput).toBeTruthy();
  });

  it('muestra opcion para usar otro telefono sin disparar navegacion', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <OTPCode navigation={localNavigation} route={{}} />,
    );

    fireEvent.press(getByTestId('differentPhoneNumberButton'));

    expect(getByTestId('differentPhoneNumberText')).toBeTruthy();
    expect(localNavigation.navigate).not.toHaveBeenCalled();
  });
});
