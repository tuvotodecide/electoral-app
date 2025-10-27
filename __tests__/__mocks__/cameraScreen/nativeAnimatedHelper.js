module.exports = {
  default: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
  NativeAnimatedModule: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    startAnimatingNode: jest.fn(),
    setValue: jest.fn(),
    stopAnimation: jest.fn(),
  },
};
