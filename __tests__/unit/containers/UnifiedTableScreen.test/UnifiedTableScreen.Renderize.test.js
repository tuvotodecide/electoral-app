import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { Platform } from 'react-native';
import axios from 'axios';

import UnifiedTableScreen from '../../../../src/container/Vote/UnifiedTableScreen';
import { StackNav } from '../../../../src/navigation/NavigationKey';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock strings
jest.mock('../../../../src/i18n/String', () => require('../../../__mocks__/String').default);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context');

// Mock navigation
jest.mock('@react-navigation/native');

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MockedMaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'MockedIonicons');

// Mock custom components
jest.mock('../../../../src/components/common/BaseSearchTableScreen', () => 
  require('../../../__mocks__/components/common/BaseSearchTableScreen')
);
jest.mock('../../../../src/components/common/CText', () => 
  require('../../../__mocks__/components/common/CText')
);
jest.mock('../../../../src/components/common/CustomModal', () => 
  require('../../../__mocks__/components/common/CustomModal')
);

// Mock hooks
jest.mock('../../../../src/hooks/useSearchTableLogic', () => 
  require('../../../__mocks__/hooks/useSearchTableLogic')
);

// Mock styles
jest.mock('../../../../src/styles/searchTableStyles', () => 
  require('../../../__mocks__/styles/searchTableStyles')
);

// Mock data
jest.mock('../../../../src/data/mockMesas', () => 
  require('../../../__mocks__/data/mockMesas')
);

// Mock environment variable
jest.mock('@env', () => require('../../../__mocks__/@env'));

// Create a simple mock store using Redux Toolkit
const createMockStore = () => {
  const { configureStore } = require('@reduxjs/toolkit');
  
  return configureStore({
    reducer: {
      theme: (state = { 
        theme: {
          background: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666',
          primary: '#4F9858',
          primaryLight: '#E8F5E8',
        } 
      }) => state,
    },
    preloadedState: {
      theme: {
        theme: {
          background: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666',
          primary: '#4F9858',
          primaryLight: '#E8F5E8',
        }
      }
    }
  });
};

// Mock data
const mockTablesData = [
  {
    id: '1',
    tableNumber: 'Mesa 1',
    tableCode: '1234',
    numero: 'Mesa 1',
    codigo: '1234',
    name: 'Mesa 1',
    code: '1234',
  },
  {
    id: '2',
    tableNumber: 'Mesa 2',
    tableCode: '1235',
    numero: 'Mesa 2',
    codigo: '1235',
    name: 'Mesa 2',
    code: '1235',
  },
  {
    id: '3',
    tableNumber: 'Mesa 3',
    tableCode: '1236',
    numero: 'Mesa 3',
    codigo: '1236',
    name: 'Mesa 3',
    code: '1236',
  }
];

const mockLocationData = {
  locationId: 'test-location-123',
  name: 'Escuela Test',
  address: 'Dirección Test 123',
  code: 'EST001',
  zone: 'Zona Test',
  district: 'Distrito Test',
  tables: mockTablesData,
};

// Mock navigation object
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(() => jest.fn()),
};

// Mock route object
const mockRoute = {
  params: {
    locationId: 'test-location-123',
    locationData: mockLocationData,
  },
};

