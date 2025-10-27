const addListener = jest.fn(callback => {
  callback?.({isConnected: true, isInternetReachable: true});
  return jest.fn();
});

module.exports = {
  __esModule: true,
  default: {
    addEventListener: addListener,
  },
};
