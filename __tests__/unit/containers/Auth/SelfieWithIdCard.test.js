import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import SelfieWithIdCard from '../../../../src/container/Auth/SelfieWithIdCard';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('SelfieWithIdCard', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('continua hacia VerifySuccess', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SelfieWithIdCard navigation={localNavigation} />);

    fireEvent.press(getByTestId('selfieWithIdCardContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.VerifySuccess);
  });

  it('permite presionar la imagen para abrir modal sin romper la UI', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<SelfieWithIdCard navigation={localNavigation} />);

    expect(() => fireEvent.press(getByTestId('selfieWithIdCardImageButton'))).not.toThrow();
    expect(getByTestId('selfieWithIdCardModal')).toBeTruthy();
  });
});
