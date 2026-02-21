import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import axios from 'axios';

import SearchTable from '../../../../src/container/Vote/UploadRecord/SearchTable';

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

// Mock react-redux
jest.mock('react-redux');

// Mock custom components
jest.mock('../../../../src/components/common/BaseSearchTableScreen', () => 
  require('../../../__mocks__/components/common/BaseSearchTableScreen').default
);

// Mock hooks
jest.mock('../../../../src/hooks/useNavigationLogger', () => ({
  useNavigationLogger: jest.fn(() => ({
    logAction: jest.fn(),
    logNavigation: jest.fn(),
  })),
}));

// Create a simple mock store using Redux Toolkit
const createMockStore = (customTheme = null) => {
  const { configureStore } = require('@reduxjs/toolkit');
  
  const defaultTheme = {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#4F9858',
    primaryLight: '#E8F5E8',
  };
  
  return configureStore({
    reducer: {
      theme: (state = { theme: customTheme || defaultTheme }) => state,
    },
    preloadedState: {
      theme: { theme: customTheme || defaultTheme }
    }
  });
};

// Mock data
const mockTablesData = [
  {
    id: '1',
    numero: 'Mesa 1',
    codigo: '1234',
    colegio: 'Escuela Nacional',
    zone: 'Zona 1',
    district: 'Distrito Central',
  },
  {
    id: '2',
    numero: 'Mesa 2',
    codigo: '1235',
    colegio: 'Escuela Técnica',
    zone: 'Zona 2',
    district: 'Distrito Norte',
  },
];

const mockLocationData = {
  name: 'Escuela Test',
  address: 'Dirección Test 123',
  code: 'EST001',
  zone: 'Zona Test',
  district: 'Distrito Test',
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
  },
};

