/**
 * Mock for Navigation
 */

export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => false),
  getId: jest.fn(() => 'mock-screen-id'),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    key: 'mock-state-key',
    index: 0,
    routeNames: ['MockScreen'],
    routes: [{ key: 'mock-route-key', name: 'MockScreen' }],
  })),
};

export const mockRoute = {
  key: 'mock-route-key',
  name: 'MockScreen',
  params: {},
};

export const mockNavigationContainer = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  resetRoot: jest.fn(),
  getRootState: jest.fn(),
  getCurrentRoute: jest.fn(),
  getCurrentOptions: jest.fn(),
  isReady: jest.fn(() => true),
};
