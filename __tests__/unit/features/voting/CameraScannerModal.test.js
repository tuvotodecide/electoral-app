import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import CameraScannerModal from '../../../../src/features/voting/components/CameraScannerModal';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector =>
    selector({
      theme: {
        theme: {
          background: '#FFFFFF',
          primary: '#41A44D',
          text: '#111111',
          white: '#FFFFFF',
        },
      },
    }),
  ),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');

  return {
    CameraView: ({onBarcodeScanned, barcodeScannerSettings}) => (
      <TouchableOpacity
        testID="mockCameraView"
        onPress={() => onBarcodeScanned?.({data: 'pqs.controlled-token'})}>
        <Text>{barcodeScannerSettings?.barcodeTypes?.join(',')}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCText = ({children, style}) => <Text style={style}>{children}</Text>;
  return MockCText;
});

describe('CameraScannerModal MX-09', () => {
  it('KIO-SCN-P0-002 KIO-SEC-P0-001 | solicita permiso de camara sin abrir lector real ni exponer token', () => {
    const onClose = jest.fn();
    const onRequestPermission = jest.fn();
    const onBarcodeScanned = jest.fn();

    const screen = render(
      <CameraScannerModal
        visible
        hasPermission={false}
        onClose={onClose}
        onRequestPermission={onRequestPermission}
        onBarcodeScanned={onBarcodeScanned}
      />,
    );

    expect(screen.getByText('Permiso de cámara requerido')).toBeTruthy();
    expect(screen.queryByTestId('mockCameraView')).toBeNull();

    fireEvent.press(screen.getByTestId('cameraModalPermissionButton'));
    expect(onRequestPermission).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('cameraModalCloseButton'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onBarcodeScanned).not.toHaveBeenCalled();
    expect(JSON.stringify(screen.toJSON())).not.toContain('pqs.controlled-token');
  });

  it('KIO-SCN-P0-002 KIO-SCN-P0-005 KIO-SEC-P0-003 | procesa QR controlado cuando el permiso existe', () => {
    const onBarcodeScanned = jest.fn();

    const screen = render(
      <CameraScannerModal
        visible
        hasPermission
        onClose={jest.fn()}
        onBarcodeScanned={onBarcodeScanned}
      />,
    );

    expect(screen.getByTestId('mockCameraView')).toBeTruthy();
    fireEvent.press(screen.getByTestId('mockCameraView'));

    expect(onBarcodeScanned).toHaveBeenCalledWith({data: 'pqs.controlled-token'});
  });
});
