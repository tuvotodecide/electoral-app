import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import axios from 'axios';
import TestRenderer from 'react-test-renderer';
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

describe('SearchTable - Tests de Renderización', () => {
  let mockStore;
  let originalConsoleError;

  beforeAll(() => {
    // Suprimir warnings de act() para este archivo específico ya que involucra efectos asíncronos complejos
    originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('An update to SearchTable inside a test was not wrapped in act')) {
        return; // Suppress act warnings for this specific component
      }
      originalConsoleError.call(console, ...args);
    };
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  // Helper function to render component with act wrapper
  const renderComponentWithAct = async (routeParams = mockRoute) => {
    let result;
    await act(async () => {
      result = render(
        <Provider store={mockStore}>
          <SearchTable navigation={mockNavigation} route={routeParams} />
        </Provider>
      );
      
      // Give time for useEffect to run and state updates to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    return result;
  };

  // Helper function to render component (simple version)
  const renderComponent = (routeParams = mockRoute) => {
    return render(
      <Provider store={mockStore}>
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

  describe('1. Tests de Renderización', () => {
    describe('1.1 Renderización Inicial', () => {
      test('debe renderizar correctamente durante el estado de carga', async () => {
        // Mock que nunca se resuelve para mantener estado de carga
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const component = renderComponent();
        
        expect(component.getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
      });

      test('debe renderizar BaseSearchTableScreen con props correctas', async () => {
        const component = renderComponent();
        
        const baseScreen = component.getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen).toBeTruthy();
        expect(baseScreen.props.testID).toBe('unifiedTableScreenBaseScreen');
      });

      test('debe renderizar con Provider de Redux', async () => {
        const component = renderComponent();
        
        expect(component).toBeTruthy();
      });

      test('debe inicializar con estado de carga', async () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const component = renderComponent();
        
        const baseScreen = component.getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.tables).toEqual([]);
      });
    });

    describe('1.2 Renderización Después de Cargar Datos', () => {
      test('debe renderizar con datos cargados desde API', async () => {
        const component = renderComponent();
        
        await waitFor(() => {
          const baseScreen = component.getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });
      });

      test('debe renderizar datos de ubicación correctamente', async () => {
        const component = renderComponent();
        
        await waitFor(() => {
          const baseScreen = component.getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.locationData).toEqual(mockLocationData);
        });
      });

      test('debe renderizar con mesas vacías cuando API retorna data vacía', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            tables: [],
            ...mockLocationData,
          }
        });
        
        const component = renderComponent();
        
        await waitFor(() => {
          const baseScreen = component.getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe renderizar con estructura de respuesta alternativa', async () => {
        mockedAxios.get.mockResolvedValue({
          data: {
            data: {
              tables: mockTablesData,
              ...mockLocationData,
            }
          }
        });
        
        const component = renderComponent();
        
        await waitFor(() => {
          const baseScreen = component.getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });
      });
    });

    describe('1.3 Props de BaseSearchTableScreen', () => {
      test('debe pasar todas las props requeridas a BaseSearchTableScreen', async () => {
        const { getByTestId } = renderComponent();
        
        // Esperamos a que el componente se renderice completamente
        await waitFor(() => {
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        }, { timeout: 3000 });

        // Verificamos las props después de que sabemos que el componente existe
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const props = baseScreen.props;
        
        expect(props.colors).toBeDefined();
        expect(props.onBack).toBeDefined();
        expect(props.title).toBeDefined();
        expect(props.chooseTableText).toBeDefined();
        expect(props.searchPlaceholder).toBeDefined();
        expect(props.searchValue).toBeDefined();
        expect(props.onSearchChange).toBeDefined();
        expect(props.tables).toBeDefined();
        expect(props.enableAutoVerification).toBe(true);
        expect(props.apiEndpoint).toBe('http://192.168.1.16:3000/api/v1/mesa');
        expect(props.locationData).toBeDefined();
        expect(props.styles).toBeDefined();
      });

      test('debe pasar colores del theme correctamente', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.colors).toEqual({
            background: '#FFFFFF',
            text: '#000000',
            textSecondary: '#666666',
            primary: '#4F9858',
            primaryLight: '#E8F5E8',
          });
        });
      });

      test('debe pasar función onBack correcta', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(typeof baseScreen.props.onBack).toBe('function');
        });
      });

      test('debe pasar string de título correcto', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.title).toBe('Buscar Mesa');
        });
      });

      test('debe pasar configuración de API correcta', async () => {
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.enableAutoVerification).toBe(true);
          expect(baseScreen.props.apiEndpoint).toBe('http://192.168.1.16:3000/api/v1/mesa');
        });
      });
    });

    describe('1.4 Renderización con Diferentes Estados', () => {
      test('debe renderizar correctamente con route sin params', () => {
        const emptyRoute = {};
        
        expect(() => renderComponent(emptyRoute)).not.toThrow();
      });

      test('debe renderizar correctamente con locationId undefined', () => {
        const routeWithoutLocationId = {
          params: {
            locationId: undefined,
          },
        };
        
        expect(() => renderComponent(routeWithoutLocationId)).not.toThrow();
      });

      test('debe renderizar correctamente cuando axios falla', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network error'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe renderizar correctamente con respuesta de API malformada', async () => {
        mockedAxios.get.mockResolvedValue({
          data: null
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });
    });

    describe('1.5 Renderización de Elementos Específicos', () => {
      test('debe renderizar con searchValue inicial vacío', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.searchValue).toBe('');
      });

      test('debe renderizar con función de búsqueda válida', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(typeof baseScreen.props.onSearchChange).toBe('function');
      });

      test('debe renderizar con locationData null inicialmente', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.locationData).toBeNull();
      });

      test('debe renderizar con styles locales correctos', () => {
        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        expect(baseScreen.props.styles).toBeDefined();
        expect(typeof baseScreen.props.styles).toBe('object');
      });

      test('debe renderizar sin errores de console', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen).toBeTruthy();
        });
        
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('1.6 Renderización con Diferentes Configuraciones', () => {
      test('debe renderizar con diferentes locationIds', async () => {
        const locationIds = ['loc1', 'loc2', 'loc3'];
        
        for (const locationId of locationIds) {
          const route = {
            params: { locationId }
          };
          
          const { getByTestId } = renderComponent(route);
          
          await waitFor(() => {
            const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
            expect(baseScreen).toBeTruthy();
          });
        }
      });

      test('debe renderizar con mocks de navegación diferentes', () => {
        const alternativeNavigation = {
          ...mockNavigation,
          customMethod: jest.fn(),
        };
        
        const { getByTestId } = render(
          <Provider store={mockStore}>
            <SearchTable navigation={alternativeNavigation} route={mockRoute} />
          </Provider>
        );
        
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
      });

      test('debe renderizar correctamente en múltiples instancias', () => {
        const { getByTestId: getByTestId1 } = renderComponent();
        const { getByTestId: getByTestId2 } = renderComponent();
        
        expect(getByTestId1('unifiedTableScreenBaseScreen')).toBeTruthy();
        expect(getByTestId2('unifiedTableScreenBaseScreen')).toBeTruthy();
      });
    });
  });
});
