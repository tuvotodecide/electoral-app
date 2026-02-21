import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import {limpiarMocksFlujoBiometria} from './helpers/biometricDocumentFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import UploadPhotoId from '../../../../src/container/Auth/UploadPhotoId';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

describe('UploadPhotoId', () => {
  beforeEach(() => {
    limpiarMocksFlujoBiometria();
  });

  it('renderiza informacion de verificacion de identidad', () => {
    const {getByTestId} = renderWithProviders(<UploadPhotoId navigation={mockNavigation} />);

    expect(getByTestId('uploadPhotoIdContainer')).toBeTruthy();
    expect(getByTestId('uploadPhotoIdImage')).toBeTruthy();
    expect(getByTestId('uploadPhotoIdTitle')).toBeTruthy();
    expect(getByTestId('uploadPhotoIdDescription')).toBeTruthy();
  });

  it('continua hacia SelfieWithIdCard', () => {
    const localNavigation = {...mockNavigation, navigate: jest.fn()};
    const {getByTestId} = renderWithProviders(<UploadPhotoId navigation={localNavigation} />);

    fireEvent.press(getByTestId('uploadPhotoIdContinueButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SelfieWithIdCard);
  });
});
