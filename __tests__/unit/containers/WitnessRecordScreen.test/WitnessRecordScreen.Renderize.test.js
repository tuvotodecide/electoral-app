import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import axios from 'axios';
import WitnessRecordScreen from '../../../../src/container/Vote/WitnessRecord/WitnessRecord';

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

const buildSearchLogicState = overrides => ({
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

const renderScreen = (props = {}) => {
  const navigation = props.navigation || {navigate: jest.fn(), goBack: jest.fn()};
  const route = props.route || {};
  return {
    navigation,
    route,
    ...render(<WitnessRecordScreen navigation={navigation} route={route} />),
  };
};

describe('WitnessRecordScreen - Renderizado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSearchTableLogic.mockReturnValue(buildSearchLogicState());
    fetchMesas.mockResolvedValue({success: true, data: mockMesasData});
    axios.get.mockResolvedValue({data: {tables: mockMesasData}});
  });

  test('muestra indicador de carga inicial y luego renderiza la tabla con datos locales', async () => {
    const {getByTestId, queryByTestId} = renderScreen();

    expect(getByTestId('witnessRecordLoadingIndicator')).toBeTruthy();
    expect(getByTestId('witnessRecordLoadingText').props.children).toBe('Cargando mesas...');

    await waitFor(() => {
      expect(queryByTestId('witnessRecordLoadingIndicator')).toBeNull();
    });

    const baseScreen = getByTestId('witnessRecordBaseScreen');
    expect(baseScreen.props.tables).toEqual(mockMesasData);
    expect(baseScreen.props.searchValue).toBe('');
    expect(baseScreen.props.title).toBe('Buscar Mesa');
    expect(baseScreen.props.chooseTableText).toBe('Por favor, elige una mesa');
  });

  test('renderiza BaseSearchTableScreen con los estilos y callbacks del hook', async () => {
    const customHandlers = buildSearchLogicState({
      searchText: 'mesa',
      setSearchText: jest.fn(),
      handleBack: jest.fn(),
      handleNotificationPress: jest.fn(),
      handleHomePress: jest.fn(),
      handleProfilePress: jest.fn(),
    });

    useSearchTableLogic.mockReturnValue(customHandlers);

    const {getByTestId} = renderScreen();

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(baseScreen.props.searchValue).toBe('mesa');
    expect(baseScreen.props.onBack).toBe(customHandlers.handleBack);
    expect(baseScreen.props.onNotificationPress).toBe(
      customHandlers.handleNotificationPress,
    );
    expect(baseScreen.props.onHomePress).toBe(customHandlers.handleHomePress);
    expect(baseScreen.props.onProfilePress).toBe(customHandlers.handleProfilePress);
    expect(baseScreen.props.styles).toBeDefined();
  });

  test('carga información remota cuando se proporciona locationId', async () => {
    const remoteResponse = {
      data: {
        name: 'Unidad Educativa Central',
        address: 'Av. Siempre Viva 123',
        code: 'UEC-001',
        tables: [
          {
            id: 'remota-1',
            tableNumber: 'Mesa 99',
            tableCode: '0099',
          },
        ],
      },
    };

    axios.get.mockResolvedValue(remoteResponse);

    const {getByTestId} = renderScreen({route: {params: {locationId: 'loc-123'}}});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(fetchMesas).not.toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith(
      'http://192.168.1.16:3000/api/v1/geographic/electoral-locations/686e0624eb2961c4b31bdb7d/tables',
    );
    expect(baseScreen.props.tables).toEqual(remoteResponse.data.tables);
    expect(baseScreen.props.locationData).toEqual({
      name: 'Unidad Educativa Central',
      address: 'Av. Siempre Viva 123',
      code: 'UEC-001',
    });
  });
});
