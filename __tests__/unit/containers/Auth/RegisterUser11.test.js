import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser11 from '../../../../src/container/Auth/RegisterUser11';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('RegisterUser11', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza el contenido de bienvenida y los bloques de funcionalidades', () => {
    const {getByTestId} = renderWithProviders(
      <RegisterUser11 navigation={mockNavigation} />,
    );

    expect(getByTestId('registerUser11Container')).toBeTruthy();
    expect(getByTestId('registerUser11AssetsFeature')).toBeTruthy();
    expect(getByTestId('registerUser11TransferFeature')).toBeTruthy();
    expect(getByTestId('registerUser11HistoryFeature')).toBeTruthy();
    expect(getByTestId('registerUser11SecurityFeature')).toBeTruthy();
  });

  it('navega a LoginUser al presionar ir a la billetera', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(
      <RegisterUser11 navigation={localNavigation} />,
    );

    fireEvent.press(getByTestId('registerUser11GoToWalletButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.LoginUser);
  });
});
