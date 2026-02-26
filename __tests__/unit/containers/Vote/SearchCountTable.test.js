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
    colors: {
      primary: '#459151',
      dark: false,
    },
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
    isLoading,
    searchValue,
    onSearchChange,
    onTablePress,
    tables,
  }) =>
    React.createElement(
      View,
      {testID},
      React.createElement(TextInput, {
        testID: 'searchInput',
        value: searchValue,
        onChangeText: onSearchChange,
      }),
      isLoading
        ? React.createElement(View, {testID: 'loadingIndicator'})
        : (tables || []).map((mesa, idx) =>
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

jest.mock('../../../../src/components/common/CustomModal', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');
  return ({
    testID,
    visible,
    title,
    message,
    buttonText,
    secondaryButtonText,
    onButtonPress,
    onSecondaryPress,
  }) =>
    visible
      ? React.createElement(
          View,
          {testID},
          title ? React.createElement(Text, null, title) : null,
          message ? React.createElement(Text, null, message) : null,
          React.createElement(
            TouchableOpacity,
            {testID: 'confirmBtn', onPress: onButtonPress},
            React.createElement(Text, null, buttonText || 'Confirm'),
          ),
          secondaryButtonText
            ? React.createElement(
                TouchableOpacity,
                {testID: 'cancelBtn', onPress: onSecondaryPress},
                React.createElement(Text, null, secondaryButtonText),
              )
            : null,
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
        tables: [
          {_id: 'mesa1', tableNumber: 'Mesa 001', numero: 'Mesa 001', tableCode: 'CODE001'},
          {_id: 'mesa2', tableNumber: 'Mesa 002', numero: 'Mesa 002', tableCode: 'CODE002'},
        ],
      },
      electionId: 'election1',
      electionType: 'president',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('renderiza el componente base de búsqueda', async () => {
      const {findByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(await findByTestId('searchCountTableBaseScreen')).toBeTruthy();
    });

    it('renderiza el input de búsqueda', async () => {
      const {findByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(await findByTestId('searchInput')).toBeTruthy();
    });

    it('renderiza las mesas disponibles', async () => {
      const {findByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(await findByTestId('mesaItem_0')).toBeTruthy();
      expect(await findByTestId('mesaItem_1')).toBeTruthy();
    });
  });

  describe('Estado de Carga', () => {
    it('muestra la pantalla base cuando ya terminó de cargar', () => {
      const {queryByTestId, getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      expect(queryByTestId('searchCountTableLoadingIndicator')).toBeNull();
      expect(getByTestId('searchCountTableBaseScreen')).toBeTruthy();
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
        colors: {
          primary: '#459151',
          dark: false,
        },
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
    it('muestra modal de confirmación al seleccionar mesa', async () => {
      const {findByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = await findByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      expect(await findByTestId('confirmBtn')).toBeTruthy();
    });

    it('envía anuncio al confirmar', async () => {
      const axios = require('axios');

      const {findByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = await findByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      const confirmBtn = await findByTestId('confirmBtn');
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });

    it('cancela el anuncio al presionar cancelar', async () => {
      const {findByTestId, queryByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = await findByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      const cancelBtn = await findByTestId('cancelBtn');
      fireEvent.press(cancelBtn);

      // El modal debería cerrarse
      expect(queryByTestId('confirmBtn')).toBeNull();
    });
  });

  describe('Manejo de Errores', () => {
    it('muestra modal de error cuando falla el envío', async () => {
      const axios = require('axios');
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      const {findByTestId, getByTestId} = renderWithProviders(
        <SearchCountTable
          navigation={mockNavigation}
          route={routeWithParams}
        />,
        {initialState: mockStore},
      );

      const mesaItem = await findByTestId('mesaItem_0');
      fireEvent.press(mesaItem);

      const confirmBtn = await findByTestId('confirmBtn');
      fireEvent.press(confirmBtn);

      await waitFor(() => {
        expect(getByTestId('searchCountTableModal')).toBeTruthy();
      });
    });
  });
});
