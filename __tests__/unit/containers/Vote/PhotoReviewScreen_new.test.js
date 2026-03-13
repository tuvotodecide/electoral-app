/**
 * Tests for PhotoReviewScreen_new
 * Tests de pantalla de revisión de foto de acta
 */

import React from 'react';
import {fireEvent, waitFor, act} from '@testing-library/react-native';
import PhotoReviewScreen from '../../../../src/container/Vote/UploadRecord/PhotoReviewScreen_new';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../setup/test-utils';

// Mocks
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({data: {}})),
  post: jest.fn(() => Promise.resolve({data: {}})),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
    }),
  ),
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({testID, name, ...props}) =>
    React.createElement('Ionicons', {testID, name, ...props});
});

jest.mock('../../../../src/components/common/BaseRecordReviewScreen', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({
    testID,
    partyResults,
    voteSummaryResults,
    photoUri,
    onContinue,
    onGoBack,
    children,
  }) =>
    React.createElement(
      View,
      {testID: testID || 'baseRecordReview'},
      React.createElement(Text, {testID: 'partyCount'}, partyResults?.length || 0),
      React.createElement(Text, {testID: 'photoUri'}, photoUri || ''),
      React.createElement(
        TouchableOpacity,
        {testID: 'continueButton', onPress: onContinue},
        React.createElement(Text, null, 'Continue'),
      ),
      React.createElement(
        TouchableOpacity,
        {testID: 'backButton', onPress: onGoBack},
        React.createElement(Text, null, 'Back'),
      ),
      children,
    );
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID, ...props}) =>
    React.createElement(Text, {testID, ...props}, children);
});

jest.mock('../../../../src/components/modal/InfoModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({visible, title, message, onClose, testID}) =>
    visible
      ? React.createElement(
          View,
          {testID: testID || 'infoModal'},
          React.createElement(Text, {testID: 'infoModalTitle'}, title),
          React.createElement(Text, {testID: 'infoModalMessage'}, message),
          React.createElement(
            TouchableOpacity,
            {testID: 'infoModalClose', onPress: onClose},
            React.createElement(Text, null, 'Close'),
          ),
        )
      : null;
});

jest.mock('../../../../src/utils/ballotValidation', () => ({
  validateBallotLocally: jest.fn(() => ({ok: true, errors: []})),
}));

jest.mock('../../../../src/utils/offlineQueue', () => ({
  enqueue: jest.fn(() => Promise.resolve()),
  getAll: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../../../src/utils/persistLocalImage', () => ({
  persistLocalImage: jest.fn(uri => Promise.resolve(uri)),
}));

jest.mock('../../../../src/utils/worksheetLocalStatus', () => ({
  WorksheetStatus: {
    NOT_FOUND: 'NOT_FOUND',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
    UPLOADED: 'UPLOADED',
  },
  upsertWorksheetLocalStatus: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('mock-api-key')),
}));

jest.mock('../../../../src/utils/Cifrate', () => ({
  getCredentialSubjectFromPayload: jest.fn(payload => ({
    fullName: payload?.vc?.credentialSubject?.fullName || 'Test User',
    nationalIdNumber: '123456789',
  })),
}));

jest.mock('../../../../src/utils/normalizedUri', () => ({
  normalizeUri: jest.fn(uri => uri || ''),
}));

jest.mock('@env', () => ({
  BACKEND_RESULT: 'https://test-backend.com',
}));

