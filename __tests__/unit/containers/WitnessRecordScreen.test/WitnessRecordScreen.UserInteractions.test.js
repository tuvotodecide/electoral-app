import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import axios from 'axios';
import WitnessRecordScreen from '../../../../src/container/Vote/WitnessRecord/WitnessRecord';
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock('axios');

jest.mock(
  '../../../../src/components/common/BaseSearchTableScreen',
  () => require('../../../__mocks__/components/common/BaseSearchTableScreen').default,
);

jest.mock(
  '../../../../src/components/common/CustomModal',
  () => require('../../../__mocks__/components/common/CustomModal').default,
);

jest.mock(
  '../../../../src/components/common/CText',
  () => require('../../../__mocks__/components/common/CText').default,
);

jest.mock(
  '../../../../src/hooks/useSearchTableLogic',
  () => require('../../../__mocks__/hooks/useSearchTableLogic'),
);

jest.mock(
  '../../../../src/data/mockMesas',
  () => require('../../../__mocks__/data/mockMesas'),
);

jest.mock(
  '../../../../src/i18n/String',
  () => require('../../../__mocks__/String').default,
);

const {fetchMesas, mockMesasData} = require('../../../../src/data/mockMesas');
const {useSearchTableLogic} = require('../../../../src/hooks/useSearchTableLogic');

const buildHookState = overrides => ({
  colors: {
    primary: '#4F9858',
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    primaryLight: '#E8F5E8',
  },
  searchText: '',
  setSearchText: jest.fn(),
  handleBack: jest.fn(),
  handleNotificationPress: jest.fn(),
  handleHomePress: jest.fn(),
  handleProfilePress: jest.fn(),
  ...overrides,
});

describe('WitnessRecordScreen - Interacciones de Usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMesas.mockResolvedValue({success: true, data: mockMesasData});
    axios.get.mockResolvedValue({data: {tables: mockMesasData}});
  });

  test('navega a la pantalla WhichIsCorrectScreen al seleccionar una mesa', async () => {
    const navigation = {navigate: jest.fn(), goBack: jest.fn()};
    useSearchTableLogic.mockReturnValue(buildHookState());

    const {getByTestId} = render(
      <WitnessRecordScreen navigation={navigation} route={{}} />,
    );

    await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    fireEvent.press(getByTestId('baseSearchTableScreenTableItem_0'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.WhichIsCorrectScreen,
      expect.objectContaining({
        tableData: expect.objectContaining({
          numero: expect.any(String),
          codigo: expect.any(String),
          recinto: 'Recinto Test',
          provincia: 'Provincia Test',
          originalTableData: mockMesasData[0],
        }),
        originalTable: mockMesasData[0],
      }),
    );
  });

  test('utiliza la información de ubicación para enriquecer la navegación', async () => {
    const navigation = {navigate: jest.fn(), goBack: jest.fn()};
    useSearchTableLogic.mockReturnValue(buildHookState());

    axios.get.mockResolvedValue({
      data: {
        name: 'Escuela Modelo',
        address: 'Av. Libertad 456',
        code: 'EM-22',
        tables: mockMesasData,
      },
    });

    const {getByTestId} = render(
      <WitnessRecordScreen
        navigation={navigation}
        route={{params: {locationId: 'escuela-modelo'}}}
      />,
    );

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

  test('dispara los manejadores del header y navegación inferior', async () => {
    const hookHandlers = buildHookState({
      handleBack: jest.fn(),
      handleNotificationPress: jest.fn(),
      handleHomePress: jest.fn(),
      handleProfilePress: jest.fn(),
    });

    useSearchTableLogic.mockReturnValue(hookHandlers);

    const {getByTestId} = render(
      <WitnessRecordScreen navigation={{navigate: jest.fn(), goBack: jest.fn()}} route={{}} />,
    );

    const backButton = await waitFor(() => getByTestId('baseSearchTableScreenBackButton'));
    fireEvent.press(backButton);
    fireEvent.press(getByTestId('baseSearchTableScreenNotificationButton'));
    fireEvent.press(getByTestId('baseSearchTableScreenHomeButton'));
    fireEvent.press(getByTestId('baseSearchTableScreenProfileButton'));

    expect(hookHandlers.handleBack).toHaveBeenCalled();
    expect(hookHandlers.handleNotificationPress).toHaveBeenCalled();
    expect(hookHandlers.handleHomePress).toHaveBeenCalled();
    expect(hookHandlers.handleProfilePress).toHaveBeenCalled();
  });
});
