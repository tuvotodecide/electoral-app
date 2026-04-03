module.exports = {
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: null,
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
  }),
  CameraType: {
    back: 'back',
    front: 'front',
  }
};
