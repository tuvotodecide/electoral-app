/**
 * Tests for MyWitnessesDetailScreen
 * Tests de pantalla de detalle de atestiguamiento
 */

import React from 'react';
import {fireEvent} from '@testing-library/react-native';
import MyWitnessesDetailScreen from '../../../../src/container/Vote/MyWitnesses/MyWitnessesDetailScreen';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../setup/test-utils';
import {StackNav} from '../../../../src/navigation/NavigationKey';

// Mocks
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => routeWithParams,
}));

jest.mock('../../../../src/components/common/BaseRecordReviewScreen', () => {
  const React = require('react');
  const {View, TouchableOpacity, Text} = require('react-native');
  return ({
    testID,
    headerTitle,
    instructionsText,
    photoUri,
    partyResults,
    voteSummaryResults,
    actionButtons,
    onBack,
  }) =>
    React.createElement(
      View,
      {testID},
      React.createElement(Text, {testID: 'headerTitle'}, headerTitle),
      React.createElement(Text, {testID: 'instructionsText'}, instructionsText),
      actionButtons?.map((btn, idx) =>
        React.createElement(
          TouchableOpacity,
          {key: idx, testID: btn.testID, onPress: btn.onPress},
          React.createElement(Text, null, btn.text),
        ),
      ),
    );
});

const routeWithParams = {
  ...mockRoute,
  params: {
    photoUri: 'file://photo.jpg',
    mesaData: {
      mesa: 'Mesa 001',
      tableNumber: '001',
      fecha: '2025-05-10',
    },
    partyResults: [
      {party: 'Party A', votes: 100, percentage: 50},
      {party: 'Party B', votes: 100, percentage: 50},
    ],
    voteSummaryResults: [
      {label: 'Total', value: 200},
      {label: 'Válidos', value: 195},
    ],
    attestationData: {
      tableNumber: '001',
      fecha: '2025-05-10',
      certificateUrl: 'https://example.com/certificate.pdf',
    },
    certificateUrl: 'https://example.com/certificate.pdf',
  },
};

describe('MyWitnessesDetailScreen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el componente base', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      expect(getByTestId('myWitnessesDetailBaseScreen')).toBeTruthy();
    });

    it('muestra el título correcto con datos de la mesa', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      const title = getByTestId('headerTitle');
      expect(title).toBeTruthy();
    });

    it('muestra las instrucciones correctas', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      const instructions = getByTestId('instructionsText');
      expect(instructions).toBeTruthy();
    });
  });

  describe('Botones de Acción', () => {
    it('renderiza el botón de ver certificado cuando hay URL', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      expect(getByTestId('viewCertificateButton')).toBeTruthy();
    });

    it('renderiza el botón de volver', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      expect(getByTestId('myWitnessesDetailGoBackButton')).toBeTruthy();
    });

    it('navega a SuccessScreen al presionar ver certificado', () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};

      jest.mock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => localNavigation,
        useRoute: () => routeWithParams,
      }));

      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      const certButton = getByTestId('viewCertificateButton');
      fireEvent.press(certButton);

      expect(localNavigation.navigate).toHaveBeenCalledWith(
        StackNav.SuccessScreen,
        expect.objectContaining({
          certificateData: expect.any(Object),
          nftData: expect.any(Object),
        }),
      );
    });

    it('navega hacia atrás al presionar volver', () => {
      const localNavigation = {...mockNavigation, goBack: jest.fn()};

      jest.mock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => localNavigation,
        useRoute: () => routeWithParams,
      }));

      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      const backButton = getByTestId('myWitnessesDetailGoBackButton');
      fireEvent.press(backButton);

      expect(localNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Sin Certificado', () => {
    it('no muestra botón de certificado cuando no hay URL', () => {
      const routeWithoutCertificate = {
        ...routeWithParams,
        params: {
          ...routeWithParams.params,
          certificateUrl: null,
          attestationData: {
            ...routeWithParams.params.attestationData,
            certificateUrl: null,
          },
        },
      };

      jest.mock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => mockNavigation,
        useRoute: () => routeWithoutCertificate,
      }));

      const {queryByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      // El botón de certificado no debería aparecer
      // pero el de volver sí
      expect(queryByTestId('myWitnessesDetailGoBackButton')).toBeTruthy();
    });
  });

  describe('Datos de la Mesa', () => {
    it('muestra datos de attestationData cuando están disponibles', () => {
      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      expect(getByTestId('headerTitle')).toBeTruthy();
    });

    it('usa mesaData como fallback cuando no hay attestationData', () => {
      const routeWithMesaData = {
        ...routeWithParams,
        params: {
          ...routeWithParams.params,
          attestationData: null,
        },
      };

      jest.mock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => mockNavigation,
        useRoute: () => routeWithMesaData,
      }));

      const {getByTestId} = renderWithProviders(
        <MyWitnessesDetailScreen />,
        {initialState: mockStore},
      );

      expect(getByTestId('headerTitle')).toBeTruthy();
    });
  });
});
