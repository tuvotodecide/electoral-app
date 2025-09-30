import './jestMocks';

import React from 'react';
import {render, waitFor, act} from '@testing-library/react-native';
import WitnessRecordScreen from '../../../../src/container/Vote/WitnessRecord/WitnessRecord';

const stylesModule = require('../../../../src/styles/searchTableStyles');
const {
  axios,
  mesasModule,
  defaultTables,
  buildNavigation,
  buildRoute,
  mockSearchLogic,
  mockFetchMesasSuccess,
  mockAxiosTablesResponse,
  flushPromises,
} = require('./testUtils');

describe('WitnessRecordScreen - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchLogic();
    mockFetchMesasSuccess();
    mockAxiosTablesResponse({data: {tables: defaultTables}});
  });

  const renderScreen = ({navigation, route} = {}) => {
    const navMock = navigation ?? buildNavigation();
    const routeMock = route ?? buildRoute();

    const utils = render(
      <WitnessRecordScreen navigation={navMock} route={routeMock} />,
    );

    return {
      navigation: navMock,
      route: routeMock,
      ...utils,
    };
  };

  test('muestra indicador de carga y luego renderiza BaseSearchTableScreen con datos locales', async () => {
    const {getByTestId, queryByTestId} = renderScreen();

    expect(getByTestId('witnessRecordLoadingIndicator')).toBeTruthy();
    expect(getByTestId('witnessRecordLoadingText').props.children).toBe(
      'Cargando mesas...',
    );

  await waitFor(() => expect(queryByTestId('witnessRecordLoadingIndicator')).toBeNull());
  expect(mesasModule.fetchMesas).toHaveBeenCalledTimes(1);

    const baseScreen = getByTestId('witnessRecordBaseScreen');
    expect(baseScreen.props.tables).toEqual(defaultTables);
    expect(baseScreen.props.searchValue).toBe('');
    expect(baseScreen.props.title).toBe('Buscar Mesa');
    expect(baseScreen.props.chooseTableText).toBe('Por favor, elige una mesa');
  });

  test('utiliza los callbacks y estilos proporcionados por el hook useSearchTableLogic', async () => {
    const handlers = mockSearchLogic({
      searchText: 'mesa 20',
    });

    const {getByTestId} = renderScreen();
    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(baseScreen.props.searchValue).toBe('mesa 20');
    expect(baseScreen.props.onBack).toBe(handlers.handleBack);
    expect(baseScreen.props.onNotificationPress).toBe(
      handlers.handleNotificationPress,
    );
  expect(baseScreen.props.onHomePress).toBe(handlers.handleHomePress);
  expect(baseScreen.props.onProfilePress).toBe(handlers.handleProfilePress);
  expect(baseScreen.props.locationData).toBeNull();
    expect(stylesModule.createSearchTableStyles).toHaveBeenCalled();
  });

  test('carga información remota cuando se proporciona locationId en la ruta', async () => {
    const remoteTables = [
      {id: 'r-1', tableNumber: 'Mesa 99', tableCode: '0099', address: 'Callao'},
    ];

    mockAxiosTablesResponse({
      data: {
        name: 'Unidad Educativa Central',
        address: 'Av. Siempre Viva 123',
        code: 'UEC-001',
        tables: remoteTables,
      },
    });

    const {getByTestId} = renderScreen({route: buildRoute({locationId: 'loc-123'})});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(mesasModule.fetchMesas).not.toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith(
      'http://192.168.1.16:3000/api/v1/geographic/electoral-locations/686e0624eb2961c4b31bdb7d/tables',
    );
    expect(baseScreen.props.locationData).toEqual({
      name: 'Unidad Educativa Central',
      address: 'Av. Siempre Viva 123',
      code: 'UEC-001',
    });
    expect(baseScreen.props.tables).toEqual(remoteTables);
  });

  test('procesa el formato alternativo de la respuesta del API con data anidada', async () => {
    const nestedTables = [
      {id: 'nested-1', tableNumber: 'Mesa 12', tableCode: '0012'},
    ];

    mockAxiosTablesResponse({
      data: {
        data: {
          name: 'Colegio Nacional',
          address: 'Av. del Test 456',
          code: 'COL-777',
          tables: nestedTables,
        },
      },
    });

    const {getByTestId} = renderScreen({route: buildRoute({locationId: 'loc-987'})});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(baseScreen.props.tables).toEqual(nestedTables);
    expect(baseScreen.props.locationData).toEqual({
      name: 'Colegio Nacional',
      address: 'Av. del Test 456',
      code: 'COL-777',
    });
  });

  test('mantiene el indicador de carga mientras se espera la respuesta remota', async () => {
    let resolveAxios;
    axios.get.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveAxios = resolve;
        }),
    );

    const {getByTestId} = renderScreen({route: buildRoute({locationId: 'loc-111'})});

    expect(getByTestId('witnessRecordLoadingIndicator')).toBeTruthy();

    await act(async () => {
      resolveAxios({data: {tables: defaultTables}});
      await flushPromises();
    });

    await waitFor(() =>
      expect(getByTestId('witnessRecordBaseScreen').props.tables).toEqual(
        defaultTables,
      ),
    );
  });
});
