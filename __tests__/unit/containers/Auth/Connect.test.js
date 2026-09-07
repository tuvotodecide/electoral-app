import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksFlujoInicial} from './helpers/initialAuthFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import Connect from '../../../../src/container/Connect';
import wira from 'wira-sdk';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import {
  __resetDemoSessionForTests,
  startDemoSession,
} from '../../../../src/features/demo/demoSession';

describe('Connect', () => {
  beforeEach(() => {
    configurarMocksFlujoInicial();
    __resetDemoSessionForTests();
  });

  it('redirige automáticamente a Login cuando existe usuario ', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValueOnce(true);

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
    });
  });

  it('envía a AccountAccess al presionar ingresar sin datos locales', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValue(false);

    const {getByTestId} = renderWithProviders(<Connect navigation={localNavigation} />);

    fireEvent.press(getByTestId('connectLoginButton'));

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.AccountAccess);
    });
  });

  it('navega a registro y onboarding desde sus botones', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<Connect navigation={localNavigation} />);

    fireEvent.press(getByTestId('connectRegisterButton'));
    fireEvent.press(getByTestId('connectInfoButton'));

    expect(localNavigation.navigate).toHaveBeenNthCalledWith(1, AuthNav.RegisterUser1);
    expect(localNavigation.navigate).toHaveBeenNthCalledWith(2, StackNav.OnBoarding);
  });

  it('retoma la sesión demo persistida en AccountAccess, no en LoginUser', async () => {
    await startDemoSession();
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValue(false);

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.AccountAccess,
        {resumeDemo: true},
      );
    });
    // LoginUser abriría el modal de "no hay datos biométricos".
    expect(localNavigation.replace).not.toHaveBeenCalledWith(AuthNav.LoginUser);
  });

  it('una billetera real gana sobre una sesión demo persistida', async () => {
    await startDemoSession();
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValue(true);

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
    });
    expect(localNavigation.replace).not.toHaveBeenCalledWith(
      AuthNav.AccountAccess,
      {resumeDemo: true},
    );
  });
});
