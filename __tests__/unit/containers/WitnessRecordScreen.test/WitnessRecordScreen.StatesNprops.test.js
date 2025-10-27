import './jestMocks';

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import WitnessRecordScreen from '../../../../src/container/Vote/WitnessRecord/WitnessRecord';

const stylesModule = require('../../../../src/styles/searchTableStyles');
const {
  defaultTables,
  buildNavigation,
  buildRoute,
  mockSearchLogic,
  mockFetchMesasSuccess,
  mockAxiosTablesResponse,
} = require('./testUtils');

describe('WitnessRecordScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchLogic();
    mockFetchMesasSuccess();
    mockAxiosTablesResponse({data: {tables: defaultTables}});
  });

  const renderComponent = ({navigation, route, hookOverrides, skipMockHook} = {}) => {
    const navMock = navigation ?? buildNavigation();
    const routeMock = route ?? buildRoute();
    if (!skipMockHook) {
      mockSearchLogic(hookOverrides);
    }

    return {
      navigation: navMock,
      route: routeMock,
      ...render(<WitnessRecordScreen navigation={navMock} route={routeMock} />),
    };
  };

  test('sincroniza el valor de búsqueda con el hook useSearchTableLogic', async () => {
    const {getByTestId} = renderComponent({hookOverrides: {searchText: 'Mesa Central'}});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));
    expect(baseScreen.props.searchValue).toBe('Mesa Central');
  });

  test('invoca setSearchText al modificar el campo de búsqueda', async () => {
    const setSearchText = jest.fn();
    const {getByTestId} = renderComponent({hookOverrides: {setSearchText}});

    const searchInput = await waitFor(() => getByTestId('baseSearchTableScreenSearchInput'));

    fireEvent.changeText(searchInput, 'Mesa Nueva');

    expect(setSearchText).toHaveBeenCalledWith('Mesa Nueva');
  });

  test('propaga los colores del tema y callbacks del hook al componente base', async () => {
    const handlers = mockSearchLogic({
      colors: {
        primary: '#003366',
        background: '#F0F0F0',
        text: '#101010',
        textSecondary: '#303030',
        primaryLight: '#AACCEE',
      },
      handleBack: jest.fn(),
      handleNotificationPress: jest.fn(),
      handleHomePress: jest.fn(),
      handleProfilePress: jest.fn(),
    });

    const {getByTestId} = renderComponent({skipMockHook: true});
    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(baseScreen.props.colors).toEqual(handlers.colors);
    expect(baseScreen.props.onBack).toBe(handlers.handleBack);
    expect(baseScreen.props.onNotificationPress).toBe(
      handlers.handleNotificationPress,
    );
    expect(baseScreen.props.onHomePress).toBe(handlers.handleHomePress);
    expect(baseScreen.props.onProfilePress).toBe(handlers.handleProfilePress);
  });

  test('genera estilos mediante createSearchTableStyles y los entrega al componente base', async () => {
  const styles = {container: {backgroundColor: 'yellow'}};
    stylesModule.createSearchTableStyles.mockReturnValue(styles);

  const {getByTestId} = renderComponent();
    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

  expect(stylesModule.createSearchTableStyles).toHaveBeenCalled();
    expect(baseScreen.props.styles).toBe(styles);
  });

  test('expone la información de ubicación almacenada en el estado cuando proviene de la API', async () => {
    const remoteInfo = {
      data: {
        name: 'Colegio San Martín',
        address: 'Calle Falsa 123',
        code: 'CSM-09',
        tables: defaultTables,
      },
    };

    mockAxiosTablesResponse(remoteInfo);

    const {getByTestId} = renderComponent({route: buildRoute({locationId: 'remote-001'})});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(baseScreen.props.locationData).toEqual({
      name: 'Colegio San Martín',
      address: 'Calle Falsa 123',
      code: 'CSM-09',
    });
    expect(baseScreen.props.tables).toEqual(defaultTables);
  });
});
