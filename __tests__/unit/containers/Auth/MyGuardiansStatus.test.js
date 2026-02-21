import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import {useGuardiansRecoveryDetailQuery} from '../../../../src/data/guardians';
import MyGuardiansStatus from '../../../../src/container/TabBar/Recovery/MyGuardiansStatus';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('MyGuardiansStatus', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('renderiza lista y vuelve a Connect', async () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn(), replace: jest.fn()};

    const {getByTestId} = renderWithProviders(
      <MyGuardiansStatus navigation={localNavigation} />,
    );

    await waitFor(() => {
      expect(getByTestId('myGuardiansStatusList')).toBeTruthy();
    });

    fireEvent.press(getByTestId('myGuardiansStatusReturnButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(StackNav.AuthNavigation, {
      screen: AuthNav.Connect,
    });
  });

  it('muestra estado sin guardianes cuando la lista esta vacia', async () => {
    useGuardiansRecoveryDetailQuery.mockReturnValueOnce({
      data: {
        ok: true,
        status: 'PENDING',
        votes: [],
      },
      isLoading: false,
      remove: jest.fn(),
    });

    const localNavigation = {...mockNavigation, navigate: jest.fn(), replace: jest.fn()};
    const {queryByTestId} = renderWithProviders(
      <MyGuardiansStatus navigation={localNavigation} />,
    );

    await waitFor(() => {
      expect(queryByTestId('myGuardiansStatusList')).toBeNull();
    });
  });
});
