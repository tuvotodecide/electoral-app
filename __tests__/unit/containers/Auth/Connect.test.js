import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksFlujoInicial} from './helpers/initialAuthFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import Connect from '../../../../src/container/Connect';
import wira from 'wira-sdk';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import {checkLegacyDataExists} from '../../../../src/utils/migrateLegacy';

describe('Connect', () => {
  beforeEach(() => {
    configurarMocksFlujoInicial();
  });

  it('redirige automáticamente a Login cuando existe usuario ', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValueOnce(true);

    renderWithProviders(<Connect navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.LoginUser);
    });
  });

  it('envía a SelectRecuperation al presionar ingresar sin datos locales ni legados', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValue(false);
    checkLegacyDataExists.mockResolvedValue(false);

    const {getByTestId} = renderWithProviders(<Connect navigation={localNavigation} />);

    fireEvent.press(getByTestId('connectLoginButton'));

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
    });
  });

  it('envía a LoginUser cuando no hay datos locales pero sí legado detectado', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    wira.Storage.checkUserData.mockResolvedValue(false);
    checkLegacyDataExists.mockResolvedValue(true);

    const {getByTestId} = renderWithProviders(<Connect navigation={localNavigation} />);

    fireEvent.press(getByTestId('connectLoginButton'));

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.LoginUser);
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
});
