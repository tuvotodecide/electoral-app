import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import SelectCountry from '../../../../src/container/Auth/SelectCountry';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SelectCountry', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('continúa hacia SelectReason', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SelectCountry navigation={localNavigation} />);

    fireEvent.press(getByTestId('continueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SelectReason);
  });

  it('permite abrir el selector de pais sin romper la UI', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SelectCountry navigation={localNavigation} />);

    expect(() => fireEvent.press(getByTestId('countrySelectButton'))).not.toThrow();
    expect(getByTestId('countrySelectionModal')).toBeTruthy();
  });
});
