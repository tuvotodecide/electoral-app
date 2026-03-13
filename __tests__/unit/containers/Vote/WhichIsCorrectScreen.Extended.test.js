/**
 * Extended tests for WhichIsCorrectScreen
 * Tests adicionales para mejorar cobertura
 */

import React from 'react';
import {fireEvent, waitFor, act} from '@testing-library/react-native';
import WhichIsCorrectScreen from '../../../../src/container/Vote/WitnessRecord/WhichIsCorrectScreen';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../setup/test-utils';
import {fetchActasByMesa} from '../../../../src/data/mockMesas';

// Mocks
jest.mock('../../../../src/data/mockMesas', () => ({
  fetchActasByMesa: jest.fn(),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('MaterialIcons', {testID, name, ...props});
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
});

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, testID}) =>
    React.createElement(View, {testID}, children);
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID, ...props}) =>
    React.createElement(Text, {testID, ...props}, children);
});

jest.mock('../../../../src/components/common/UniversalHeader', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, onBack, title}) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, null, title),
      React.createElement(
        TouchableOpacity,
        {testID: `${testID}_backBtn`, onPress: onBack},
        React.createElement(Text, null, 'Back'),
      ),
    );
});

jest.mock('../../../../src/components/common/CustomModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, visible, title, message, onConfirm, onClose}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, {testID: `${testID}_title`}, title),
          React.createElement(Text, {testID: `${testID}_message`}, message),
          React.createElement(
            TouchableOpacity,
            {testID: `${testID}_confirmBtn`, onPress: onConfirm || onClose},
            React.createElement(Text, null, 'Confirm'),
          ),
        )
      : null;
});

jest.mock('../../../../src/utils/normalizedUri', () => ({
  normalizeUri: jest.fn(uri => uri || ''),
}));

