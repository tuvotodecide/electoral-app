import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksSignup} from './helpers/signupFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import SuccessfulPassword from '../../../../src/container/Auth/SuccessfulPassword';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SuccessfulPassword', () => {
  beforeEach(() => {
    limpiarMocksSignup();
  });

  it('renderiza confirmacion visual de contrasena actualizada', () => {
    const {getByTestId} = renderWithProviders(
      <SuccessfulPassword navigation={mockNavigation} />,
    );

    expect(getByTestId('successfulPasswordContainer')).toBeTruthy();
    expect(getByTestId('successfulPasswordImage')).toBeTruthy();
    expect(getByTestId('successfulPasswordTitle')).toBeTruthy();
    expect(getByTestId('successfulPasswordDescription')).toBeTruthy();
  });

  it('regresa a Login al presionar volver', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};

    const {getByTestId} = renderWithProviders(
      <SuccessfulPassword navigation={localNavigation} />,
    );

    fireEvent.press(getByTestId('successfulPasswordBackButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.Login);
  });
});
