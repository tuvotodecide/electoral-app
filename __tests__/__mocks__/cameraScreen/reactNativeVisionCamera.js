const React = require('react');
const {View} = require('react-native');

const takePhotoMock = jest.fn(() => Promise.resolve({path: 'mock-photo-path.jpg'}));

const Camera = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    takePhoto: takePhotoMock,
  }));

  return React.createElement(View, {
    ...props,
    testID: props.testID || 'mockCamera',
  });
});

const useCameraDevice = jest.fn(() => ({
  id: 'mock-device',
  formats: [{photoWidth: 4000, photoHeight: 3000}],
}));

const useCameraPermission = jest.fn(() => ({
  hasPermission: true,
  requestPermission: jest.fn(async () => true),
}));

module.exports = {
  __esModule: true,
  Camera,
  useCameraDevice,
  useCameraPermission,
  __takePhotoMock: takePhotoMock,
};
