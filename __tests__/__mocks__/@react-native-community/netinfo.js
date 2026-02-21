const addListener = jest.fn(callback => {
  callback?.({isConnected: true, isInternetReachable: true});
  return jest.fn();
});
const fetchState = jest.fn(() =>
  Promise.resolve({isConnected: true, isInternetReachable: true}),
);

module.exports = {
  __esModule: true,
  fetch: fetchState,
  default: {
    fetch: fetchState,
    addEventListener: addListener,
  },
};
