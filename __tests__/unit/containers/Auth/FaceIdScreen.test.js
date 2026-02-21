import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import FaceIdScreen from '../../../../src/container/Auth/FaceIdScreen';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('FaceIdScreen', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('redirige a FingerPrintScreen al habilitar y al omitir', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<FaceIdScreen navigation={localNavigation} />);

    fireEvent.press(getByTestId('enableFaceIdButton'));
    fireEvent.press(getByTestId('skipFaceIdButton'));

    expect(localNavigation.navigate).toHaveBeenNthCalledWith(1, AuthNav.FingerPrintScreen);
    expect(localNavigation.navigate).toHaveBeenNthCalledWith(2, AuthNav.FingerPrintScreen);
  });
});
