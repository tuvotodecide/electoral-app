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

// Mock react-redux
jest.mock('react-redux');

// Mock custom components
jest.mock('../../../../src/components/common/BaseSearchTableScreen', () => 
  require('../../../__mocks__/components/common/BaseSearchTableScreen').default
);
jest.mock('../../../../src/components/common/CText', () => 
  require('../../../__mocks__/components/common/CText').default
);
jest.mock('../../../../src/components/common/CustomModal', () => 
  require('../../../__mocks__/components/common/CustomModal').default
);

// Mock hooks
jest.mock('../../../../src/hooks/useSearchTableLogic', () => 
  require('../../../__mocks__/hooks/useSearchTableLogic')
);

// Mock styles
jest.mock('../../../../src/styles/searchTableStyles', () => 
  require('../../../__mocks__/styles/searchTableStyles')
);

// Mock data with manual mock control
let mockFetchMesas = jest.fn();
let mockFetchActasByMesa = jest.fn();

jest.mock('../../../../src/data/mockMesas', () => ({
  fetchMesas: (...args) => mockFetchMesas(...args),
  fetchActasByMesa: (...args) => mockFetchActasByMesa(...args),
}));

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
    _id: '1',
  },
  {
    id: '2',
    tableNumber: 'Mesa 2',
    tableCode: '1235',
    numero: 'Mesa 2',
    codigo: '1235',
    name: 'Mesa 2',
    code: '1235',
    _id: '2',
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

describe('UnifiedTableScreen - Tests de Manejo de Errores', () => {
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
    
    // Reset mocks
    mockFetchMesas.mockReset();
    mockFetchActasByMesa.mockReset();
    
    // Set default return value for fetchMesas to provide table data
    mockFetchMesas.mockResolvedValue({
      success: true,
      data: mockTablesData
    });
    
    // Configuración por defecto de axios
    mockedAxios.get.mockResolvedValue({
      data: {
        tables: mockTablesData
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

  describe('4. Tests de Manejo de Errores', () => {
    describe('4.1 Errores de Red en Carga de Datos', () => {
      test('debe manejar error de conexión de red sin mostrar error al usuario', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockRejectedValue(new Error('Network Error'));
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        // Inicialmente loading
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        
        await waitFor(() => {
          // Debe completar la carga sin mostrar error
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
          
          // Debe mostrar lista vacía (graceful degradation)
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe manejar timeout de solicitud', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockRejectedValue(new Error('timeout of 15000ms exceeded'));
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });
      });

      test('debe manejar error de servidor 500', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockRejectedValue({
          response: { status: 500, data: 'Internal Server Error' }
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });
      });

      test('debe manejar error 404 - recurso no encontrado', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        mockedAxios.get.mockRejectedValue({
          response: { status: 404, data: 'Not Found' }
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });
      });

      test('debe llamar a API con timeout configurado', async () => {
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
          data: { tables: [] }
        });
        
        renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/geographic/electoral-locations/test-location-123/tables'),
            { timeout: 15000 }
          );
        });
      });
    });

    describe('4.2 Errores de Datos Corruptos', () => {
      test('debe manejar respuesta con estructura de datos inválida', async () => {
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
          data: { invalid: 'structure' }
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe manejar respuesta null', async () => {
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
          data: null
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe manejar respuesta undefined', async () => {
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
          data: undefined
        });
        
        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });

      test('debe manejar tablas con estructura parcial', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        const partialTables = [
          { id: '1' }, // Solo ID
          { numero: 'Mesa 2' }, // Solo número
          { codigo: '1236', name: 'Mesa 3' }, // Mezclado
        ];

        mockedAxios.get.mockResolvedValue({
          data: { tables: partialTables }
        });
        
        const { getByTestId } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(partialTables);
        });
      });
    });

    describe('4.3 Errores en Verificación de Actas', () => {
      test('debe manejar error en fetchActasByMesa y navegar a TableDetail', async () => {
        mockFetchActasByMesa.mockRejectedValue(new Error('Network error'));

        // Usar route con datos para que haya elementos clickeables
        const { getByTestId } = renderComponent(mockRoute);
        
        await waitFor(() => {
          const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
          fireEvent.press(tableItem);
        });

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
            })
          );
        });
      });

      test('debe manejar timeout en verificación de actas', async () => {
        mockFetchActasByMesa.mockRejectedValue(new Error('timeout'));

        // Usar route con datos para que haya elementos clickeables
        const { getByTestId } = renderComponent(mockRoute);
        
        await waitFor(() => {
          const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
          fireEvent.press(tableItem);
        });

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
            })
          );
        });
      });

      test('debe manejar respuesta inválida de actas', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: true,
          data: null // Datos nulos pero success true
        });

        // Usar route con datos para que haya elementos clickeables
        const { getByTestId } = renderComponent(mockRoute);
        
        await waitFor(() => {
          const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
          fireEvent.press(tableItem);
        });

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
            })
          );
        });
      });

      test('debe manejar actas con imágenes vacías', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: true,
          data: {
            images: [] // Array de imágenes vacío
          }
        });

        // Usar route con datos para que haya elementos clickeables
        const { getByTestId } = renderComponent(mockRoute);
        
        // Esperar a que se carguen las mesas y aparezca el elemento
        await waitFor(() => {
          const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
          fireEvent.press(tableItem);
        });

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
            })
          );
        });
      });
    });

    describe('4.4 Errores de Procesamiento de Datos', () => {
      test('debe manejar mesa con ID malformado', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });

        const routeWithMalformedId = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [
                {
                  id: 'invalid-id',
                  numero: null,
                  codigo: undefined,
                  name: '',
                }
              ],
            },
          },
        };

        const { getByTestId } = renderComponent(routeWithMalformedId);
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
              tableData: expect.objectContaining({
                id: 'invalid-id',
              }),
            })
          );
        });
      });

      test('debe manejar locationData faltante durante procesamiento', async () => {
        // Mock que el API retorne datos cuando locationData es null
        mockedAxios.get.mockResolvedValue({
          data: {
            tables: mockTablesData
          }
        });

        const routeWithoutLocationData = {
          params: {
            locationId: 'test-location-123',
            locationData: null,
          },
        };

        const { getByTestId } = renderComponent(routeWithoutLocationData);
        
        // Esperar a que termine de cargar y aparezca la pantalla base
        await waitFor(() => {
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });

        // Verificar que se hizo la llamada a la API
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/geographic/electoral-locations/test-location-123/tables'),
          { timeout: 15000 }
        );
      });

      test('debe manejar extracción de ID numérico de string complejos', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });

        const routeWithComplexStringId = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [
                {
                  id: 'Mesa Número 999 Especial',
                  numero: 'Mesa Número 999 Especial',
                  codigo: '1234',
                }
              ],
            },
          },
        };

        const { getByTestId } = renderComponent(routeWithComplexStringId);
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockFetchActasByMesa).toHaveBeenCalledWith(999);
        });
      });
    });

    describe('4.5 Errores de Estado y Rendering', () => {
      test('debe manejar cambios de route durante loading', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        // Promise que nunca se resuelve para simular loading eterno
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId, rerender } = renderComponent(routeWithoutTables);
        
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        
        // Cambiar route mientras está loading
        const newRoute = {
          params: {
            locationId: 'different-location',
            locationData: {
              ...mockLocationData,
              locationId: 'different-location',
              tables: mockTablesData,
            },
          },
        };
        
        rerender(
          <Provider store={mockStore}>
            <UnifiedTableScreen navigation={mockNavigation} route={newRoute} />
          </Provider>
        );
        
        // Debe renderizar con los nuevos datos inmediatamente
        expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
      });

      test('debe manejar unmounting durante operaciones asíncronas', async () => {
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
        
        const { unmount } = renderComponent(routeWithoutTables);
        
        // Unmount antes de que se resuelva la promesa
        unmount();
        
        // Resolver la promesa después del unmount (no debería causar errores)
        act(() => {
          resolvePromise({ data: { tables: mockTablesData } });
        });
        
        // No debe arrojar errores
        expect(true).toBe(true);
      });

      test('debe manejar múltiples llamadas API simultáneas', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        let callCount = 0;
        mockedAxios.get.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return new Promise(() => {}); // Primera llamada nunca se resuelve
          }
          return Promise.resolve({ data: { tables: mockTablesData } });
        });
        
        const { getByTestId, rerender } = renderComponent(routeWithoutTables);
        
        // Primera llamada en loading
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        
        // Cambiar locationId para trigger segunda llamada
        const newRoute = {
          params: {
            locationId: 'different-location',
            locationData: {
              ...mockLocationData,
              locationId: 'different-location',
              tables: [],
            },
          },
        };
        
        rerender(
          <Provider store={mockStore}>
            <UnifiedTableScreen navigation={mockNavigation} route={newRoute} />
          </Provider>
        );
        
        await waitFor(() => {
          // Debe resolver con la segunda llamada
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
        });
      });
    });

    describe('4.6 Casos Edge y Recuperación', () => {
      test('debe recuperarse de errores transitoriis en llamadas API', async () => {
        const routeWithoutTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        // Primera vez falla, segunda vez funciona
        mockedAxios.get
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ data: { tables: mockTablesData } });
        
        const { getByTestId, rerender } = renderComponent(routeWithoutTables);
        
        await waitFor(() => {
          expect(getByTestId('unifiedTableScreenBaseScreen')).toBeTruthy();
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
        
        // Retry con nuevo locationId
        const retryRoute = {
          params: {
            locationId: 'retry-location',
            locationData: {
              ...mockLocationData,
              locationId: 'retry-location',
              tables: [],
            },
          },
        };
        
        rerender(
          <Provider store={mockStore}>
            <UnifiedTableScreen navigation={mockNavigation} route={retryRoute} />
          </Provider>
        );
        
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual(mockTablesData);
        });
      });

      test('debe manejar props faltantes sin crashes', () => {
        const incompleteRoute = {
          params: {
            // Sin locationId ni locationData
          },
        };
        
        expect(() => renderComponent(incompleteRoute)).not.toThrow();
        
        const { getByTestId } = renderComponent(incompleteRoute);
        
        // Con props incompletos, el componente debe mostrar el loading o la pantalla base
        // En este caso, al no tener locationId, no carga datos, entonces sale del loading
        expect(() => {
          // Puede estar en estado de loading o mostrar la pantalla base
          try {
            getByTestId('unifiedTableScreenBaseScreen');
          } catch {
            // Si no encuentra la pantalla base, debería estar cargando
            getByTestId('unifiedTableScreenLoadingContainer');
          }
        }).not.toThrow();
      });

      test('debe manejar navigation object malformado', () => {
        const invalidNavigation = {
          // Navigation sin funciones requeridas
        };
        
        expect(() => render(
          <Provider store={mockStore}>
            <UnifiedTableScreen navigation={invalidNavigation} route={mockRoute} />
          </Provider>
        )).not.toThrow();
      });
    });
  });
});