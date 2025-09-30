const {useSelector} = require('react-redux');
const {useNavigation, useRoute} = require('@react-navigation/native');

const baseTheme = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#888888',
  primary: '#4F9858',
};

const buildRouteParams = overrides => ({
  recordId: 'record-01',
  photoUri: 'file:///record/photo.jpg',
  tableData: {
    tableNumber: '45',
    numero: '45',
    recinto: 'Colegio Central',
  },
  mesaInfo: {
    numero: '45',
    recinto: 'Colegio Central',
  },
  partyResults: [
    {id: 'unidad', partido: 'Unidad', presidente: '33', diputado: '29'},
  ],
  voteSummaryResults: [
    {id: 'validos', label: 'Válidos', value1: '150', value2: '100'},
  ],
  ...overrides,
});

const mockNavigation = overrides => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  ...overrides,
});

const mockRoute = overrides => {
  const params = buildRouteParams(overrides);
  useRoute.mockReturnValue({params});
  return params;
};

const mockThemeSelector = (themeOverrides = {}) => {
  const theme = {...baseTheme, ...themeOverrides};
  useSelector.mockImplementation(selector => selector({theme: {theme}}));
  return theme;
};

const resetNavigationMocks = (navigation = mockNavigation()) => {
  useNavigation.mockReturnValue(navigation);
  return navigation;
};

const flushPromises = () =>
  new Promise(resolve => {
    setImmediate(resolve);
  });

module.exports = {
  baseTheme,
  buildRouteParams,
  mockNavigation,
  mockRoute,
  mockThemeSelector,
  resetNavigationMocks,
  flushPromises,
};
