import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import FingerPrintScreen from '../../../../src/container/Auth/FingerPrintScreen';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('FingerPrintScreen', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('redirige a SelectCountry al habilitar y al omitir', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<FingerPrintScreen navigation={localNavigation} />);

    fireEvent.press(getByTestId('enableFingerprintButton'));
    fireEvent.press(getByTestId('skipFingerprintButton'));

    expect(localNavigation.navigate).toHaveBeenNthCalledWith(1, AuthNav.SelectCountry);
    expect(localNavigation.navigate).toHaveBeenNthCalledWith(2, AuthNav.SelectCountry);
  });
});
