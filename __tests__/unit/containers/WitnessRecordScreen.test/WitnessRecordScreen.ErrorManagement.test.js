import './jestMocks';

import React from 'react';
import {render, waitFor, act} from '@testing-library/react-native';
import WitnessRecordScreen from '../../../../src/container/Vote/WitnessRecord/WitnessRecord';

const {
  buildNavigation,
  buildRoute,
  mockSearchLogic,
  mockFetchMesasSuccess,
  mockFetchMesasFailure,
  mockAxiosTablesResponse,
  mockAxiosTablesFailure,
  flushPromises,
} = require('./testUtils');

describe('WitnessRecordScreen - Manejo de Errores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchLogic();
    mockFetchMesasSuccess();
    mockAxiosTablesResponse({data: {tables: []}});
  });

  const renderScreen = ({navigation, route} = {}) => {
    const navMock = navigation ?? buildNavigation();
    const routeMock = route ?? buildRoute();

    return {
      navigation: navMock,
      route: routeMock,
      ...render(<WitnessRecordScreen navigation={navMock} route={routeMock} />),
    };
  };

  const waitForModalVisible = async getByTestId => {
    const modal = await waitFor(() => getByTestId('witnessRecordModal'));
    await waitFor(() => expect(modal.props.visible).toBe(true));
    return modal;
  };

  test('muestra modal de error cuando fetchMesas responde con success=false', async () => {
    mockFetchMesasSuccess([], false);

    const {getByTestId} = renderScreen();
    const modal = await waitForModalVisible(getByTestId);

    expect(modal.props.type).toBe('error');
    expect(modal.props.message).toBe('No se pudieron cargar las mesas');
  });

  test('muestra modal de error cuando fetchMesas lanza una excepción', async () => {
    mockFetchMesasFailure(new Error('network'));

    const {getByTestId} = renderScreen();
    const modal = await waitForModalVisible(getByTestId);

    expect(modal.props.type).toBe('error');
    expect(modal.props.message).toBe('Error al cargar las mesas');
  });

  test('presenta modal informativo cuando la respuesta remota no incluye tablas', async () => {
    mockAxiosTablesResponse({
      data: {
        name: 'Escuela Sin Mesas',
        address: 'Av. Vacía 0',
        code: 'ESM-00',
      },
    });

    const {getByTestId} = renderScreen({route: buildRoute({locationId: 'no-tables'})});
    const modal = await waitForModalVisible(getByTestId);

    expect(modal.props.type).toBe('info');
    expect(modal.props.message).toBe('No se pudieron cargar las mesas');
  });

  test('mantiene la pantalla sin modal cuando la respuesta remota contiene tablas vacías', async () => {
    mockAxiosTablesResponse({
      data: {
        tables: [],
      },
    });

    const {getByTestId} = renderScreen({route: buildRoute({locationId: 'empty-tables'})});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));
    expect(baseScreen.props.tables).toEqual([]);
    expect(getByTestId('witnessRecordModal').props.visible).toBe(false);
  });

  test('gestiona errores en la carga remota mostrando modal de tipo error', async () => {
    mockAxiosTablesFailure(new Error('api down'));

    const {getByTestId} = renderScreen({route: buildRoute({locationId: 'fail-remote'})});
    const modal = await waitForModalVisible(getByTestId);

    expect(modal.props.type).toBe('error');
    expect(modal.props.message).toBe('Error al cargar las mesas');
  });

  test('cierra el modal cuando se invoca onClose', async () => {
    mockFetchMesasSuccess([], false);

    const {getByTestId} = renderScreen();
    const modal = await waitForModalVisible(getByTestId);

    await act(async () => {
      modal.props.onClose?.();
      await flushPromises();
    });

    expect(getByTestId('witnessRecordModal').props.visible).toBe(false);
  });
});
