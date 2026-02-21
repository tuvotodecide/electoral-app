import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {StackNav} from '../../../../src/navigation/NavigationKey';
import VerifySuccess from '../../../../src/container/Auth/VerifySuccess';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('VerifySuccess', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('reinicia navegación al raíz de TabNavigation', () => {
    const localNavigation = {...mockNavigation, reset: jest.fn()};
    const {getByTestId} = renderWithProviders(<VerifySuccess navigation={localNavigation} />);

    fireEvent.press(getByTestId('verifySuccessContinueButton'));

    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: StackNav.TabNavigation}],
    });
  });
});
