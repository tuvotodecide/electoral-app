import './jestMocks';

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import WitnessRecordScreen from '../../../../src/container/Vote/WitnessRecord/WitnessRecord';
import {StackNav} from '../../../../src/navigation/NavigationKey';

const {
  axios,
  defaultTables,
  buildNavigation,
  buildRoute,
  mockSearchLogic,
  mockFetchMesasSuccess,
  mockAxiosTablesResponse,
} = require('./testUtils');

describe('WitnessRecordScreen - Interacciones de Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMesasSuccess();
    mockAxiosTablesResponse({data: {tables: defaultTables}});
  });

  const renderScreen = ({navigation, route, hookOverrides, skipMockHook} = {}) => {
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

  test('navega a WhichIsCorrectScreen con la mesa seleccionada formateada', async () => {
    const navigation = buildNavigation();
    const {getByTestId} = renderScreen({navigation});

    await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    fireEvent.press(getByTestId('baseSearchTableScreenTableItem_0'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.WhichIsCorrectScreen,
      expect.objectContaining({
        tableData: expect.objectContaining({
          numero: defaultTables[0].numero,
          codigo: defaultTables[0].codigo,
          recinto: 'Recinto Test',
          colegio: 'Colegio Test',
          provincia: 'Provincia Test',
          originalTableData: defaultTables[0],
          locationData: null,
        }),
        originalTable: defaultTables[0],
      }),
    );
  });

  test('enriquece la navegación con datos de ubicación remotos cuando están disponibles', async () => {
    const remoteLocation = {
      name: 'Escuela Modelo',
      address: 'Av. Libertad 456',
      code: 'EM-22',
      tables: defaultTables,
    };

    mockAxiosTablesResponse({data: remoteLocation});

    const navigation = buildNavigation();
    const {getByTestId} = renderScreen({
      navigation,
      route: buildRoute({locationId: 'escuela-modelo'}),
    });

    await waitFor(() => getByTestId('witnessRecordBaseScreen'));
    fireEvent.press(getByTestId('baseSearchTableScreenTableItem_1'));

    expect(navigation.navigate).toHaveBeenLastCalledWith(
      StackNav.WhichIsCorrectScreen,
      expect.objectContaining({
        tableData: expect.objectContaining({
          recinto: 'Escuela Modelo',
          colegio: 'Escuela Modelo',
          provincia: 'Av. Libertad 456',
        }),
        locationData: {
          name: 'Escuela Modelo',
          address: 'Av. Libertad 456',
          code: 'EM-22',
        },
      }),
    );
  });

  test('usa valores alternativos basados en el id cuando faltan campos en la mesa', async () => {
    const minimalMesa = {id: 'x-1'};
    mockFetchMesasSuccess([minimalMesa]);

    const navigation = buildNavigation();
    const {getByTestId} = renderScreen({navigation});

    await waitFor(() => getByTestId('witnessRecordBaseScreen'));
    fireEvent.press(getByTestId('baseSearchTableScreenTableItem_0'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.WhichIsCorrectScreen,
      expect.objectContaining({
        tableData: expect.objectContaining({
          numero: 'x-1',
          codigo: 'x-1',
          recinto: 'N/A',
          provincia: 'N/A',
        }),
      }),
    );
  });

  test('dispara los manejadores de navegación del header y footer', async () => {
    const handlers = mockSearchLogic({
      handleBack: jest.fn(),
      handleNotificationPress: jest.fn(),
      handleHomePress: jest.fn(),
      handleProfilePress: jest.fn(),
    });

    const {getByTestId} = renderScreen({skipMockHook: true});

    const backButton = await waitFor(() => getByTestId('baseSearchTableScreenBackButton'));
    fireEvent.press(backButton);
    fireEvent.press(getByTestId('baseSearchTableScreenNotificationButton'));
    fireEvent.press(getByTestId('baseSearchTableScreenHomeButton'));
    fireEvent.press(getByTestId('baseSearchTableScreenProfileButton'));

    expect(handlers.handleBack).toHaveBeenCalledTimes(1);
    expect(handlers.handleNotificationPress).toHaveBeenCalledTimes(1);
    expect(handlers.handleHomePress).toHaveBeenCalledTimes(1);
    expect(handlers.handleProfilePress).toHaveBeenCalledTimes(1);
  });
});
