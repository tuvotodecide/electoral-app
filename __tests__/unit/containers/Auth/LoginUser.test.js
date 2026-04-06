import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import LoginUser from '../../../../src/container/Auth/LoginUser';
import wira from 'wira-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {incAttempts, isLocked, resetAttempts} from '../../../../src/utils/PinAttempts';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import String from '../../../../src/i18n/String';

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

describe('LoginUser', () => {
  beforeEach(() => {
    configurarMocksRegistro();
    AsyncStorage.multiSet = jest.fn(() => Promise.resolve());
    AsyncStorage.setItem = jest.fn(() => Promise.resolve());
    AsyncStorage.getItem = jest.fn(() => Promise.resolve(null));
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

  it('al llegar al limite de intentos muestra modal y redirige a recuperacion', async () => {
    incAttempts.mockResolvedValueOnce(5);
    wira.Storage.checkUserData.mockResolvedValueOnce(true);
    wira.signIn.mockRejectedValueOnce(new Error('Invalid PIN'));

    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    const {findByText, getByTestId} = renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    await waitFor(() => {
      expect(getByTestId('textInput')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('textInput'), '1234');

    expect(await findByText(/Has agotado tus 5 intentos/i)).toBeTruthy();
    expect(getByTestId('loginUserInfoModal').props.visible).toBe(true);

    act(() => {
      getByTestId('loginUserInfoModalButton').props.onPress();
    });

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.SelectRecuperation,
        {disableCI: true},
      );
    });
  });

  it('si no hay secretos locales redirige al registro inicial', async () => {
    wira.Storage.checkUserData.mockResolvedValueOnce(false);

    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    const {findByText, getByTestId} = renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    await waitFor(() => {
      expect(getByTestId('textInput')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('textInput'), '1234');

    expect(await findByText(String.notRegistered)).toBeTruthy();
    expect(getByTestId('loginUserInfoModal').props.visible).toBe(true);

    act(() => {
      getByTestId('loginUserInfoModalButton').props.onPress();
    });

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: StackNav.AuthNavigation,
            params: {screen: AuthNav.RegisterUser1},
          },
        ],
      });
    });
  });

  it('si no hay credenciales biométricas muestra aviso y no navega', async () => {
    wira.checkBiometricAuth.mockResolvedValueOnce({
      error: 'No credentials stored',
      userData: null,
    });
    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    const {findByText, getByTestId} = renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    expect(await findByText(String.noBiometricData)).toBeTruthy();
    expect(localNavigation.reset).not.toHaveBeenCalledWith({
      index: 0,
      routes: [{name: StackNav.TabNavigation}],
    });
    expect(getByTestId('loginUserInfoModal')).toBeTruthy();
  });

  it('si verifyPin retorna error inesperado muestra modal de contingencia', async () => {
    wira.Storage.checkUserData.mockResolvedValueOnce(true);
    wira.signIn.mockRejectedValueOnce(new Error('Unexpected error'));
    const localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };

    const {findByText, getByTestId} = renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params: {}}} />,
    );

    await waitFor(() => {
      expect(getByTestId('textInput')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('textInput'), '1234');

    expect(
      await findByText(
        /Ocurrió un error inesperado al verificar tu credencial/i,
      ),
    ).toBeTruthy();
  });
});
