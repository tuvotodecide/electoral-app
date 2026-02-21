import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import {BankingData} from '../../../../src/api/constant';
import SelectReason from '../../../../src/container/Auth/SelectReason';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SelectReason', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('continúa hacia CreatePin después de elegir un motivo', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SelectReason navigation={localNavigation} />);

    const firstOptionName = BankingData[0].name.replace(/\s+/g, '_').toLowerCase();
    fireEvent.press(getByTestId(`selectReasonOption_${firstOptionName}`));
    fireEvent.press(getByTestId('selectReasonContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.CreatePin);
  });
});
