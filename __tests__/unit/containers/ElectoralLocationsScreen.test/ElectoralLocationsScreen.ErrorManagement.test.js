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

// Mock FlatList
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = require('react');
  
  return function FlatList({ data, renderItem, testID, keyExtractor, contentContainerStyle, ...props }) {
    if (!data || data.length === 0) {
      return React.createElement('FlatList', { testID, ...props });
    }

    const items = data.map((item, index) => {
      const key = keyExtractor ? keyExtractor(item, index) : index.toString();
      const renderedItem = renderItem({ item, index });
      return React.createElement('View', { key }, renderedItem);
    });

    return React.createElement('View', { testID, style: contentContainerStyle, ...props }, items);
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

describe('4. Tests de Manejo de Errores', () => {
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
    
    // Configuración por defecto de axios - esencial para que los tests funcionen
    mockedAxios.get.mockResolvedValue({
      data: mockLocationsData
    });
    
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

  describe('4.1 Errores de Red', () => {
      test('debe manejar error de conexión de red', async () => {
        mockedAxios.get.mockRejectedValue(new Error('Network Error'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });

      test('debe manejar timeout de solicitud', async () => {
        mockedAxios.get.mockRejectedValue(new Error('timeout of 5000ms exceeded'));
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });

      test('debe manejar error de servidor 500', async () => {
        mockedAxios.get.mockRejectedValue({
          response: { status: 500, data: 'Internal Server Error' }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });

      test('debe manejar error 404 - recurso no encontrado', async () => {
        mockedAxios.get.mockRejectedValue({
          response: { status: 404, data: 'Not Found' }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });
    });

    describe('4.2 Errores de Datos', () => {
      test('debe manejar respuesta con datos corruptos', async () => {
        mockedAxios.get.mockResolvedValue({
          data: { invalid: 'structure' }
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          // Los datos corruptos se tratan como datos vacíos y muestran el modal de permisos
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });

      test('debe manejar respuesta null', async () => {
        mockedAxios.get.mockResolvedValue({
          data: null
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });

      test('debe manejar respuesta undefined', async () => {
        mockedAxios.get.mockResolvedValue({
          data: undefined
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });
    });

    describe('4.3 Errores de Permisos', () => {
      test('debe manejar permisos denegados permanentemente', async () => {
        PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });

      test('debe manejar error en la solicitud de permisos', async () => {
        PermissionsAndroid.request.mockRejectedValue(new Error('Permission Error'));
        mockedAxios.get.mockResolvedValue({
          data: mockLocationsData
        });
        
        const { getByTestId } = renderComponent();
        
        await waitFor(() => {
          expect(getByTestId('customModalPrimaryButton')).toBeTruthy();
        });
      });
    });
  });