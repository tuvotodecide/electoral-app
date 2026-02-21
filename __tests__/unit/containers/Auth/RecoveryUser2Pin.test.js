import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {configurarMocksRecuperacion} from './helpers/recoveryFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import String from '../../../../src/i18n/String';
import RecoveryUser2Pin from '../../../../src/container/TabBar/Recovery/RecoveryUser2Pin';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RecoveryUser2Pin', () => {
  beforeEach(() => {
    configurarMocksRecuperacion();
  });

  it('mantiene deshabilitado confirmar mientras el PIN no tenga 4 digitos', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {originalPin: '9876', recData: '{"ok":true}'}};

    const {getByTestId} = renderWithProviders(
      <RecoveryUser2Pin navigation={localNavigation} route={route} />,
    );

    expect(getByTestId('changePinNewContinueButton').props.disabled).toBe(true);

    fireEvent.changeText(getByTestId('otpInput'), '98');

    expect(getByTestId('changePinNewContinueButton').props.disabled).toBe(true);
  });

  it('navega a RecoveryFinalize cuando el PIN coincide', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {originalPin: '9876', recData: '{"ok":true}'}};

    const {getByTestId} = renderWithProviders(
      <RecoveryUser2Pin navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '9876');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.RecoveryFinalize, {
      originalPin: '9876',
      recData: '{"ok":true}',
    });
  });

  it('muestra error y no navega cuando el PIN no coincide', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const route = {params: {originalPin: '9876', recData: '{"ok":true}'}};

    const {getByTestId, getByText} = renderWithProviders(
      <RecoveryUser2Pin navigation={localNavigation} route={route} />,
    );

    fireEvent.changeText(getByTestId('otpInput'), '1111');
    fireEvent.press(getByTestId('changePinNewContinueButton'));

    expect(getByText(String.incorrectPinError)).toBeTruthy();
    expect(localNavigation.navigate).not.toHaveBeenCalled();
  });
});