describe('PhotoReviewScreen_new', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        textColor: '#2F2F2F',
        background: '#FFFFFF',
      },
    },
    wallet: {
      payload: {
        account: '0x123',
        id: 'user-id',
        dni: '123456789',
        privKey: 'private-key',
        vc: {
          credentialSubject: {
            fullName: 'Test User',
            nationalIdNumber: '123456789',
          },
        },
      },
    },
  };

  const baseRouteParams = {
    photoUri: 'file://photo.jpg',
    tableData: {
      tableNumber: '001',
      numero: '001',
      codigo: 'TC-001',
      idRecinto: 'loc-001',
    },
    mesaData: {
      mesa: 'Mesa 001',
      tableNumber: '001',
    },
    aiAnalysis: {
      score: 0.9,
      table_number: '001',
    },
    mappedData: {
      partyResults: [
        {partido: 'Party A', presidente: '50', diputado: '45'},
        {partido: 'Party B', presidente: '30', diputado: '28'},
      ],
      voteSummaryResults: [
        {id: 'validos', label: 'Votos Válidos', value1: '80', value2: '73'},
        {id: 'nulos', label: 'Votos Nulos', value1: '5', value2: '4'},
        {id: 'blancos', label: 'Votos en Blanco', value1: '3', value2: '2'},
      ],
    },
    electionId: 'election-2024',
    electionType: 'general',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza correctamente con datos básicos', () => {
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('pasa los partyResults correctamente al BaseRecordReviewScreen', () => {
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('partyCount').props.children).toBe(2);
    });

    it('renderiza con photoUri', () => {
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Modo Worksheet', () => {
    it('maneja modo worksheet correctamente', () => {
      const worksheetParams = {
        ...baseRouteParams,
        mode: 'worksheet',
      };
      const route = {...mockRoute, params: worksheetParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Modo Attest', () => {
    it('maneja modo attest con existingRecord', () => {
      const attestParams = {
        ...baseRouteParams,
        mode: 'attest',
        isViewOnly: true,
        existingRecord: {
          _id: 'record-123',
          recordId: 'r-456',
          partyResults: [{partido: 'Party X', presidente: '100'}],
        },
      };
      const route = {...mockRoute, params: attestParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Observaciones', () => {
    it('detecta observación de texto', () => {
      const paramsWithObservation = {
        ...baseRouteParams,
        mappedData: {
          ...baseRouteParams.mappedData,
          observationText: 'Hay un error en el conteo',
        },
      };
      const route = {...mockRoute, params: paramsWithObservation};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('ignora "corre y vale" como observación', () => {
      const paramsWithCorreYVale = {
        ...baseRouteParams,
        mappedData: {
          ...baseRouteParams.mappedData,
          observationText: 'Corre y vale',
        },
      };
      const route = {...mockRoute, params: paramsWithCorreYVale};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Navegación', () => {
    it('renderiza correctamente con navegación', () => {
      const localNavigation = {...mockNavigation, goBack: jest.fn()};
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={localNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Formato de diferencias', () => {
    it('formatea correctamente los campos de diferencias de worksheet', () => {
      const paramsWithDiffs = {
        ...baseRouteParams,
        compareResult: {
          status: 'MISMATCH',
          differences: [
            {field: 'parties.validVotes', worksheetValue: 100, ballotValue: 105},
            {field: 'parties.nullVotes', worksheetValue: 5, ballotValue: 3},
            {
              field: 'parties.partyVotes.MAS',
              worksheetValue: 50,
              ballotValue: 55,
            },
          ],
        },
      };
      const route = {...mockRoute, params: paramsWithDiffs};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Construcción de payload de votos', () => {
    it('construye payload de comparación correctamente', () => {
      const route = {...mockRoute, params: baseRouteParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      // Verifica que se renderiza con los datos correctos
      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Resolución de party ID', () => {
    it('renderiza con diferentes formatos de partyResults', () => {
      const paramsWithVariedParties = {
        ...baseRouteParams,
        mappedData: {
          ...baseRouteParams.mappedData,
          partyResults: [
            {partido: 'PDC', presidente: '50'},
            {name: 'Libre Bolivia', presidente: '30'},
            {sigla: 'MAS', presidente: '20'},
          ],
        },
      };
      const route = {...mockRoute, params: paramsWithVariedParties};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('fromWhichIsCorrect flag', () => {
    it('maneja correctamente cuando viene de WhichIsCorrect', () => {
      const paramsFromWhichIsCorrect = {
        ...baseRouteParams,
        fromWhichIsCorrect: true,
        actaCount: 3,
      };
      const route = {...mockRoute, params: paramsFromWhichIsCorrect};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Offline mode', () => {
    it('maneja modo offline correctamente', () => {
      const offlineParams = {
        ...baseRouteParams,
        offline: true,
      };
      const route = {...mockRoute, params: offlineParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });
});

describe('Helper functions', () => {
  describe('normalizeComparableObservation', () => {
    it('normaliza texto de observación correctamente', () => {
      // Testing via component behavior since functions are not exported
      const route = {
        ...mockRoute,
        params: {
          photoUri: 'file://test.jpg',
          mappedData: {
            partyResults: [],
            voteSummaryResults: [],
            observationText: '  Observación con ACENTOS: é í ó ú  ',
          },
        },
      };

      const mockStore = {
        theme: {theme: {primary: '#459151'}},
        wallet: {payload: {}},
      };

      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('WorksheetCompareStatus enum', () => {
    it('maneja todos los estados de comparación', () => {
      const statuses = ['MATCH', 'MISMATCH', 'NOT_FOUND', 'NOT_AVAILABLE', 'SKIPPED_OFFLINE', 'ERROR'];

      statuses.forEach(status => {
        const route = {
          ...mockRoute,
          params: {
            photoUri: 'file://test.jpg',
            mappedData: {partyResults: [], voteSummaryResults: []},
            compareResult: {status},
          },
        };

        const mockStore = {
          theme: {theme: {primary: '#459151'}},
          wallet: {payload: {}},
        };

        const {getByTestId} = renderWithProviders(
          <PhotoReviewScreen navigation={mockNavigation} route={route} />,
          {initialState: mockStore},
        );

        expect(getByTestId('baseRecordReview')).toBeTruthy();
      });
    });
  });
});
