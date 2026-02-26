import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import UploadCardImage from '../../../../src/components/common/UploadCardImage';
import {renderWithProviders} from '../../../setup/test-utils';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({granted: true})),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{uri: 'file://gallery.jpg'}],
  })),
  requestCameraPermissionsAsync: jest.fn(async () => ({granted: true})),
  launchCameraAsync: jest.fn(async () => ({
    assets: [{uri: 'file://camera.jpg'}],
  })),
  CameraType: {back: 'back'},
}));

describe('UploadCardImage', () => {
  it('permite seleccionar desde cÃ¡mara y galerÃ­a', async () => {
    const setImage = jest.fn();
    const {getByTestId} = renderWithProviders(
      <UploadCardImage label="Foto" setImage={setImage} testID="uploadCard" />,
    );

    fireEvent.press(getByTestId('uploadCard_imageBox'));
    await waitFor(() => expect(setImage).toHaveBeenCalled());

    fireEvent.press(getByTestId('uploadCard_photoButton'));
    await waitFor(() => expect(setImage).toHaveBeenCalled());
  });
});
