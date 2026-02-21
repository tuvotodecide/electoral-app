import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RecoveryUserQrPin2 from '../../../../src/container/TabBar/Recovery/RecoveryUserQrpin2';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RecoveryUserQrpin2', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('hace reset a LoginUser cuando el PIN de confirmacion coincide', async () => {
    const localNavigation = {...mockNavigation, reset: jest.fn(), navigate: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        payload: {data: {dni: '00000000'}},
      },
    };

    const {getByTestId} = renderWithProviders(
      <RecoveryUserQrPin2 navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '1234');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: AuthNav.LoginUser}],
      });
    });
  });

  it('si el PIN no coincide muestra error y no navega', async () => {
    const localNavigation = {...mockNavigation, reset: jest.fn(), navigate: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        payload: {data: {dni: '00000000'}},
      },
    };

    const {getByTestId, findByTestId} = renderWithProviders(
      <RecoveryUserQrPin2 navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '9999');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    expect(await findByTestId('icon-close-circle-outline')).toBeTruthy();
    expect(localNavigation.reset).not.toHaveBeenCalled();
  });

  it('si hay datos legacy navega a RegisterUser10 en modo migracion', async () => {
    const localNavigation = {...mockNavigation, reset: jest.fn(), navigate: jest.fn()};
    const route = {
      params: {
        originalPin: '1234',
        payload: {
          data: {dni: '00000000'},
          legacyData: {numeroDoc: '00000000'},
        },
      },
    };

    const {getByTestId} = renderWithProviders(
      <RecoveryUserQrPin2 navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '1234');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    await waitFor(() => {
      expect(localNavigation.navigate).toHaveBeenCalledWith(
        AuthNav.RegisterUser10,
        expect.objectContaining({
          ocrData: route.params.payload.legacyData,
          dni: '00000000',
          originalPin: '1234',
          isMigration: true,
        }),
      );
    });
  });
});
