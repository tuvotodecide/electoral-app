import React from 'react';
import {Platform} from 'react-native';
import {fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createMockSession} from '@privado-id/expo-sdk';
import {configurarMocksFlujoInicial} from './helpers/initialAuthFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import Connect from '../../../../src/container/Connect';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import {getPrivadoSession} from '../../../../src/services/privado/privadoSession';
import {FIRST_LAUNCH_KEY} from '../../../../src/services/privado/localAccount';
import {
  __resetDemoSessionForTests,
  startDemoSession,
} from '../../../../src/features/demo/demoSession';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoSession: jest.fn(),
}));

const HOLDER = {did: 'did:iden3:base:sepolia:holder', wallet: {address: '0xaa'}};

describe('Connect', () => {
  let session;

  // Con cuenta local: identidad guardada y vault creado.
  const withLocalAccount = (present = true) => {
    session.client.getHolderDid.mockResolvedValue(present ? HOLDER : undefined);
    session.vault.exists.mockResolvedValue(present);
  };

  beforeEach(() => {
    configurarMocksFlujoInicial();
    __resetDemoSessionForTests();
    session = createMockSession();
    getPrivadoSession.mockResolvedValue(session);
    withLocalAccount(false);
    // La app ya arrancó antes en este dispositivo.
    AsyncStorage.getItem.mockImplementation(async key =>
      key === FIRST_LAUNCH_KEY ? 'true' : null,
    );
  });

  it('redirige automáticamente a Login cuando existe usuario ', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    withLocalAccount(true);

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
    });
  });

  it('sin vault no hay cuenta aunque quede la identidad', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn(), navigate: jest.fn()};
    session.client.getHolderDid.mockResolvedValue(HOLDER);
    session.vault.exists.mockResolvedValue(false);

    const {getByTestId} = renderWithProviders(<Connect navigation={localNavigation} />);
    fireEvent.press(getByTestId('connectLoginButton'));

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.AccountAccess);
    });
    expect(localNavigation.replace).not.toHaveBeenCalledWith(AuthNav.LoginUser);
  });

  it('envía a AccountAccess al presionar ingresar sin datos locales', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};

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

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.AccountAccess,
        {resumeDemo: true},
      );
    });
    expect(localNavigation.replace).not.toHaveBeenCalledWith(AuthNav.LoginUser);
  });

  it('una billetera real gana sobre una sesión demo persistida', async () => {
    await startDemoSession();
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    withLocalAccount(true);

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
    });
    expect(localNavigation.replace).not.toHaveBeenCalledWith(
      AuthNav.AccountAccess,
      {resumeDemo: true},
    );
  });

  describe('primer arranque tras instalar', () => {
    const originalOS = Platform.OS;
    afterEach(() => {
      Platform.OS = originalOS;
    });

    it('en iOS borra la cuenta que quedó en el Keychain y marca el arranque', async () => {
      Platform.OS = 'ios';
      AsyncStorage.getItem.mockResolvedValue(null);
      // Hasta que se borra, el Keychain conserva la cuenta anterior.
      withLocalAccount(true);
      session.client.deleteLocalData.mockImplementation(async () => withLocalAccount(false));
      const localNavigation = {...mockNavigation, replace: jest.fn()};

      renderWithProviders(<Connect navigation={localNavigation} />);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(FIRST_LAUNCH_KEY, 'true');
      });
      expect(session.client.deleteLocalData).toHaveBeenCalledTimes(1);
      expect(localNavigation.replace).not.toHaveBeenCalledWith(AuthNav.LoginUser);
    });

    it('en iOS, si ya arrancó antes, no borra nada', async () => {
      Platform.OS = 'ios';
      withLocalAccount(true);
      const localNavigation = {...mockNavigation, replace: jest.fn()};

      renderWithProviders(<Connect navigation={localNavigation} />);

      await waitFor(() => {
        expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
      });
      expect(session.client.deleteLocalData).not.toHaveBeenCalled();
    });

    it('en Android no borra nada', async () => {
      Platform.OS = 'android';
      AsyncStorage.getItem.mockResolvedValue(null);
      withLocalAccount(true);
      const localNavigation = {...mockNavigation, replace: jest.fn()};

      renderWithProviders(<Connect navigation={localNavigation} />);

      await waitFor(() => {
        expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
      });
      expect(session.client.deleteLocalData).not.toHaveBeenCalled();
    });
  });
});
