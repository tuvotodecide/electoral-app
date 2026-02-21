import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import LoginUser from '../../../../src/container/Auth/LoginUser';
import wira from 'wira-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isLocked, resetAttempts} from '../../../../src/utils/PinAttempts';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

describe('LoginUser', () => {
  beforeEach(() => {
    configurarMocksRegistro();
    AsyncStorage.multiSet = jest.fn(() => Promise.resolve());
  });

  it('renderiza y navega a SelectRecuperation desde "olvidé mi PIN"', async () => {
    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    const {getByTestId} = renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    await waitFor(() => {
      expect(getByTestId('loginUserForgotPasswordButton')).toBeTruthy();
    });

    fireEvent.press(getByTestId('loginUserForgotPasswordButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
  });

  it('redirige a AccountLock cuando el usuario esta bloqueado', async () => {
    isLocked.mockResolvedValueOnce(true);
    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.AccountLock);
    });
  });

  it('si existe sesion biometrica desbloquea y hace reset a TabNavigation', async () => {
    wira.checkBiometricAuth.mockResolvedValueOnce({
      error: null,
      userData: {
        account: '0xaccount',
        guardian: '0xguardian',
      },
    });

    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    await waitFor(() => {
      expect(resetAttempts).toHaveBeenCalled();
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
  });
});
