// ==================== MOCKS ====================

// Mock básicos
jest.mock('axios');
jest.mock('../../../src/hooks/useSearchTableLogic');
jest.mock('../../../src/data/mockMesas', () => ({
  fetchMesas: jest.fn(),
  fetchActasByMesa: jest.fn(),
}));

// Mock StyleSheet para evitar errores de React Native
jest.mock('react-native', () => ({
  StyleSheet: {
    create: jest.fn(styles => styles),
    hairlineWidth: 1,
    flatten: jest.fn(styles => styles),
  },
  Dimensions: {
    get: jest.fn(() => ({width: 375, height: 667})),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    roundToNearestPixel: jest.fn(x => Math.round(x)),
  },
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
  ActivityIndicator: 'ActivityIndicator',
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
}));

// Mock de archivos que usan StyleSheet
jest.mock('../../../src/themes/flex', () => ({}));
jest.mock('../../../src/themes/index', () => ({
  flex: {},
  colors: {},
}));

jest.mock('../../../src/components/common/CSafeAreaView', () => 'CSafeAreaView');
jest.mock('../../../src/components/common/BaseSearchTableScreen', () => 'BaseSearchTableScreen');
jest.mock('../../../src/components/common/CustomModal', () => 'CustomModal');
jest.mock('../../../src/components/common/CText', () => 'CText');

jest.mock('../../../src/styles/searchTableStyles', () => ({
  createSearchTableStyles: jest.fn(() => ({})),
}));

jest.mock('../../../src/common/constants', () => ({
  deviceWidth: 375,
  deviceHeight: 667,
}));

jest.mock('../../../src/i18n/String', () => ({
  searchTable: 'Buscar Mesa',
  loadingTables: 'Cargando mesas...',
  accept: 'Aceptar',
}));

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
}), {virtual: true});

jest.mock('../../../src/navigation/NavigationKey', () => ({
  StackNav: {
    WhichIsCorrectScreen: 'WhichIsCorrectScreen',
    TableDetail: 'TableDetail',
  },
}));

import React from 'react';
import axios from 'axios';
import {useSearchTableLogic} from '../../../src/hooks/useSearchTableLogic';
import {createSearchTableStyles} from '../../../src/styles/searchTableStyles';
import {fetchMesas} from '../../../src/data/mockMesas';

// Referencias a mocks
const mockedAxios = axios;
const mockUseSearchTableLogic = useSearchTableLogic;
const mockCreateSearchTableStyles = createSearchTableStyles;
const mockFetchMesas = fetchMesas;

// Helpers
const createMockLocationData = (overrides = {}) => ({
  locationId: 'test-location-id',
  name: 'Test Location',
  address: 'Test Address 123',
  ...overrides,
});

const createMockRoute = (params = {}) => ({
  params,
  key: 'test-key',
  name: 'UnifiedTableScreen',
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};
