import React from 'react';
import {waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RecoveryFinalize from '../../../../src/container/TabBar/Recovery/RecoveryFinalize';
import {startSession} from '../../../../src/utils/Session';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RecoveryFinalize', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('finaliza recuperacion y navega a LoginUser', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), replace: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        recData: JSON.stringify({account: '0xaccount'}),
      },
    };

    renderWithProviders(<RecoveryFinalize navigation={localNavigation} route={route} />);

    await waitFor(() => {
      expect(startSession).toHaveBeenCalled();
      expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.LoginUser);
    });
  });

  it('si falla la finalizacion redirige a SelectRecuperation', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), replace: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        recData: 'not-json',
      },
    };

    renderWithProviders(<RecoveryFinalize navigation={localNavigation} route={route} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
    });
  });
});
