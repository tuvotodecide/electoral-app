import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
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

describe('WitnessRecordScreen - Estados y Props', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMesas.mockResolvedValue({success: true, data: mockMesasData});
    axios.get.mockResolvedValue({data: {tables: mockMesasData}});
  });

  const renderComponent = (hookOverrides = {}, route = {}) => {
    useSearchTableLogic.mockReturnValue(buildHookState(hookOverrides));

    return render(
      <WitnessRecordScreen
        navigation={{navigate: jest.fn(), goBack: jest.fn()}}
        route={route}
      />,
    );
  };

  test('sincroniza el texto de búsqueda del hook con el componente base', async () => {
    const {getByTestId} = renderComponent({searchText: 'mesa 1'});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));
    expect(baseScreen.props.searchValue).toBe('mesa 1');
  });

  test('actualiza el estado del hook cuando cambia el texto de búsqueda', async () => {
    const setSearchText = jest.fn();
    const {getByTestId} = renderComponent({setSearchText});

    const searchInput = await waitFor(() => getByTestId('baseSearchTableScreenSearchInput'));

    fireEvent.changeText(searchInput, 'Nueva Mesa');

    expect(setSearchText).toHaveBeenCalledWith('Nueva Mesa');
  });

  test('almacena y expone la información de ubicación obtenida desde la API', async () => {
    axios.get.mockResolvedValue({
      data: {
        data: {
          name: 'Colegio San Martín',
          address: 'Calle Falsa 123',
          code: 'CSM-09',
          tables: mockMesasData,
        },
      },
    });

  const {getByTestId} = renderComponent({}, {params: {locationId: 'remote-001'}});

    const baseScreen = await waitFor(() => getByTestId('witnessRecordBaseScreen'));

    expect(baseScreen.props.locationData).toEqual({
      name: 'Colegio San Martín',
      address: 'Calle Falsa 123',
      code: 'CSM-09',
    });
    expect(baseScreen.props.tables).toEqual(mockMesasData);
  });
});
