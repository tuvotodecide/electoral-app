import React from 'react';
import {waitFor} from '@testing-library/react-native';
import {configurarMocksFlujoInicial} from './helpers/initialAuthFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import Splash from '../../../../src/container/Splash';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import {getDraft} from '../../../../src/utils/RegisterDraft';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Splash', () => {
  beforeEach(() => {
    configurarMocksFlujoInicial();
  });

  it('redirecciona a RegisterUser10 cuando existe borrador', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn(), navigate: jest.fn()};
    const draft = {dni: '123', originalPin: '1111'};
    getDraft.mockResolvedValueOnce(draft);

    renderWithProviders(<Splash navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(StackNav.AuthNavigation, {
        screen: AuthNav.RegisterUser10,
        params: draft,
      });
    });
  });

  it('redirecciona a MyGuardiansStatus cuando hay recuperación pendiente', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn(), navigate: jest.fn()};
    getDraft.mockResolvedValueOnce(null);
    AsyncStorage.getItem.mockResolvedValueOnce('true');

    renderWithProviders(<Splash navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(StackNav.AuthNavigation, {
        screen: AuthNav.MyGuardiansStatus,
      });
    });
  });

  it('por defecto entra a AuthNavigation cuando no hay borrador ni recuperación pendiente', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn(), navigate: jest.fn()};
    getDraft.mockResolvedValueOnce(null);
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    renderWithProviders(<Splash navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(StackNav.AuthNavigation);
    });
  });
});
