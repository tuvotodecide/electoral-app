const {useSelector} = require('react-redux');
const {useNavigation, useRoute} = require('@react-navigation/native');

const themeState = {
  theme: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#888888',
    primary: '#4F9858',
  },
};

const buildMockRoute = (overrides = {}) => ({
  params: {
    photoUri: 'file:///test/photo.jpg',
    tableData: {
      tableNumber: '45',
      numero: '45',
      number: '45',
      recinto: 'Colegio Central',
    },
    ...overrides,
  },
});

const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
});

const setupPhotoReviewBaseMocks = ({navigation = createMockNavigation(), routeOverrides = {}} = {}) => {
  useSelector.mockImplementation(selector => selector({theme: themeState}));
  useNavigation.mockReturnValue(navigation);
  useRoute.mockReturnValue(buildMockRoute(routeOverrides));
  return {navigation};
};

module.exports = {
  themeState,
  buildMockRoute,
  createMockNavigation,
  setupPhotoReviewBaseMocks,
};
