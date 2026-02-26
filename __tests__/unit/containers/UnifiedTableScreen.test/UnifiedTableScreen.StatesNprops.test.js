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
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  return ({name, testID, ...props}) =>
    React.createElement('Text', {testID: testID || `icon-${name}`, ...props}, name);
});
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({name, testID, ...props}) =>
    React.createElement('Text', {testID: testID || `icon-${name}`, ...props}, name);
});

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

describe('UnifiedTableScreen - Tests de Estados y Props', () => {
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

    // Mock fetchMesas con datos por defecto
    const { fetchMesas } = require('../../../../src/data/mockMesas');
    fetchMesas.mockResolvedValue(mockTablesData);

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

  describe('2. Tests de Estados y Props', () => {
    describe('2.1 Estado Inicial', () => {
      test('debe tener estado inicial correcto con datos en route', () => {
        const { getByTestId } = renderComponent();
        
        // Debe mostrar BaseSearchTableScreen inmediatamente cuando hay datos en route
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        expect(() => getByTestId('unifiedTableScreenLoadingContainer')).toThrow();
      });

      test('debe tener estado inicial de loading cuando no hay tablas en route', async () => {
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
        
        // Debe estar en estado de carga inicialmente
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
      });

      test('debe validar store de Redux disponible', () => {
        const { getByTestId } = renderComponent();
        
        // Debe renderizar sin errores con store mock
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
      });

      test('debe tener modal inicial cerrado', () => {
        const { getByTestId } = renderComponent();
        
        const modal = getByTestId('unifiedTableScreenModal');
        expect(modal.props.visible).toBe(false);
      });
    });

    describe('2.2 Cambios de Estado Dinámicos', () => {
      test('debe transicionar de loading a datos correctamente desde API', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockResolvedValue({
          data: {
            tables: mockTablesData
          }
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        // Inicialmente debe mostrar loading
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        
        // Después de cargar debe mostrar BaseSearchTableScreen
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });
      });

      test('debe transicionar de loading a datos vacíos desde API', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockResolvedValue({
          data: {
            tables: []
          }
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe manejar diferentes formatos de respuesta API', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        // Formato alternativo: data.data.tables
        mockedAxios.get.mockResolvedValue({
          data: {
            data: {
              tables: mockTablesData
            }
          }
        });
        
        const { getByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });
      });

      test('debe manejar timeout de API sin mostrar error', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockRejectedValue(new Error('timeout'));
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe mantener consistencia en re-renders', async () => {
        const { getByTestId, rerender } = renderComponent();
        
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        
        // Re-render no debe cambiar el estado
        rerender(
          <Provider store={mockStore}>
            <UnifiedTableScreen navigation={mockNavigation} route={mockRoute} />
          </Provider>
        );
        
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
      });
    });

    describe('2.3 Gestión de Estado Interno', () => {
      test('debe actualizar estado de mesas correctamente', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        const newTables = [
          { id: '3', numero: 'Mesa 3', codigo: '1236' },
          { id: '4', numero: 'Mesa 4', codigo: '1237' },
        ];

        mockedAxios.get.mockResolvedValue({
          data: { tables: newTables }
        });
        
        const { getByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(newTables);
        });
      });

      test('debe mantener locationData consistente', async () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const locationData = baseScreen.props.locationData;
        
        expect(locationData).toEqual({
          locationId: 'test-location-123',
          name: 'Escuela Test',
          address: 'Dirección Test 123',
          code: 'EST001',
          zone: 'Zona Test',
          district: 'Distrito Test',
        });
      });

      test('debe actualizar estado de loading correctamente', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        let resolvePromise;
        mockedAxios.get.mockImplementation(() => 
          new Promise(resolve => {
            resolvePromise = resolve;
          })
        );
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        // Inicialmente loading
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        
        // Resolver promesa
        act(() => {
          resolvePromise({ data: { tables: mockTablesData } });
        });
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });
      });
    });

    describe('2.4 Validación de Props', () => {
      test('debe pasar todas las props requeridas a BaseSearchTableScreen', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const props = baseScreen.props;
        
        // Verificar props obligatorias
        expect(props.testID).toBe('unifiedTableScreenBaseScreen');
        expect(props.colors).toBeDefined();
        expect(props.title).toBeDefined();
        expect(props.tables).toBeDefined();
        expect(props.onTablePress).toBeDefined();
        expect(props.searchPlaceholder).toBeDefined();
        expect(props.chooseTableText).toBeDefined();
        expect(props.locationText).toBeDefined();
        expect(props.onBack).toBeDefined();
        expect(props.onHomePress).toBeDefined();
        expect(props.onProfilePress).toBeDefined();
      });

      test('debe pasar props de búsqueda correctamente', () => {
        const mockSetSearchText = jest.fn();
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: 'test search',
          setSearchText: mockSetSearchText,
          handleBack: jest.fn(),
          handleNotificationPress: jest.fn(),
          handleHomePress: jest.fn(),
          handleProfilePress: jest.fn(),
        });
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.searchValue).toBe('test search');
        expect(baseScreen.props.onSearchChange).toBe(mockSetSearchText);
      });

      test('debe configurar props de layout correctamente', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.showLocationFirst).toBe(false);
        expect(baseScreen.props.showNotification).toBe(true);
        expect(baseScreen.props.locationIconColor).toBe('#0C5460');
      });

      test('debe pasar styles correctamente', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props).toBeDefined();
        });
      });
    });

    describe('2.5 Efectos y Lifecycle', () => {
      test('debe ejecutar efecto al cambiar locationId', async () => {
        const { rerender } = renderComponent();
        
        // Cambiar locationId en route
        const newRoute = {
          params: {
            locationId: 'new-location-456',
            locationData: {
              ...mockLocationData,
              locationId: 'new-location-456',
              tables: [],
            },
          },
        };

        mockedAxios.get.mockClear();
        mockedAxios.get.mockResolvedValue({
          data: { tables: [] }
        });
        
        rerender(
          <Provider store={mockStore}>
            <UnifiedTableScreen navigation={mockNavigation} route={newRoute} />
          </Provider>
        );
        
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.stringContaining(
              '/api/v1/geographic/electoral-tables?electoralLocationId=new-location-456',
            ),
            { timeout: 15000 }
          );
        });
      });

      test('debe manejar ausencia de route.params', () => {
        const emptyRoute = {};
        
        expect(() => renderComponent(emptyRoute)).not.toThrow();
      });
    });
  });
});