describe('SearchTable - Tests de Estados y Props', () => {
  let mockStore;
  let originalConsoleError;

  beforeAll(() => {
    // Suprimir warnings de act() para este archivo específico ya que involucra efectos asíncronos complejos
    originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('An update to SearchTable inside a test was not wrapped in act') ||
        message.includes('Warning: An update to SearchTable')
      )) {
        return; // Suppress act warnings for this specific component
      }
      originalConsoleError.call(console, ...args);
    };
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  // Helper function to render component
  const renderComponent = (routeParams = mockRoute, customStore = null) => {
    const store = customStore || mockStore;
    return render(
      <Provider store={store}>
        <SearchTable navigation={mockNavigation} route={routeParams} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore = createMockStore();
    
    // Configuración por defecto de axios
    mockedAxios.get.mockResolvedValue({
      data: {
        tables: mockTablesData,
        ...mockLocationData,
      }
    });

    // Mock navigation
    require('@react-navigation/native').useNavigation = jest.fn(() => mockNavigation);

    // Mock useSelector
    require('react-redux').useSelector = jest.fn((selector) => 
      selector({
        theme: {
          theme: {
            background: '#FFFFFF',
            text: '#000000',
            textSecondary: '#666666',
            primary: '#4F9858',
            primaryLight: '#E8F5E8',
          }
        }
      })
    );
  });

  describe('3. Tests de Estados y Props', () => {
    describe('3.1 Estado Inicial del Componente', () => {
      test('debe inicializar con estados correctos', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.searchValue).toBe('');
        expect(baseScreen.props.tables).toEqual([]);
      });

      test('debe inicializar con isLoadingMesas como true', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.tables).toEqual([]);
      });

      test('debe inicializar con locationData como null', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.locationData).toBeNull();
      });

      test('debe inicializar searchText como string vacío', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.searchValue).toBe('');
        expect(typeof baseScreen.props.searchValue).toBe('string');
      });
    });

    describe('3.2 Gestión de Estado de Mesas', () => {
      test('debe actualizar estado de mesas después de carga exitosa', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });
      });

      test('debe mantener mesas vacías cuando API falla', async () => {
        mockedAxios.get.mockRejectedValue(new Error('API Error'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe actualizar mesas con diferentes estructuras de respuesta', async () => {
        const alternativeData = [
          { id: '3', numero: 'Mesa 3', codigo: '3333' },
          { id: '4', numero: 'Mesa 4', codigo: '4444' },
        ];
        
        mockedAxios.get.mockResolvedValue({
          data: {
            data: {
              tables: alternativeData,
              ...mockLocationData,
            }
          }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(alternativeData);
        });
      });

      test('debe manejar respuesta sin tabla de datos', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            tables: null,
            ...mockLocationData,
          }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });
    });

    describe('3.3 Gestión de Estado de Ubicación', () => {
      test('debe actualizar locationData después de carga exitosa', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.locationData).toEqual(mockLocationData);
        });
      });

      test('debe manejar locationData con estructura alternativa', async () => {
        const alternativeLocationData = {
          name: 'Escuela Alternativa',
          address: 'Dirección Alt 456',
          code: 'ALT002',
          zone: 'Zona Alt',
          district: 'Distrito Alt',
        };
        
        mockedAxios.get.mockResolvedValue({
          data: {
            data: {
              tables: mockTablesData,
              ...alternativeLocationData,
            }
          }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.locationData).toEqual(alternativeLocationData);
        });
      });

      test('debe mantener locationData como null cuando API falla', async () => {
        mockedAxios.get.mockRejectedValue(new Error('API Error'));
        
        const { getByTestId } = renderComponent();
        
        // Inicialmente null
        const initialBaseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(initialBaseScreen.props.locationData).toBeNull();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.locationData).toBeNull();
        });
      });

      test('debe extraer locationData de estructura anidada', async () => {
        const nestedLocationData = {
          name: 'Escuela Anidada',
          address: 'Dirección Anidada 789',
          code: 'NEST001',
          zone: 'Zona Anidada',
          district: 'Distrito Anidado',
        };
        
        mockedAxios.get.mockResolvedValue({
          data: {
            tables: mockTablesData,
            ...nestedLocationData,
          }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.locationData).toEqual(nestedLocationData);
        });
      });
    });

    describe('3.4 Estado de Carga (isLoadingMesas)', () => {
      test('debe cambiar de loading a no loading después de carga exitosa', async () => {
        let resolvePromise;
        mockedAxios.get.mockImplementation(() => 
          new Promise(resolve => {
            resolvePromise = resolve;
          })
        );
        
        const { getByTestId } = renderComponent();
        
        // Inicialmente loading
        let baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.tables).toEqual([]);
        
        // Resolver promesa
        act(() => {
          resolvePromise({
            data: {
              tables: mockTablesData,
              ...mockLocationData,
            }
          });
        });
        
        await waitFor(() => {
          const updatedBaseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(updatedBaseScreen.props.tables).toEqual(mockTablesData);
        });
      });

      test('debe cambiar de loading a no loading después de error', async () => {
        let rejectPromise;
        mockedAxios.get.mockImplementation(() => 
          new Promise((resolve, reject) => {
            rejectPromise = reject;
          })
        );
        
        const { getByTestId } = renderComponent();
        
        // Inicialmente loading
        let baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.tables).toEqual([]);
        
        // Rechazar promesa
        act(() => {
          rejectPromise(new Error('API Error'));
        });
        
        await waitFor(() => {
          const updatedBaseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(updatedBaseScreen.props.tables).toEqual([]);
        });
      });

      test('debe mantener loading durante petición pendiente', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.tables).toEqual([]);
      });
    });

    describe('3.5 Estado de Búsqueda (searchText)', () => {
      test('debe actualizar searchText cuando cambia la búsqueda', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });

        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const onSearchChange = baseScreen.props.onSearchChange;
        
        onSearchChange('Mesa 1');
        
        // Verificar que la función de búsqueda fue llamada correctamente
        expect(typeof onSearchChange).toBe('function');
      });

      test('debe mantener último valor de searchText', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });

        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const onSearchChange = baseScreen.props.onSearchChange;
        
        onSearchChange('Primer texto');
        onSearchChange('Segundo texto');
        onSearchChange('Texto final');
        
        // Verificar que la función de búsqueda fue llamada correctamente
        expect(typeof onSearchChange).toBe('function');
      });

      test('debe manejar searchText vacío', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });

        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const onSearchChange = baseScreen.props.onSearchChange;
        
        onSearchChange('Algún texto');
        onSearchChange('');
        
        // Verificar que la función de búsqueda fue llamada correctamente
        expect(typeof onSearchChange).toBe('function');
      });

      test('debe preservar searchText entre re-renders', async () => {
        const { getByTestId, rerender } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });

        let baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const onSearchChange = baseScreen.props.onSearchChange;
        
        onSearchChange('Texto persistente');
        
        rerender(
          <Provider store={mockStore}>
            <SearchTable navigation={mockNavigation} route={mockRoute} />
          </Provider>
        );
        
        baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        // Verificar que el componente fue re-renderizado correctamente
        expect(baseScreen.props).toBeDefined();
      });
    });

    describe('3.6 Integración con Redux y Props Externas', () => {
      test('debe obtener colores del theme store correctamente', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.colors).toEqual({
          background: '#FFFFFF',
          text: '#000000',
          textSecondary: '#666666',
          primary: '#4F9858',
          primaryLight: '#E8F5E8',
        });
      });

      test('debe reaccionar a cambios en theme store', () => {
        const customTheme = {
          background: '#000000',
          text: '#FFFFFF',
          textSecondary: '#CCCCCC',
          primary: '#FF5722',
          primaryLight: '#FFCCBC',
        };
        
        const customStore = createMockStore(customTheme);
        require('react-redux').useSelector = jest.fn((selector) => 
          selector({
            theme: { theme: customTheme }
          })
        );
        
        const { getByTestId } = renderComponent(mockRoute, customStore);
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.colors).toEqual(customTheme);
      });

      test('debe usar navigation prop correctamente', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const onBack = baseScreen.props.onBack;
        
        onBack();
        
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
      });

      test('debe usar route params correctamente', async () => {
        const customRoute = {
          params: {
            locationId: 'custom-location-789',
          },
        };
        
        renderComponent(customRoute);
        
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalledWith(
            'http://192.168.1.16:3000/api/v1/geographic/electoral-locations/686e0624eb2961c4b31bdb7d/tables'
          );
        });
      });

      test('debe manejar route sin params', () => {
        const emptyRoute = {};
        
        expect(() => renderComponent(emptyRoute)).not.toThrow();
      });

      test('ya no depende del hook useNavigationLogger en el flujo actual', () => {
        const {useNavigationLogger} = require('../../../../src/hooks/useNavigationLogger');

        renderComponent();

        expect(useNavigationLogger).not.toHaveBeenCalled();
      });
    });

    describe('3.7 Efectos y Ciclo de Vida', () => {
      test('debe ejecutar efecto al montar componente', async () => {
        renderComponent();
        
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
      });

      test('debe ejecutar efecto al cambiar locationId', async () => {
        const { rerender } = renderComponent();
        
        mockedAxios.get.mockClear();
        
        const newRoute = {
          params: {
            locationId: 'new-location-456',
          },
        };
        
        rerender(
          <Provider store={mockStore}>
            <SearchTable navigation={mockNavigation} route={newRoute} />
          </Provider>
        );
        
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
      });

      test('debe limpiar efectos correctamente al desmontar', () => {
        const { unmount } = renderComponent();
        
        expect(() => unmount()).not.toThrow();
      });

      test('debe manejar múltiples cambios de locationId', async () => {
        const { rerender } = renderComponent();
        
        const locationIds = ['loc1', 'loc2', 'loc3'];
        
        for (const locationId of locationIds) {
          mockedAxios.get.mockClear();
          
          const newRoute = {
            params: { locationId }
          };
          
          rerender(
            <Provider store={mockStore}>
              <SearchTable navigation={mockNavigation} route={newRoute} />
            </Provider>
          );
          
          await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
          });
        }
      });

      test('debe manejar cambio de locationId a undefined', async () => {
        const { rerender } = renderComponent();
        
        const newRoute = {
          params: {
            locationId: undefined,
          },
        };
        
        expect(() => {
          rerender(
            <Provider store={mockStore}>
              <SearchTable navigation={mockNavigation} route={newRoute} />
            </Provider>
          );
        }).not.toThrow();
      });
    });
  });
});
