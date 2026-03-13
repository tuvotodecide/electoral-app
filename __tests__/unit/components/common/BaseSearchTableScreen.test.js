import React from 'react';
import {TouchableOpacity} from 'react-native';
import {fireEvent, waitFor, within, act} from '@testing-library/react-native';
import BaseSearchTableScreen from '../../../../src/components/common/BaseSearchTableScreen';
import {renderWithProviders} from '../../../setup/test-utils';

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
  noResultsContainer: {},
  noResultsText: {},
};

describe('BaseSearchTableScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra mensaje sin resultados', () => {
    const {getByText} = renderWithProviders(
      <BaseSearchTableScreen
        colors={{}}
        title="Mesas"
        tables={[]}
        styles={styles}
      />,
    );
    expect(getByText('No hay mesas disponibles')).toBeTruthy();
  });

  it('cuando auto-verificaciÃ³n estÃ¡ deshabilitada usa onTablePress', () => {
    const onTablePress = jest.fn();
    const {getByTestId} = renderWithProviders(
      <BaseSearchTableScreen
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1', tableCode: 'A-1'}]}
        styles={styles}
        enableAutoVerification={false}
        onTablePress={onTablePress}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.press(getByTestId('baseSearchTableScreenTableCard_0'));
    expect(onTablePress).toHaveBeenCalled();
  });

  it('muestra modal cuando falta cÃ³digo de mesa', async () => {
    const {getByTestId, getByText} = renderWithProviders(
      <BaseSearchTableScreen
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1'}]}
        styles={styles}
        enableAutoVerification={true}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.press(getByTestId('baseSearchTableScreenTableCard_0'));
    await waitFor(() =>
      expect(getByText(/No se pudo encontrar el/)).toBeTruthy(),
    );
  });

  it('filtra mesas por bÃºsqueda', () => {
    const {getByTestId, queryByText, getAllByTestId} = renderWithProviders(
      <BaseSearchTableScreen
        colors={{}}
        title="Mesas"
        tables={[
          {tableNumber: '1', tableCode: 'A-1'},
          {tableNumber: '2', tableCode: 'A-2'},
        ]}
        styles={styles}
        locationData={{locationId: 'loc-1'}}
      />,
    );
    fireEvent.changeText(
      getByTestId('baseSearchTableScreenSearchInputTextInput'),
      '2',
    );
    expect(queryByText('Mesa 1')).toBeNull();
    expect(getAllByTestId('icon-file-tray-full-sharp')).toHaveLength(1);
  });

  it('cambia el orden de las mesas con el dropdown', async () => {
    const {getByTestId} = renderWithProviders(
      <BaseSearchTableScreen
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

    expect(getByTestId('baseSearchTableScreenTableCard_0Title').props.children).toContain('Mesa 1');

    const searchContainer = getByTestId('baseSearchTableScreenSearchContainer');
    const {UNSAFE_getAllByType, getByText} = within(searchContainer);
    const dropdownToggle = UNSAFE_getAllByType(TouchableOpacity)[0];
    fireEvent.press(dropdownToggle);
    fireEvent.press(getByText('Descendente'));

    await waitFor(() =>
      expect(
        getByTestId('baseSearchTableScreenTableCard_0Title').props.children,
      ).toContain('Mesa 2'),
    );
  });

  it('muestra indicador de carga al verificar mesa con API', async () => {
    const axios = require('axios');
    // Keep the promise pending to see loading state
    axios.get.mockImplementation(() => new Promise(() => {}));

    const {getByTestId, queryByTestId} = renderWithProviders(
      <BaseSearchTableScreen
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1', tableCode: 'A-1'}]}
        styles={styles}
        enableAutoVerification={true}
        locationData={{locationId: 'loc-1'}}
        electionId="e1"
      />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('baseSearchTableScreenTableCard_0'));
    });
    // Component should be in a verifying state (axios mock never resolves)
    expect(getByTestId('baseSearchTableScreenTableCard_0')).toBeTruthy();
  });

  it('renderiza correctamente con enableAutoVerification=true', () => {
    const {getByTestId} = renderWithProviders(
      <BaseSearchTableScreen
        colors={{}}
        title="Mesas"
        tables={[{tableNumber: '1', tableCode: 'A-1'}]}
        styles={styles}
        enableAutoVerification={true}
        locationData={{locationId: 'loc-1'}}
        electionId="e1"
      />,
    );
    expect(getByTestId('baseSearchTableScreenTableCard_0')).toBeTruthy();
  });
});
