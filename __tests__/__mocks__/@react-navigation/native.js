// Mock para @react-navigation/native
export const useNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(),
  getParent: jest.fn(),
});

export const NavigationContainer = ({ children }) => children;

export const useFocusEffect = (callback) => {
  // Mock implementation for useFocusEffect
};

export const useRoute = () => ({
  params: {},
  key: 'mockKey',
  name: 'MockScreen',
});

export default {
  useNavigation,
  NavigationContainer,
  useFocusEffect,
  useRoute,
};
