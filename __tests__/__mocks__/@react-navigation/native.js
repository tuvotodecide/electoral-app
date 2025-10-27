// Mock para @react-navigation/native
const createNavigation = () => ({
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

const useNavigation = jest.fn(() => createNavigation());

const NavigationContainer = ({children}) => children;

const useFocusEffect = jest.fn();

const useRoute = jest.fn(() => ({
  params: {},
  key: 'mockKey',
  name: 'MockScreen',
}));

module.exports = {
  __esModule: true,
  useNavigation,
  NavigationContainer,
  useFocusEffect,
  useRoute,
  default: {
    useNavigation,
    NavigationContainer,
    useFocusEffect,
    useRoute,
  },
};
