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

const {fetchMesas} = require('../../../../src/data/mockMesas');
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

describe('WitnessRecordScreen - Manejo de Errores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSearchTableLogic.mockReturnValue(buildHookState());
    axios.get.mockResolvedValue({data: {tables: []}});
  });

  test('muestra modal informativo cuando fetchMesas no es exitoso', async () => {
    fetchMesas.mockResolvedValue({success: false});

    const {getByTestId} = render(
      <WitnessRecordScreen navigation={{navigate: jest.fn(), goBack: jest.fn()}} route={{}} />,
    );

    await waitFor(() => expect(getByTestId('witnessRecordModal').props.visible).toBe(true));

    const modal = getByTestId('witnessRecordModal');
    expect(modal.props.type).toBe('error');
    expect(modal.props.message).toBe('No se pudieron cargar las mesas');
  });

  test('muestra mensaje de error cuando fetchMesas lanza una excepción', async () => {
    fetchMesas.mockRejectedValue(new Error('network'));

    const {getByTestId} = render(
      <WitnessRecordScreen navigation={{navigate: jest.fn(), goBack: jest.fn()}} route={{}} />,
    );

    await waitFor(() => expect(getByTestId('witnessRecordModal').props.visible).toBe(true));

    const modal = getByTestId('witnessRecordModal');
    expect(modal.props.message).toBe('Error al cargar las mesas');
  });

  test('gestiona errores al cargar mesas remotas mostrando modal de error', async () => {
    fetchMesas.mockResolvedValue({success: true, data: []});
    axios.get.mockRejectedValue(new Error('api down'));

    const {getByTestId} = render(
      <WitnessRecordScreen
        navigation={{navigate: jest.fn(), goBack: jest.fn()}}
        route={{params: {locationId: 'fail-remote'}}}
      />,
    );

    await waitFor(() => expect(getByTestId('witnessRecordModal').props.visible).toBe(true));

    const modal = getByTestId('witnessRecordModal');
    expect(modal.props.message).toBe('Error al cargar las mesas');
    expect(modal.props.type).toBe('error');
  });
});
