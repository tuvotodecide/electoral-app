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

describe('UnifiedTableScreen - Tests de Interacción del Usuario', () => {
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

  describe('3. Tests de Interacción del Usuario', () => {
    describe('3.1 Navegación', () => {
      test('debe navegar hacia atrás al presionar el botón back', () => {
        const mockHandleBack = jest.fn();
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: '',
          setSearchText: jest.fn(),
          handleBack: mockHandleBack,
          handleNotificationPress: jest.fn(),
          handleHomePress: jest.fn(),
          handleProfilePress: jest.fn(),
        });

        const { getByTestId } = renderComponent();
        
        const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
        const backButton = getByTestId('baseSearchTableScreenBackButton');
        
        fireEvent.press(backButton);
        expect(mockHandleBack).toHaveBeenCalled();
      });

      test('debe manejar notificaciones cuando se presiona el botón', () => {
        const mockHandleNotificationPress = jest.fn();
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: '',
          setSearchText: jest.fn(),
          handleBack: jest.fn(),
          handleNotificationPress: mockHandleNotificationPress,
          handleHomePress: jest.fn(),
          handleProfilePress: jest.fn(),
        });

        const { getByTestId } = renderComponent();
        
        const notificationButton = getByTestId('baseSearchTableScreenNotificationButton');
        
        fireEvent.press(notificationButton);
        expect(mockHandleNotificationPress).toHaveBeenCalled();
      });

      test('debe navegar al home cuando se presiona el botón', () => {
        const mockHandleHomePress = jest.fn();
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: '',
          setSearchText: jest.fn(),
          handleBack: jest.fn(),
          handleNotificationPress: jest.fn(),
          handleHomePress: mockHandleHomePress,
          handleProfilePress: jest.fn(),
        });

        const { getByTestId } = renderComponent();
        
        const homeButton = getByTestId('baseSearchTableScreenHomeButton');
        
        fireEvent.press(homeButton);
        expect(mockHandleHomePress).toHaveBeenCalled();
      });

      test('debe navegar al perfil cuando se presiona el botón', () => {
        const mockHandleProfilePress = jest.fn();
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: '',
          setSearchText: jest.fn(),
          handleBack: jest.fn(),
          handleNotificationPress: jest.fn(),
          handleHomePress: jest.fn(),
          handleProfilePress: mockHandleProfilePress,
        });

        const { getByTestId } = renderComponent();
        
        const profileButton = getByTestId('baseSearchTableScreenProfileButton');
        
        fireEvent.press(profileButton);
        expect(mockHandleProfilePress).toHaveBeenCalled();
      });
    });

    describe('3.2 Búsqueda', () => {
      test('debe actualizar texto de búsqueda cuando cambia el input', () => {
        const mockSetSearchText = jest.fn();
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: '',
          setSearchText: mockSetSearchText,
          handleBack: jest.fn(),
          handleNotificationPress: jest.fn(),
          handleHomePress: jest.fn(),
          handleProfilePress: jest.fn(),
        });

        const { getByTestId } = renderComponent();
        
        const searchInput = getByTestId('baseSearchTableScreenSearchInput');
        
        fireEvent.changeText(searchInput, 'Mesa 1');
        expect(mockSetSearchText).toHaveBeenCalledWith('Mesa 1');
      });

      test('debe mostrar valor actual de búsqueda en el input', () => {
        const { useSearchTableLogic } = require('../../../../src/hooks/useSearchTableLogic');
        useSearchTableLogic.mockReturnValue({
          colors: { primary: '#4F9858' },
          searchText: 'test search',
          setSearchText: jest.fn(),
          handleBack: jest.fn(),
          handleNotificationPress: jest.fn(),
          handleHomePress: jest.fn(),
          handleProfilePress: jest.fn(),
        });

        const { getByTestId } = renderComponent();
        
        const searchInput = getByTestId('baseSearchTableScreenSearchInput');
        expect(searchInput.props.value).toBe('test search');
      });

      test('debe mostrar placeholder correcto en el input', () => {
        const { getByTestId } = renderComponent();
        
        const searchInput = getByTestId('baseSearchTableScreenSearchInput');
        expect(searchInput.props.placeholder).toBe('Buscar mesa por número o código...');
      });
    });

    describe('3.3 Selección de Mesa', () => {
      test('debe navegar a WhichIsCorrectScreen cuando la mesa tiene actas', async () => {
        // Mock que la mesa tiene actas
        mockFetchActasByMesa.mockResolvedValue({
          success: true,
          data: {
            images: [{ id: '1', uri: 'test-image.jpg' }]
          }
        });

        const { getByTestId } = renderComponent();
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.WhichIsCorrectScreen,
            expect.objectContaining({
              isFromUnifiedFlow: true,
              photoUri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
            })
          );
        });
      });

      test('debe navegar a TableDetail cuando la mesa no tiene actas', async () => {
        // Mock que la mesa no tiene actas
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });

        const { getByTestId } = renderComponent();
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
            })
          );
        });
      });

      test('debe navegar a TableDetail cuando falla la verificación de actas', async () => {
        // Mock que falla la verificación
        mockFetchActasByMesa.mockRejectedValue(new Error('Network error'));

        const { getByTestId } = renderComponent();
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              isFromUnifiedFlow: true,
            })
          );
        });
      });

      test('debe procesar correctamente los datos de la mesa seleccionada', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });

        const { getByTestId } = renderComponent();
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalledWith(
            StackNav.TableDetail,
            expect.objectContaining({
              tableData: expect.objectContaining({
                id: '1',
                numero: 'Mesa 1',
                codigo: '1234',
                recinto: 'Escuela Test',
                colegio: 'Escuela Test',
                provincia: 'Dirección Test 123',
                zona: 'Zona Test',
                distrito: 'Distrito Test',
                originalTableData: mockTablesData[0],
                locationData: expect.objectContaining({
                  name: 'Escuela Test',
                  address: 'Dirección Test 123',
                }),
              }),
              isFromUnifiedFlow: true,
            })
          );
        });
      });

      test('debe manejar diferentes formatos de ID de mesa', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });

        // Mesa con ID tipo string "Mesa 1"
        const mesaWithStringId = {
          id: 'Mesa 1',
          numero: 'Mesa 1',
          codigo: '1234',
        };

        const routeWithStringIdMesa = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [mesaWithStringId],
            },
          },
        };

        const { getByTestId } = renderComponent(routeWithStringIdMesa);
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        
        fireEvent.press(tableItem);

        await waitFor(() => {
          expect(mockFetchActasByMesa).toHaveBeenCalledWith(1); // Should extract numeric part
        });
      });
    });

    describe('3.4 Interacciones con Modal', () => {
      test('debe cerrar modal al presionar el botón', () => {
        const { getByTestId } = renderComponent();
        
        // Simular que el modal está visible (esto se haría internamente en el componente)
        const modal = getByTestId('unifiedTableScreenModal');
        
        // Verificar que el modal tiene la función onClose definida
        expect(typeof modal.props.onClose).toBe('function');
        
        // Verificar que el modal puede ser cerrado
        expect(() => modal.props.onClose()).not.toThrow();
      });

      test('debe manejar configuración de modal correctamente', () => {
        const { getByTestId } = renderComponent();
        
        const modal = getByTestId('unifiedTableScreenModal');
        
        // Verificar configuración inicial del modal
        expect(modal.props.type).toBe('info');
        expect(modal.props.buttonText).toBe('Aceptar');
        expect(modal.props.visible).toBe(false);
      });
    });

    describe('3.5 Interacciones de Lista', () => {
      test('debe renderizar todos los elementos de la lista', () => {
        const { getByTestId } = renderComponent();
        
        // Verificar que se renderizan todos los elementos
        expect(getByTestId('baseSearchTableScreenTableItem_0')).toBeTruthy();
        expect(getByTestId('baseSearchTableScreenTableItem_1')).toBeTruthy();
      });

      test('debe mostrar información correcta de cada mesa', () => {
        const { getByTestId } = renderComponent();
        
        // Verificar información de la primera mesa
        const tableNumber0 = getByTestId('baseSearchTableScreenTableItemNumber_0');
        const tableCode0 = getByTestId('baseSearchTableScreenTableItemCode_0');
        
        expect(tableNumber0.props.children).toBe('Mesa 1');
        expect(tableCode0.props.children).toBe('1234');
        
        // Verificar información de la segunda mesa
        const tableNumber1 = getByTestId('baseSearchTableScreenTableItemNumber_1');
        const tableCode1 = getByTestId('baseSearchTableScreenTableItemCode_1');
        
        expect(tableNumber1.props.children).toBe('Mesa 2');
        expect(tableCode1.props.children).toBe('1235');
      });

      test('debe permitir interacción con múltiples elementos de la lista', async () => {
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });

        const { getByTestId } = renderComponent();
        
        const tableItem0 = getByTestId('baseSearchTableScreenTableItem_0');
        const tableItem1 = getByTestId('baseSearchTableScreenTableItem_1');
        
        // Presionar primera mesa
        fireEvent.press(tableItem0);
        
        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalled();
        });
        
        mockNavigation.navigate.mockClear();
        
        // Presionar segunda mesa
        fireEvent.press(tableItem1);
        
        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalled();
        });
      });

      test('debe manejar lista vacía correctamente', async () => {
        const routeWithEmptyTables = {
          params: {
            locationId: 'test-location-123',
            locationData: {
              ...mockLocationData,
              tables: [],
            },
          },
        };

        // Mock que el API retorne datos vacíos
        mockedAxios.get.mockResolvedValue({
          data: { tables: [] }
        });

        const { getByTestId } = renderComponent(routeWithEmptyTables);
        
        // Esperar a que termine de cargar y aparezca la pantalla base
        await waitFor(() => {
          const baseScreen = getByTestId('unifiedTableScreenBaseScreen');
          expect(baseScreen.props.tables).toEqual([]);
        });
      });
    });

    describe('3.6 Flujo de Carga de Datos', () => {
      test('debe mostrar loading y luego permitir interacciones', async () => {
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
          data: { tables: mockTablesData }
        });

        const { getByTestId, queryByTestId } = renderComponent(routeWithoutTables);
        
        // Inicialmente loading
        expect(getByTestId('unifiedTableScreenLoadingContainer')).toBeTruthy();
        
        // Después de cargar debe permitir interacciones
        await waitFor(() => {
          expect(queryByTestId('unifiedTableScreenLoadingContainer')).toBeNull();
          expect(getByTestId('baseSearchTableScreenTableItem_0')).toBeTruthy();
        });
        
        // Verificar que se puede interactuar
        mockFetchActasByMesa.mockResolvedValue({
          success: false,
          data: null
        });
        
        const tableItem = getByTestId('baseSearchTableScreenTableItem_0');
        fireEvent.press(tableItem);
        
        await waitFor(() => {
          expect(mockNavigation.navigate).toHaveBeenCalled();
        });
      });
    });
  });
});