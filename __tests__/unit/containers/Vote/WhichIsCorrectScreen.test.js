/**
 * Tests for WhichIsCorrectScreen
 * Tests de pantalla de selección de acta correcta
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import WhichIsCorrectScreen from '../../../../src/container/Vote/WitnessRecord/WhichIsCorrectScreen';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../setup/test-utils';

// Mocks
jest.mock('../../../../src/container/Vote/WitnessRecord/actasData', () => ({
  fetchActasByMesa: jest.fn(() =>
    Promise.resolve([
      {
        _id: 'acta1',
        image: 'ipfs://QmTest123',
        partyResults: [{party: 'Party A', votes: 100}],
        voteSummaryResults: {total: 100, valid: 95},
      },
      {
        _id: 'acta2',
        image: 'https://example.com/acta2.jpg',
        partyResults: [{party: 'Party B', votes: 50}],
        voteSummaryResults: {total: 50, valid: 48},
      },
    ]),
  ),
}));

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

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return ({testID, title}) =>
    React.createElement(View, {testID}, React.createElement(Text, null, title));
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children, testID}) =>
    React.createElement(Text, {testID}, children);
});

jest.mock('../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {TouchableOpacity, Text} = require('react-native');
  return ({testID, title, onPress}) =>
    React.createElement(
      TouchableOpacity,
      {testID, onPress},
      React.createElement(Text, null, title),
    );
});

jest.mock('../../../../src/components/modal/CustomModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, visible, title, message, onConfirm}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(Text, null, title),
          React.createElement(Text, null, message),
          React.createElement(
            TouchableOpacity,
            {testID: 'modalConfirmBtn', onPress: onConfirm},
            React.createElement(Text, null, 'Confirm'),
          ),
        )
      : null;
});

describe('WhichIsCorrectScreen', () => {
  const mockStore = {
    theme: {
      theme: {
        primary: '#459151',
        dark: false,
        textColor: '#2F2F2F',
      },
    },
  };

  const routeWithParams = {
    ...mockRoute,
    params: {
      electionId: 'election1',
      electionType: 'president',
      mesaData: {
        mesa: 'Mesa 001',
        tableNumber: '001',
      },
      existingActas: [],
      photoUri: 'file://photo.jpg',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el contenedor principal', () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectContainer')).toBeTruthy();
    });

    it('renderiza el header', () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrectHeader')).toBeTruthy();
    });

    it('renderiza el texto de la pregunta', () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrect_questionText')).toBeTruthy();
    });
  });

  describe('Carga de Actas', () => {
    it('muestra indicador de carga mientras carga actas', () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('whichIsCorrect_loadingContainer')).toBeTruthy();
    });

    it('muestra actas después de cargar', async () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrect_imageCard_0')).toBeTruthy();
      });
    });
  });

  describe('Selección de Imagen', () => {
    it('selecciona imagen al presionar', async () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const imageCard = getByTestId('whichIsCorrect_imageCard_0');
        fireEvent.press(imageCard);
      });
    });
  });

  describe('Botones de Acción', () => {
    it('renderiza el botón de datos no correctos', async () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        expect(getByTestId('whichIsCorrect_datosNoCorrectosButton')).toBeTruthy();
      });
    });

    it('muestra modal al presionar datos no correctos', async () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const button = getByTestId('whichIsCorrect_datosNoCorrectosButton');
        fireEvent.press(button);
        expect(getByTestId('whichIsCorrectModal')).toBeTruthy();
      });
    });
  });

  describe('IPFS Handling', () => {
    it('maneja diferentes formatos de URI de imagen', async () => {
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        // Debería manejar tanto ipfs:// como https://
        expect(getByTestId('whichIsCorrect_imageCard_0')).toBeTruthy();
        expect(getByTestId('whichIsCorrect_imageCard_1')).toBeTruthy();
      });
    });
  });

  describe('Navegación', () => {
    it('navega a PhotoReviewScreen al ver detalles', async () => {
      const localNavigation = {...mockNavigation, navigate: jest.fn()};
      const {getByTestId} = renderWithProviders(
        <WhichIsCorrectScreen
          navigation={localNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      await waitFor(() => {
        const imageCard = getByTestId('whichIsCorrect_imageCard_0');
        fireEvent.press(imageCard);
      });

      // Verificar navegación después de selección
      expect(localNavigation.navigate).toHaveBeenCalled();
    });
  });
});
