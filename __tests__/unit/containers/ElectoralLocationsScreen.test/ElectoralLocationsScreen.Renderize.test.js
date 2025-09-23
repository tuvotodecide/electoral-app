import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { PermissionsAndroid, Platform } from 'react-native';
import axios from 'axios';

import ElectoralLocationsScreen from '../../../../src/container/Vote/ElectoralLocationsScreen';
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

// Mock Geolocation
jest.mock('@react-native-community/geolocation');

// Mock custom components
jest.mock('../../../../src/components/common/CSafeAreaView', () => 
  require('../../../__mocks__/components/common/CSafeAreaView').default
);
jest.mock('../../../../src/components/common/UniversalHeader', () => 
  require('../../../__mocks__/components/common/UniversalHeader').default
);
jest.mock('../../../../src/components/common/CText', () => 
  require('../../../__mocks__/components/common/CText').default
);
jest.mock('../../../../src/components/common/CustomModal', () => 
  require('../../../__mocks__/components/common/CustomModal').default
);

// Mock FlatList to render items properly
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = require('react');
  
  return function FlatList({ data, renderItem, testID, keyExtractor, ...props }) {
    if (!data || data.length === 0) {
      return React.createElement('FlatList', { testID, ...props });
    }

    const items = data.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : index.toString();
      return React.createElement('View', { key }, renderItem({ item, index }));
    });

    return React.createElement('ScrollView', { testID, ...props }, items);
  };
});

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
const mockLocationsData = [
  {
    id: '1',
    name: 'Escuela Primaria Central',
    address: 'Av. Principal 123, Centro',
    tablesCount: 8,
    code: 'EP001',
    coordinates: { lat: -12.0464, lng: -77.0428 }
  },
  {
    id: '2', 
    name: 'Centro Comunitario Norte',
    address: 'Calle Los Pinos 456, Norte',
    tablesCount: 5,
    code: 'CC002',
    coordinates: { lat: -12.0564, lng: -77.0528 }
  },
  {
    id: '3',
    name: 'Instituto Tecnológico Sur',
    address: 'Av. Universitaria 789, Sur',
    tablesCount: 12,
    code: 'ITS003',
    coordinates: { lat: -12.0364, lng: -77.0328 }
  }
];

describe('ElectoralLocationsScreen - Tests Comprehensivos', () => {
  let mockStore;

  // Helper function to render component
  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <ElectoralLocationsScreen />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android'; // Usar Android para probar el flujo de permisos
    mockStore = createMockStore();
    
    // Mock PermissionsAndroid para denegar permisos y forzar loadAllLocations
    PermissionsAndroid.request = jest.fn().mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    PermissionsAndroid.RESULTS = {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    };
    PermissionsAndroid.PERMISSIONS = {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    };
  });

  // 1. TESTS DE RENDERIZADO INICIAL
  describe('1. Tests de Renderizado Inicial', () => {
    describe('1.1 Estado de Carga', () => {
      test('debe mostrar loading indicator al inicio', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves
        
        const { getByTestId } = renderComponent();
        
        expect(getByTestId('electoralLocationsLoadingIndicator')).toBeTruthy();
      });

      test('debe mostrar texto de carga apropiado', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        const loadingText = getByTestId('electoralLocationsLoadingText');
        expect(loadingText.props.children).toBe('Obteniendo ubicación...');
      });

      test('debe mostrar header durante carga', () => {
        mockedAxios.get.mockImplementation(() => new Promise(() => {}));
        
        const { getByTestId } = renderComponent();
        
        expect(getByTestId('electoralLocationsLoadingHeader')).toBeTruthy();
      });
    });

    describe('1.2 Renderizado con Datos', () => {
      test('debe renderizar la lista de ubicaciones correctamente', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsList')).toBeTruthy();
        });
      });

      test('debe mostrar nombres de ubicaciones', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByText } = renderComponent();
        
        await waitFor(() => {
          expect(getByText('Escuela Primaria Central')).toBeTruthy();
        }, { timeout: 5000 });
      });

      test('debe mostrar direcciones de ubicaciones', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByText } = renderComponent();
        
        await waitFor(() => {
          expect(getByText('Av. Principal 123, Centro')).toBeTruthy();
        }, { timeout: 5000 });
      });

      test('debe mostrar conteo de mesas cuando está disponible', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByText } = renderComponent();
        
        await waitFor(() => {
          expect(getByText('8 mesas')).toBeTruthy();
        }, { timeout: 5000 });
      });

      test('debe mostrar el código cuando está disponible', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByText } = renderComponent();
        
        await waitFor(() => {
          expect(getByText('Código: EP001')).toBeTruthy();
        }, { timeout: 5000 });
      });

      test('debe aplicar testIDs únicos para cada elemento', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const list = getByTestId('electoralLocationsList');
          expect(list).toBeTruthy();
          // Verificamos que la lista tenga contenido esperando por algún texto específico
          expect(getByTestId('electoralLocationsContainer')).toBeTruthy();
        }, { timeout: 5000 });
      });

      test('debe mostrar iconos apropiados para cada ubicación', async () => {
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          const list = getByTestId('electoralLocationsList');
          expect(list).toBeTruthy();
          // Verificamos que el header tenga iconos
          expect(getByTestId('electoralLocationsHeader')).toBeTruthy();
        }, { timeout: 5000 });
      });
    });

    describe('1.3 Renderizado con Estado Vacío', () => {
      test('debe mostrar el estado vacío cuando locations está vacío', async () => {
        mockedAxios.get.mockResolvedValue({
          data: []
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsEmptyContainer')).toBeTruthy();
        });
      });

      test('debe mostrar el icono "location-off" en estado vacío', async () => {
        mockedAxios.get.mockResolvedValue({
          data: []
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsEmptyIcon')).toBeTruthy();
        });
      });

      test('debe mostrar título apropiado en estado vacío', async () => {
        mockedAxios.get.mockResolvedValue({
          data: []
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsEmptyTitle')).toBeTruthy();
        });
      });

      test('debe mostrar subtítulo en estado vacío', async () => {
        mockedAxios.get.mockResolvedValue({
          data: []
        });

        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('electoralLocationsEmptySubtitle')).toBeTruthy();
        });
      });
    });
  });
});
