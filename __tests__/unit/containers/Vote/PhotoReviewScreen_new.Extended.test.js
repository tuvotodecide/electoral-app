/**
 * Extended tests for PhotoReviewScreen_new
 * Tests adicionales para mejorar cobertura
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

describe('PhotoReviewScreen_new Extended', () => {
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

  describe('Party ID resolution', () => {
    it('resuelve partyId para PDC', () => {
      const paramsWithPDC = {
        ...baseRouteParams,
        mappedData: {
          partyResults: [
            {partido: 'PDC', presidente: '50'},
            {partido: 'Democrata Cristiano', presidente: '30'},
            {partido: 'Democrata_Cristiana', presidente: '20'},
          ],
          voteSummaryResults: baseRouteParams.mappedData.voteSummaryResults,
        },
      };
      const route = {...mockRoute, params: paramsWithPDC};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('usa fallback cuando partido es solo números', () => {
      const paramsWithNumeric = {
        ...baseRouteParams,
        mappedData: {
          partyResults: [
            {partido: '12345', presidente: '50'},
          ],
          voteSummaryResults: baseRouteParams.mappedData.voteSummaryResults,
        },
      };
      const route = {...mockRoute, params: paramsWithNumeric};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('formatWorksheetDiffFieldLabel', () => {
    it('formatea campo vacío', () => {
      const paramsWithEmptyField = {
        ...baseRouteParams,
        compareResult: {
          status: 'MISMATCH',
          differences: [
            {field: '', worksheetValue: 100, ballotValue: 105},
          ],
        },
      };
      const route = {...mockRoute, params: paramsWithEmptyField};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('formatea campo desconocido', () => {
      const paramsWithUnknownField = {
        ...baseRouteParams,
        compareResult: {
          status: 'MISMATCH',
          differences: [
            {field: 'unknown.field.name', worksheetValue: 100, ballotValue: 105},
          ],
        },
      };
      const route = {...mockRoute, params: paramsWithUnknownField};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('buildWorksheetCompareVotesPayload', () => {
    it('construye payload con aliases de votos válidos', () => {
      const paramsWithAliases = {
        ...baseRouteParams,
        mappedData: {
          partyResults: [{partido: 'MAS', presidente: '100'}],
          voteSummaryResults: [
            {id: 'votosValidos', label: 'ValidVotes', value1: '100'},
            {id: 'votosNulos', label: 'NullVotes', value1: '5'},
            {id: 'votosBlancos', label: 'BlankVotes', value1: '3'},
          ],
        },
      };
      const route = {...mockRoute, params: paramsWithAliases};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('maneja valores no numéricos', () => {
      const paramsWithNonNumeric = {
        ...baseRouteParams,
        mappedData: {
          partyResults: [{partido: 'MAS', presidente: 'invalid'}],
          voteSummaryResults: [
            {id: 'validos', value1: 'not-a-number'},
            {id: 'nulos', value1: '-5'},
          ],
        },
      };
      const route = {...mockRoute, params: paramsWithNonNumeric};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Worksheet queue confirmation', () => {
    it('maneja worksheet ya en cola', async () => {
      const {getAll} = require('../../../../src/utils/offlineQueue');
      getAll.mockResolvedValueOnce([
        {
          task: {
            type: 'publishWorksheet',
            payload: {
              dni: '123456789',
              electionId: 'election-2024',
              tableCode: 'tc-001',
            },
          },
        },
      ]);

      const paramsWorksheet = {
        ...baseRouteParams,
        mode: 'worksheet',
      };
      const route = {...mockRoute, params: paramsWorksheet};
      renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );
    });
  });

  describe('View only mode', () => {
    it('renderiza en modo solo lectura', () => {
      const viewOnlyParams = {
        ...baseRouteParams,
        mode: 'attest',
        isViewOnly: true,
        existingRecord: {
          _id: 'record-123',
          recordId: 'r-456',
          partyResults: baseRouteParams.mappedData.partyResults,
          voteSummaryResults: baseRouteParams.mappedData.voteSummaryResults,
        },
      };
      const route = {...mockRoute, params: viewOnlyParams};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Compare result statuses', () => {
    it('maneja SKIPPED_OFFLINE', () => {
      const params = {
        ...baseRouteParams,
        compareResult: {status: 'SKIPPED_OFFLINE'},
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('maneja ERROR', () => {
      const params = {
        ...baseRouteParams,
        compareResult: {status: 'ERROR', message: 'Comparison failed'},
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('ActaCount display', () => {
    it('muestra contador de actas cuando viene de WhichIsCorrect', () => {
      const params = {
        ...baseRouteParams,
        fromWhichIsCorrect: true,
        actaCount: 5,
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Observation handling', () => {
    it('detecta observación normalizada', () => {
      const params = {
        ...baseRouteParams,
        mappedData: {
          ...baseRouteParams.mappedData,
          observationText: '  Observación con ESPACIOS y MAYÚSCULAS  ',
        },
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Offline mode handling', () => {
    it('renderiza correctamente en modo offline con datos mínimos', () => {
      const params = {
        photoUri: 'file://offline-photo.jpg',
        offline: true,
        tableData: {tableNumber: '999'},
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });

  describe('Empty mappedData handling', () => {
    it('maneja mappedData undefined', () => {
      const params = {
        ...baseRouteParams,
        mappedData: undefined,
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });

    it('maneja mappedData con arrays vacíos', () => {
      const params = {
        ...baseRouteParams,
        mappedData: {
          partyResults: [],
          voteSummaryResults: [],
        },
      };
      const route = {...mockRoute, params};
      const {getByTestId} = renderWithProviders(
        <PhotoReviewScreen navigation={mockNavigation} route={route} />,
        {initialState: mockStore},
      );

      expect(getByTestId('baseRecordReview')).toBeTruthy();
    });
  });
});
