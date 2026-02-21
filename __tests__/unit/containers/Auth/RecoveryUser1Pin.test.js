import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RecoveryUser1Pin from '../../../../src/container/TabBar/Recovery/RecoveryUser1Pin';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RecoveryUser1Pin', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('navega a RecoveryUser2Pin con recData y PIN original', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {recData: '{"ok":true}'}};

    const {getByTestId} = renderWithProviders(
      <RecoveryUser1Pin navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '9876');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RecoveryUser2Pin, {
      recData: '{"ok":true}',
      originalPin: '9876',
    });
  });
});
