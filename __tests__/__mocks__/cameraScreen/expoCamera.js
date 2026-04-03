const React = require('react');
const {View} = require('react-native');

const takePictureAsyncMock = jest.fn(() =>
  Promise.resolve({
    uri: 'file://mock-photo-path.jpg',
    width: 1200,
    height: 900,
  }),
);

const CameraView = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    takePictureAsync: takePictureAsyncMock,
  }));

  return React.createElement(View, {
    ...props,
    testID: props.testID || 'mockCamera',
  });
});

const requestPermissionMock = jest.fn(async () => ({granted: true, status: 'granted'}));
const useCameraPermissions = jest.fn(() => [
  {granted: true, status: 'granted'},
  requestPermissionMock,
]);

const Camera = {
  getCameraPermissionsAsync: jest.fn(async () => ({granted: true, status: 'granted'})),
  isAvailableAsync: jest.fn(async () => true),
};

// Compat aliases to reduce breakage in older tests still using vision-camera names.
const useCameraPermission = jest.fn(() => ({
  permission: {granted: true, status: 'granted'},
  requestPermission: requestPermissionMock,
}));
const useCameraDevice = jest.fn(() => ({id: 'mock-device'}));

module.exports = {
  __esModule: true,
  Camera,
  CameraView,
  useCameraPermissions,

  // Legacy exports kept intentionally for compatibility.
  useCameraDevice,
  useCameraPermission,
  __takePictureAsyncMock: takePictureAsyncMock,
  __takePhotoMock: takePictureAsyncMock,
  __requestPermissionMock: requestPermissionMock,
};
