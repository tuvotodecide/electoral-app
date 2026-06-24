import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import UploadCardImage from '../../../../src/components/common/UploadCardImage';
import {renderWithProviders} from '../../../setup/test-utils';

const mockTakePictureAsync = jest.fn(async () => ({uri: 'file://camera.jpg'}));

jest.mock('expo-camera', () => ({
  CameraView: require('react').forwardRef(function CameraMock(props, ref) {
    const React = require('react');
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: mockTakePictureAsync,
    }));
    React.useEffect(() => {
      props.onCameraReady?.();
    }, []);
    return null;
  }),
  useCameraPermissions: jest.fn(() => [{granted: true}, jest.fn()]),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({granted: true})),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{uri: 'file://gallery.jpg'}],
  })),
}));

describe('UploadCardImage', () => {
  it('permite seleccionar desde cámara y galería', async () => {
    const setImage = jest.fn();
    const {getByTestId} = renderWithProviders(
      <UploadCardImage label="Foto" setImage={setImage} testID="uploadCard" />,
    );

    // Open the in-app camera modal and capture
    fireEvent.press(getByTestId('uploadCard_imageBox'));
    await waitFor(() => expect(getByTestId('uploadCard_captureButton')).toBeTruthy());
    fireEvent.press(getByTestId('uploadCard_captureButton'));
    await waitFor(() => expect(setImage).toHaveBeenCalledWith({uri: 'file://camera.jpg'}));

    // Gallery still uses expo-image-picker
    fireEvent.press(getByTestId('uploadCard_photoButton'));
    await waitFor(() => expect(setImage).toHaveBeenCalledWith(
      expect.objectContaining({uri: 'file://gallery.jpg'}),
    ));
  });
});
