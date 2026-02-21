import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import {useHasGuardiansQuery} from '../../../../src/data/guardians';
import FindMyUser from '../../../../src/container/TabBar/Recovery/FindMyUser';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('FindMyUser', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('busca usuario y envia solicitud navegando a MyGuardiansStatus', async () => {
    const localNavigation = {...mockNavigation, replace: jest.fn()};

    const {getByTestId} = renderWithProviders(
      <FindMyUser navigation={localNavigation} />,
    );

    fireEvent.changeText(getByTestId('findMyUserIdInput'), '12345678');
    fireEvent.press(getByTestId('findMyUserSearchButton'));

    await waitFor(() => {
      expect(getByTestId('findMyUserNameInput')).toBeTruthy();
    });

    fireEvent.press(getByTestId('findMyUserConfirmButton'));
    fireEvent.press(getByTestId('findMyUserSendButton'));

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(StackNav.AuthNavigation, {
        screen: AuthNav.MyGuardiansStatus,
        params: {dni: '12345678'},
      });
    });
  });

  it('si no tiene guardianes muestra error y no habilita envio', async () => {
    useHasGuardiansQuery.mockReturnValue({
      has: false,
      loading: false,
      refetch: jest.fn(),
    });

    const localNavigation = {...mockNavigation, replace: jest.fn()};
    const {getByTestId, findByTestId} = renderWithProviders(
      <FindMyUser navigation={localNavigation} />,
    );

    fireEvent.changeText(getByTestId('findMyUserIdInput'), '12345678');
    fireEvent.press(getByTestId('findMyUserSearchButton'));

    await waitFor(() => {
      expect(getByTestId('findMyUserNameInput')).toBeTruthy();
    });

    fireEvent.press(getByTestId('findMyUserConfirmButton'));

    expect(await findByTestId('findMyUserErrorAlert')).toBeTruthy();
    expect(getByTestId('findMyUserSendButton').props.disabled).toBe(true);
  });
});
