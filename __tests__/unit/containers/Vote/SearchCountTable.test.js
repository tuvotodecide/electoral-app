/**
 * Tests for SearchCountTable Screen
 * Tests de pantalla de búsqueda de mesas para anunciar conteo
 */

import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import SearchCountTable from '../../../../src/container/Vote/AnnounceCount/SearchCountTable';
import {renderWithProviders, mockNavigation, mockRoute} from '../../../setup/test-utils';

// Mocks
jest.mock('../../../../src/hooks/useSearchTableLogic', () => ({
  useSearchTableLogic: jest.fn(() => ({
    mesas: [
      {
        _id: 'mesa1',
        tableNumber: 'Mesa 001',
        numero: 'Mesa 001',
        tableCode: 'CODE001',
      },
      {
        _id: 'mesa2',
        tableNumber: 'Mesa 002',
        numero: 'Mesa 002',
        tableCode: 'CODE002',
      },
    ],
    isLoading: false,
    searchText: '',
    setSearchText: jest.fn(),
    filteredMesas: [],
    locationData: {
      _id: 'loc1',
      name: 'Colegio Test',
      address: 'Calle Test 123',
    },
  })),
}));

jest.mock('axios', () => ({
  post: jest.fn(() => Promise.resolve({data: {success: true}})),
}));

jest.mock('../../../../src/utils/offlineQueueHandler', () => ({
  authenticateWithBackend: jest.fn(() => Promise.resolve('mock-api-key')),
}));

jest.mock('react-native-paper', () => ({
  ActivityIndicator: ({testID}) => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {testID});
  },
}));

jest.mock('../../../../src/components/common/BaseSearchTableScreen', () => {
  const React = require('react');
  const {View, TouchableOpacity, Text, TextInput} = require('react-native');
  return ({
    testID,
    mesas,
    isLoading,
    searchText,
    onSearchTextChange,
    onTablePress,
    locationData,
  }) =>
    React.createElement(
      View,
      {testID},
      React.createElement(TextInput, {
        testID: 'searchInput',
        value: searchText,
        onChangeText: onSearchTextChange,
      }),
      isLoading
        ? React.createElement(View, {testID: 'loadingIndicator'})
        : mesas?.map((mesa, idx) =>
            React.createElement(
              TouchableOpacity,
              {
                key: mesa._id,
                testID: `mesaItem_${idx}`,
                onPress: () => onTablePress(mesa),
              },
              React.createElement(Text, null, mesa.tableNumber),
            ),
          ),
    );
});

jest.mock('../../../../src/components/modal/CustomModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({testID, visible, onConfirm, onCancel}) =>
    visible
      ? React.createElement(
          View,
          {testID},
          React.createElement(
            TouchableOpacity,
            {testID: 'confirmBtn', onPress: onConfirm},
            React.createElement(Text, null, 'Confirm'),
          ),
          React.createElement(
            TouchableOpacity,
            {testID: 'cancelBtn', onPress: onCancel},
            React.createElement(Text, null, 'Cancel'),
          ),
        )
      : null;
});

describe('SearchCountTable Screen', () => {
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
      },
    },
  };

  const routeWithParams = {
    ...mockRoute,
    params: {
      locationId: 'loc1',
      locationData: {
        _id: 'loc1',
        name: 'Colegio Test',
        address: 'Calle Test 123',
      },
      electionId: 'election1',
      electionType: 'president',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el componente base de búsqueda', () => {
      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('searchCountTableBaseScreen')).toBeTruthy();
    });

    it('renderiza el input de búsqueda', () => {
      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('searchInput')).toBeTruthy();
    });

    it('renderiza las mesas disponibles', () => {
      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('mesaItem_0')).toBeTruthy();
      expect(getByTestId('mesaItem_1')).toBeTruthy();
    });
  });

  describe('Estado de Carga', () => {
    it('muestra indicador de carga cuando está cargando', () => {
      const {useSearchTableLogic} = require('../../../../src/hooks/useSearchTableLogic');
      useSearchTableLogic.mockReturnValueOnce({
        mesas: [],
        isLoading: true,
        searchText: '',
        setSearchText: jest.fn(),
        filteredMesas: [],
        locationData: null,
      });

      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(getByTestId('searchCountTableLoadingIndicator')).toBeTruthy();
    });
  });

  describe('Búsqueda', () => {
    it('permite buscar mesas', () => {
      const {useSearchTableLogic} = require('../../../../src/hooks/useSearchTableLogic');
      const mockSetSearchText = jest.fn();
      useSearchTableLogic.mockReturnValue({
        mesas: [],
        isLoading: false,
        searchText: '',
        setSearchText: mockSetSearchText,
        filteredMesas: [],
        locationData: null,
      });

      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const searchInput = getByTestId('searchInput');
      fireEvent.changeText(searchInput, '001');

      expect(mockSetSearchText).toHaveBeenCalledWith('001');
    });
  });

  describe('Selección de Mesa', () => {
    it('muestra modal de confirmación al seleccionar mesa', () => {
      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = getByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      expect(getByTestId('searchCountTableModal')).toBeTruthy();
    });

    it('envía anuncio al confirmar', async () => {
      const axios = require('axios');

      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = getByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      const confirmBtn = getByTestId('confirmBtn');
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });

    it('cancela el anuncio al presionar cancelar', () => {
      const {getByTestId, queryByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = getByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      const cancelBtn = getByTestId('cancelBtn');
      fireEvent.press(cancelBtn);

      // El modal debería cerrarse
      expect(queryByTestId('searchCountTableModal')).toBeNull();
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra modal de error cuando falla el envío', async () => {
      const axios = require('axios');
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      const {getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = getByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      const confirmBtn = getByTestId('confirmBtn');
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(getByTestId('searchCountTableModal')).toBeTruthy();
      });
    });
  });
});
