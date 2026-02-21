import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RecoveryUserQrPin from '../../../../src/container/TabBar/Recovery/RecoveryUserQrpin';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RecoveryUserQrpin', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('navega a RecoveryUserQrpin2 con el PIN original', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {payload: {data: {dni: '00000000'}}}};

    const {getByTestId} = renderWithProviders(
      <RecoveryUserQrPin navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '1234');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RecoveryUserQrpin2, {
      originalPin: '1234',
      payload: route.params.payload,
    });
  });
});
