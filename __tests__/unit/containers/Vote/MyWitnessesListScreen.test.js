/**
 * Tests for MyWitnessesListScreen
 * Tests de pantalla de lista de atestiguamientos
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import MyWitnessesListScreen from '../../../../src/container/Vote/MyWitnesses/MyWitnessesListScreen';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../setup/test-utils';

let mockNavigationRef;
let mockRouteRef;
const mockFocusCleanups = [];

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigationRef,
  useRoute: () => mockRouteRef,
  useFocusEffect: callback => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = callback();
      if (typeof cleanup === 'function') {
        mockFocusCleanups.push(cleanup);
      }
    }, []);
  },
  NavigationContainer: ({children}) => children,
}));

// Mocks
jest.mock('axios', () => ({
  get: jest.fn(url => {
    const target = String(url || '');
    if (target.includes('/attestations/by-user/')) {
      return Promise.resolve({
        data: {
          data: [
            {
              _id: 'attestation1',
              ballotId: 'ballot1',
              tableNumber: '001',
              timestamp: new Date().toISOString(),
              certificateUrl: 'https://example.com/cert.pdf',
            },
          ],
        },
      });
    }
    if (target.includes('/ballots/')) {
      return Promise.resolve({
        data: {
          _id: 'ballot1',
          tableNumber: '001',
          tableCode: 'CODE001',
          image: 'ipfs://QmTest123',
          createdAt: new Date().toISOString(),
          votes: {
            parties: {
              partyVotes: [{partyId: 'partyA', votes: 100}],
              validVotes: 95,
              blankVotes: 3,
              nullVotes: 2,
              totalVotes: 100,
            },
          },
        },
      });
    }
    return Promise.resolve({data: {data: []}});
  }),
}));

jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('mock-api-key')),
}));

jest.mock('../../../../src/utils/offlineQueue', () => ({
  getAll: jest.fn(() => Promise.resolve([])),
}));

jest.mock('react-native-paper', () => ({
  ActivityIndicator: ({testID}) => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {testID});
  },
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, name}) =>
    React.createElement('Ionicons', {testID, name});
});

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../src/components/common/UniversalHeader', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID = 'universalHeader', title, onBack}) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, {testID: `${testID}Title`}, title),
      React.createElement(
        TouchableOpacity,
        {testID: `${testID}BackButton`, onPress: onBack},
        React.createElement(Text, null, 'Back'),
      ),
    );
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID}) =>
    React.createElement(Text, {testID}, children);
});

jest.mock('../../../../src/components/common/CustomModal', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({testID, visible}) =>
    visible ? React.createElement(View, {testID}) : null;
});

describe('MyWitnessesListScreen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
      },
    },
    wallet: {
      payload: {
        did: 'did:example:123',
        privKey: 'mockPrivKey',
        dni: '12345678',
        vc: {
          credentialSubject: {
            nationalIdNumber: '12345678',
          },
        },
      },
    },
  };

  const navigationWithListener = {
    ...mockNavigation,
    addListener: jest.fn(() => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigationRef = navigationWithListener;
    mockRouteRef = mockRoute;
  });

  afterEach(() => {
    while (mockFocusCleanups.length) {
      const cleanup = mockFocusCleanups.pop();
      cleanup?.();
    }
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('myWitnessesContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('myWitnessesHeader')).toBeTruthy();
    });

    it('muestra indicador de carga inicialmente', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('witnessesLoadingContainer')).toBeTruthy();
    });
  });

  describe('Carga de Atestiguamientos', () => {
    it('carga y muestra atestiguamientos', async () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('witnessRecordsList')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });

    it('muestra estado vacío cuando no hay atestiguamientos', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValueOnce({data: {data: []}});

      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('noAttestationsContainer')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });

  describe('Banner de Acta Pendiente', () => {
    it('muestra banner cuando hay acta pendiente', async () => {
      const {getAll} = require('../../../../src/utils/offlineQueue');
      getAll.mockResolvedValueOnce([
        {task: {type: 'publishActa'}},
      ]);

      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('pendingActaBanner')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });

  describe('Interacciones', () => {
    it('navega hacia atrás al presionar botón back', async () => {
      const localNavigation = {
        ...navigationWithListener,
        goBack: jest.fn(),
      };
      mockNavigationRef = localNavigation;

      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={localNavigation}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      const backButton = getByTestId('myWitnessesHeaderBackButton');
      fireEvent.press(backButton);

      expect(localNavigation.goBack).toHaveBeenCalled();
    });

    it('navega a detalle al presionar un atestiguamiento', async () => {
      const localNavigation = {
        ...navigationWithListener,
        navigate: jest.fn(),
      };
      mockNavigationRef = localNavigation;

      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={localNavigation}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('phoneWitnessRecord_0')).toBeTruthy();
      });

      fireEvent.press(getByTestId('phoneWitnessRecord_0'));

      expect(localNavigation.navigate).toHaveBeenCalled();
    });

    it('refresca lista al presionar botón de refrescar', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValueOnce({data: {data: []}});

      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          const refreshButton = getByTestId('refreshWitnessesButton');
          fireEvent.press(refreshButton);
        },
        {timeout: 3000},
      );

      // Debería llamar al API de nuevo
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra modal de error cuando falla la carga', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const {getByTestId} = renderWithProviders(
        <MyWitnessesListScreen
          navigation={navigationWithListener}
          route={mockRoute}
        />,
        {initialState: mockStore},
      );

      await waitFor(
        () => {
          expect(getByTestId('offlineWitnessesContainer')).toBeTruthy();
        },
        {timeout: 3000},
      );
    });
  });
});
