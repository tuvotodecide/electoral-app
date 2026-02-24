import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import {PENDINGRECOVERY} from '../../../../src/common/constants';
import {useGuardiansRecoveryDetailQuery} from '../../../../src/data/guardians';
import MyGuardiansStatus from '../../../../src/container/TabBar/Recovery/MyGuardiansStatus';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('MyGuardiansStatus', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
    AsyncStorage.getItem = jest.fn(() => Promise.resolve('12345678'));
    AsyncStorage.setItem = jest.fn(() => Promise.resolve());
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

  it('si el estado es APPROVED inicia recuperacion y navega a RecoveryUser1Pin', async () => {
    useGuardiansRecoveryDetailQuery.mockReturnValueOnce({
      data: {
        ok: true,
        status: 'APPROVED',
        votes: [{guardianDid: 'did:guardian:1', decision: 'APPROVED'}],
      },
      isLoading: false,
      remove: jest.fn(),
    });

    const localNavigation = {...mockNavigation, navigate: jest.fn(), replace: jest.fn()};
    renderWithProviders(<MyGuardiansStatus navigation={localNavigation} />);

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RecoveryUser1Pin,
        expect.objectContaining({
          recData: expect.any(String),
        }),
      );
    });
  });

  it('si el estado es REJECTED limpia pending recovery y redirige a SelectRecuperation', async () => {
    const removeSpy = jest.fn();
    useGuardiansRecoveryDetailQuery.mockReturnValueOnce({
      data: {
        ok: true,
        status: 'REJECTED',
        votes: [{guardianDid: 'did:guardian:1', decision: 'REJECTED'}],
      },
      isLoading: false,
      remove: removeSpy,
    });

    const localNavigation = {...mockNavigation, navigate: jest.fn(), replace: jest.fn()};
    renderWithProviders(<MyGuardiansStatus navigation={localNavigation} />);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(PENDINGRECOVERY, 'false');
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
    });
  });
});
