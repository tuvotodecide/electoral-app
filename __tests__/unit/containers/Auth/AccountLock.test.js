import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import AccountLock from '../../../../src/container/Auth/AccountLock';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('AccountLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('regresa a Connect al usar el botón atrás del header', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<AccountLock navigation={localNavigation} />);

    fireEvent.press(getByTestId('accountLockHeaderBackButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.Connect);
  });

  it('navega a SelectRecuperation con disableCI(carnet) habilitado', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<AccountLock navigation={localNavigation} />);

    fireEvent.press(getByTestId('accountLockRecoveryButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SelectRecuperation, {
      disableCI: true,
    });
  });
});