describe('UnifiedTableScreen - Tests de Renderizado', () => {
  let mockStore;

  // Helper function to render component
  const renderComponent = (routeParams = mockRoute) => {
    return render(
      <Provider store={mockStore}>
        <UnifiedTableScreen navigation={mockNavigation} route={routeParams} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
    
    // Configuración por defecto de axios
    mockedAxios.get.mockResolvedValue({
      data: {
        tables: mockTablesData
      }
    });

    // Mock navigation
    require('@react-navigation/native').useNavigation = jest.fn(() => mockNavigation);

    // Mock useSearchTableLogic
    const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
    useSearchTableLogic.mockReturnValue({
      colors: {
        primary: '#4F9858',
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primaryLight: '#E8F5E8',
      },
      searchText: '',
      setSearchText: jest.fn(),
      handleBack: jest.fn(),
      handleNotificationPress: jest.fn(),
      handleHomePress: jest.fn(),
      handleProfilePress: jest.fn(),
    });
  });

  describe('1. Tests de Renderizado Inicial', () => {
    describe('1.1 Estado de Carga', () => {
      test('debe mostrar loading indicator al inicio cuando no hay datos en route', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [], // Sin tablas para forzar carga desde API
            },
          },
        };

        mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
        
        const { getByTestId } = renderComponent(routeWithoutTables);
        
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        expect(getByTestId('unifiedTableScreenLoadingIndicator')).toBeTruthy();
      });

      test('debe mostrar texto de carga apropiado', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent(routeWithoutTables);
        
        const loadingText = getByTestId('unifiedTableScreenLoadingText');
        expect(loadingText.props.children).toBe('Cargando mesas...');
      });

      test('debe mostrar loading container con estilo correcto', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent(routeWithoutTables);
        
        const loadingContainer = getByTestId('unifiedTableScreenLoadingContainer');
        expect(loadingContainer.props.style).toEqual({
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        });
      });
    });

    describe('1.2 Renderizado con Datos Precargados', () => {
      test('debe renderizar BaseSearchTableScreen cuando hay datos en route', () => {
        const { getByTestId } = renderComponent();
        
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
      });

      test('debe pasar el título correcto al BaseSearchTableScreen', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.title).toBe(mockLocationData.name);
      });

      test('debe pasar las mesas correctamente al BaseSearchTableScreen', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.tables).toEqual(mockTablesData);
      });

      test('debe pasar los datos de ubicación correctamente', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.locationData).toEqual({
          locationId: 'test-location-123',
          name: 'Escuela Test',
          address: 'Dirección Test 123',
          code: 'EST001',
          zone: 'Zona Test',
          district: 'Distrito Test',
        });
      });

      test('debe configurar correctamente las props de búsqueda', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.searchPlaceholder).toBe('Buscar mesa por número o código...');
        expect(baseScreen.props.chooseTableText).toBe('Por favor, elige una mesa');
      });

      test('debe configurar correctamente las props de ubicación', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.locationText).toBe('Lista basada en ubicación');
        expect(baseScreen.props.locationIconColor).toBe('#0C5460');
        expect(baseScreen.props.showLocationFirst).toBe(false);
      });

      test('debe habilitar notificaciones', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.showNotification).toBe(true);
      });
    });

    describe('1.3 Renderizado con Route Vacío', () => {
      test('debe manejar route sin params', () => {
        const emptyRoute = {};
        
        const { getByTestId } = renderComponent(emptyRoute);
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.title).toBe('Buscar Mesa');
        expect(baseScreen.props.tables).toEqual([]);
      });

      test('debe manejar route con locationData incompleto', async () => {
        const incompleteRoute = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              name: 'Solo Nombre',
              tables: [], // Sin tablas para forzar carga desde API
            },
          },
        };

        // Mock axios para que resuelva rápido
        mockedAxios.get.mockResolvedValue({
          data: { tables: [] }
        });
        
        const { getByTestId } = renderComponent(incompleteRoute);
        
        // Esperar a que termine la carga
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.locationData.name).toBe('Solo Nombre');
          expect(baseScreen.props.locationData.address).toBeUndefined();
        });
      });

      test('debe usar valores por defecto cuando faltan datos', async () => {
        const emptyRoute = {
          params: {},
        };

        // Mock axios para manejar la ausencia de locationId
        mockedAxios.get.mockResolvedValue({
          data: { tables: [] }
        });
        
        const { getByTestId } = renderComponent(emptyRoute);
        
        // Esperar a que termine el proceso asíncrono
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.title).toBe('Buscar Mesa');
          expect(baseScreen.props.tables).toEqual([]);
          // locationData es un objeto con propiedades undefined, no null
          expect(baseScreen.props.locationData).toEqual({
            locationId: undefined,
            name: undefined,
            address: undefined,
            code: undefined,
            zone: undefined,
            district: undefined,
          });
        });
      });
    });

    describe('1.4 Renderizado del Modal', () => {
      test('debe renderizar CustomModal con props por defecto', () => {
        const { getByTestId } = renderComponent();
        
        const modal = getByTestId('unifiedTableScreenModal');
        expect(modal).toBeTruthy();
        expect(modal.props.visible).toBe(false);
        expect(modal.props.type).toBe('info');
        expect(modal.props.buttonText).toBe('Aceptar');
      });

      test('debe pasar onClose correctamente al modal', () => {
        const { getByTestId } = renderComponent();
        
        const modal = getByTestId('unifiedTableScreenModal');
        expect(typeof modal.props.onClose).toBe('function');
      });
    });

    describe('1.5 Integración de Hooks', () => {
      test('debe usar useSearchTableLogic correctamente', () => {
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        
        renderComponent();
        
        expect(useSearchTableLogic).toHaveBeenCalled();
      });

      test('debe pasar las funciones del hook al BaseSearchTableScreen', () => {
        const mockHandleBack = jest.fn();
        const mockHandleNotificationPress = jest.fn();
        
  const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
  useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: 'test search',
          setSearchText: jest.fn(),
          handleBack: mockHandleBack,
          handleNotificationPress: mockHandleNotificationPress,
          handleHomePress: jest.fn(),
          handleProfilePress: jest.fn(),
        });
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.onBack).toBe(mockHandleBack);
        expect(baseScreen.props.onNotificationPress).toBe(mockHandleNotificationPress);
        expect(baseScreen.props.searchValue).toBe('test search');
      });
    });
  });
});