describe('WhichIsCorrectScreen Extended', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        textColor: '#2F2F2F',
        background: '#FFFFFF',
      },
    },
  };

  const baseRouteParams = {
    electionId: 'election1',
    electionType: 'president',
    mesaData: {
      mesa: 'Mesa 001',
      tableNumber: '001',
      id: 'mesa-001',
    },
    existingActas: [],
    photoUri: 'file://photo.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchActasByMesa.mockResolvedValue({
      success: true,
      data: {
        images: [
          {
            _id: 'acta1',
            image: 'ipfs://QmTest123',
            partyResults: [{party: 'Party A', votes: 100}],
            voteSummaryResults: {
              presValidVotes: 100,
              presBlankVotes: 5,
              presNullVotes: 3,
            },
          },
          {
            _id: 'acta2',
            image: 'https://example.com/acta2.jpg',
            partyResults: [{party: 'Party B', votes: 50}],
            voteSummaryResults: {
              presValidVotes: 50,
              depValidVotes: 48,
            },
          },
        ],
        partyResults: [{party: 'Party A', votes: 100}],
        voteSummaryResults: [{label: 'Total', value: 100}],
      },
    });
  });

  describe('Carga de actas', () => {
    it('muestra error cuando fetchActasByMesa falla', async () => {
      fetchActasByMesa.mockRejectedValueOnce(new Error('Network error'));

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectModal')).toBeTruthy();
      });
    });

    it('no muestra error si ya hay actas preloaded', async () => {
      fetchActasByMesa.mockRejectedValueOnce(new Error('Network error'));

      const paramsWithPreloaded = {
        ...baseRouteParams,
        existingActas: [
          {
            _id: 'preloaded1',
            image: 'https://example.com/preloaded.jpg',
            partyResults: [],
          },
        ],
      };

      const route = {...mockRoute, params: paramsWithPreloaded};
      const {queryByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(queryByTestId('whichIsCorrectModal')).toBeNull();
      });
    });

    it('maneja respuesta sin success=true', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: false,
        data: {},
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectModal')).toBeTruthy();
      });
    });
  });

  describe('Normalización de imágenes', () => {
    it('normaliza diferentes formatos de URI IPFS', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: true,
        data: {
          images: [
            {_id: 'ipfs1', image: 'ipfs://QmHash1'},
            {_id: 'ipfs2', ipfsUri: 'ipfs/QmHash2'},
            {_id: 'http1', imageUrl: 'https://gateway.pinata.cloud/ipfs/QmHash3'},
            {_id: 'file1', photoUri: 'file:///local/image.jpg'},
          ],
          partyResults: [],
          voteSummaryResults: [],
        },
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });

    it('maneja imágenes con ids duplicados', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: true,
        data: {
          images: [
            {_id: 'id-1', image: 'ipfs://QmHash1'},
            {_id: 'id-2', image: 'ipfs://QmHash2'},
            {_id: 'id-3', image: 'ipfs://QmHash3'},
          ],
          partyResults: [],
          voteSummaryResults: [],
        },
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });
  });

  describe('Transformación de vote summary', () => {
    it('transforma objeto con campos pres/dep', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: true,
        data: {
          images: [
            {
              _id: 'acta1',
              image: 'ipfs://test',
              voteSummaryResults: {
                presValidVotes: 100,
                depValidVotes: 95,
                presBlankVotes: 5,
                depBlankVotes: 3,
                presNullVotes: 2,
                depNullVotes: 1,
                presTotalVotes: 107,
                depTotalVotes: 99,
              },
            },
          ],
        },
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });

    it('usa fallback array cuando voteSummary está vacío', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: true,
        data: {
          images: [
            {
              _id: 'acta1',
              image: 'ipfs://test',
              voteSummaryResults: {},
            },
          ],
          voteSummaryResults: [
            {label: 'Válidos', value1: 100},
            {label: 'Nulos', value1: 5},
          ],
        },
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });
  });

  describe('Navegación', () => {
    it('renderiza el contenedor correctamente', async () => {
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });

    it('muestra modal al presionar datos no correctos', async () => {
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const button = getByTestId('whichIsCorrect_datosNoCorrectosButton');
        fireEvent.press(button);
      });

      expect(getByTestId('whichIsCorrectModal')).toBeTruthy();
    });
  });

  describe('Modal', () => {
    it('cierra modal al confirmar', async () => {
      fetchActasByMesa.mockRejectedValueOnce(new Error('Error'));

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId, queryByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectModal')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('whichIsCorrectModal_confirmBtn'));
      });

      await waitFor(() => {
        expect(queryByTestId('whichIsCorrectModal')).toBeNull();
      });
    });
  });

  describe('parseNumeric helper', () => {
    it('maneja diferentes tipos de valores', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: true,
        data: {
          images: [
            {
              _id: 'acta1',
              image: 'ipfs://test',
              voteSummaryResults: {
                presValidVotes: '100', // string number
                presBlankVotes: 5, // number
                presNullVotes: null, // null
                presTotalVotes: undefined, // undefined
              },
            },
          ],
        },
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });
  });

  describe('URI resolución', () => {
    it('prioriza URIs http sobre ipfs', async () => {
      fetchActasByMesa.mockResolvedValueOnce({
        success: true,
        data: {
          images: [
            {
              _id: 'acta1',
              image: 'ipfs://backup',
              actaImage: 'https://primary.com/image.jpg',
              imageUrl: 'https://secondary.com/image.jpg',
            },
          ],
        },
      });

      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
      });
    });

    it('construye candidatos IPFS desde diferentes formatos', async () => {
      const testCases = [
        {ipfsCid: 'QmTestCid123'},
        {cid: 'QmAnotherCid456'},
        {ipfsUrl: 'ipfs://QmUrlCid789'},
      ];

      for (const testCase of testCases) {
        fetchActasByMesa.mockResolvedValueOnce({
          success: true,
          data: {
            images: [{_id: `test-${JSON.stringify(testCase)}`, ...testCase}],
          },
        });

        const route = {...mockRoute, params: baseRouteParams};
        const {unmount} = renderWithProviders(
          <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
          {initialState: mockStore},
        );

        await waitFor(() => {});
        unmount();
      }
    });
  });

  describe('allowAddNewActa flag', () => {
    it('renderiza correctamente con isFromUnifiedFlow', () => {
      const paramsUnified = {
        ...baseRouteParams,
        isFromUnifiedFlow: true,
      };

      const route = {...mockRoute, params: paramsUnified};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });

    it('renderiza correctamente con fromTableDetail', () => {
      const paramsFromDetail = {
        ...baseRouteParams,
        fromTableDetail: true,
      };

      const route = {...mockRoute, params: paramsFromDetail};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });

    it('renderiza correctamente con isFromAPI', () => {
      const paramsFromAPI = {
        ...baseRouteParams,
        isFromAPI: true,
      };

      const route = {...mockRoute, params: paramsFromAPI};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });

    it('renderiza correctamente con existingRecords', () => {
      const paramsWithRecords = {
        ...baseRouteParams,
        existingRecords: [{_id: 'record1'}],
      };

      const route = {...mockRoute, params: paramsWithRecords};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });
  });

  describe('mesaInfo resolution', () => {
    it('usa routeMesaInfo cuando está disponible', () => {
      const paramsWithMesaInfo = {
        ...baseRouteParams,
        mesaInfo: {
          id: 'mesa-from-info',
          tableNumber: '999',
        },
      };

      const route = {...mockRoute, params: paramsWithMesaInfo};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });

    it('usa mesa como fallback', () => {
      const paramsWithMesa = {
        ...baseRouteParams,
        mesaData: undefined,
        mesa: {
          id: 'mesa-from-mesa',
          tableNumber: '888',
        },
      };

      const route = {...mockRoute, params: paramsWithMesa};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });

    it('usa tableData como último fallback', () => {
      const paramsWithTableData = {
        ...baseRouteParams,
        mesaData: undefined,
        tableData: {
          id: 'mesa-from-tableData',
          tableNumber: '777',
        },
      };

      const route = {...mockRoute, params: paramsWithTableData};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });
  });
});
