import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import BaseSearchTableScreenUser from '../../../../src/components/common/BaseSearchTableScreenUser';
import {renderWithProviders} from '../../../setup/test-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  NavigationContainer: ({children}) => children,
  createNavigationContainerRef: () => ({
    current: null,
    isReady: jest.fn(() => true),
    navigate: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

const styles = {
  container: {},
  tableList: {},
  mesaList: {},
  mesaCard: {},
  mesaCardTitle: {},
  mesaCardDetail: {},
  tableCard: {},
  tableCardTitle: {},
  tableCardDetail: {},
};

describe('BaseSearchTableScreenUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cuando auto-verificaciÃ³n estÃ¡ deshabilitada usa onTablePress', () => {
    const onTablePress = jest.fn();
    const {getByText} = renderWithProviders(
      <BaseSearchTableScreenUser
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1', tableCode: 'A-1'}]}
        styles={styles}
        enableAutoVerification={false}
        onTablePress={onTablePress}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.press(getByText('Mesa 1'));
    expect(onTablePress).toHaveBeenCalled();
  });

  it('navega a WhichIsCorrectScreen cuando hay registros', async () => {
    const axios = require('axios');
    axios.get.mockResolvedValueOnce({
      data: [
        {
          _id: 'rec-1',
          image: 'ipfs://cid',
          votes: {parties: {partyVotes: [{partyId: 'a', votes: 1}]}},
        },
      ],
    });
    AsyncStorage.getItem.mockResolvedValueOnce('');

    const {getByText} = renderWithProviders(
      <BaseSearchTableScreenUser
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1', tableCode: 'A-1'}]}
        styles={styles}
        enableAutoVerification={true}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.press(getByText('Mesa 1'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it('muestra modal cuando falta cÃ³digo de mesa', async () => {
    const {getByTestId, getByText} = renderWithProviders(
      <BaseSearchTableScreenUser
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1'}]}
        styles={styles}
        enableAutoVerification={true}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.press(getByText('Mesa 1'));
    await waitFor(() =>
      expect(getByText(/No se pudo encontrar el/)).toBeTruthy(),
    );
  });

  it('navega a TableDetail cuando no hay registros', async () => {
    const axios = require('axios');
    axios.get.mockResolvedValueOnce({data: []});
    AsyncStorage.getItem.mockResolvedValueOnce('');

    const {getByTestId, getByText} = renderWithProviders(
      <BaseSearchTableScreenUser
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1', tableCode: 'A-1'}]}
        styles={styles}
        enableAutoVerification={true}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.press(getByText('Mesa 1'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it('filtra mesas por bÃºsqueda', () => {
    const {getByTestId, queryByText, getAllByTestId} = renderWithProviders(
      <BaseSearchTableScreenUser
        colors={{}}
        title="Mesas"
        tables={[
          {tableNumber: '2', tableCode: 'A-2'},
          {tableNumber: '1', tableCode: 'A-1'},
        ]}
        styles={styles}
        locationData={{locationId: 'loc-1'}}
      />,
    );

    fireEvent.changeText(getByTestId('searchInputTextInput'), '2');
    expect(queryByText('Mesa 1')).toBeNull();
    expect(getAllByTestId('icon-file-tray-full-sharp')).toHaveLength(1);
  });
});
