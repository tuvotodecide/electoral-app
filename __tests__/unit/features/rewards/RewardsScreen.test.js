import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import RewardsScreen from '../../../../src/features/rewards/screens/RewardsScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';
import {renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCHeader = ({title}) => React.createElement(Text, null, title);
  return MockCHeader;
});

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../../../../src/features/rewards/data/rewardsApi', () => ({
  useRewardsQuery: jest.fn(() => ({
    rewards: {
      data: require('../../../../src/features/rewards/data/mockRewards').getMockRewards(),
      rewardsAvailable: false,
    },
    isLoading: false,
    error: null,
  })),
}));

jest.mock('../../../../src/api/tvdToken', () => ({
  TvdTokenCalls: {
    balanceOf: jest.fn(() =>
      Promise.resolve({rawBalance: 100n * 10n ** 18n, formatted: '100'}),
    ),
  },
}));

const axios = require('axios');
const {useRewardsQuery} = require('../../../../src/features/rewards/data/rewardsApi');
const {useFocusEffect} = require('@react-navigation/native');

describe('RewardsScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  };

  const initialState = {
    wallet: {payload: {account: '0xabc'}},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // El setup global deja useFocusEffect como no-op; aquí simula que la
    // pantalla gana foco al montarse.
    useFocusEffect.mockImplementation(callback => {
      React.useEffect(callback, [callback]);
    });
  });

  it('RR-P0-04-001 renderiza resumen y las 3 recompensas mockeadas', async () => {
    const screen = renderWithProviders(<RewardsScreen navigation={navigation} />, {
      initialState,
    });

    expect(screen.getByText('Mis recompensas')).toBeTruthy();
    expect(screen.getByTestId('rewardsSummaryCard')).toBeTruthy();
    expect(screen.getByText('Tus recompensas por participar')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('100')).toBeTruthy();
    });
    expect(screen.getByText('TVD disponibles')).toBeTruthy();

    expect(screen.getByText('Recompensa por votar')).toBeTruthy();
    expect(screen.getByText('Incentivo inicial')).toBeTruthy();
    expect(screen.getByText('Recompensa por registro')).toBeTruthy();

    expect(screen.getByText('+5 TVD')).toBeTruthy();
    expect(screen.getByText('+10 TVD')).toBeTruthy();
    expect(screen.getByText('+3 TVD')).toBeTruthy();
    expect(
      screen.getByText('Hoy, 10:45 · Elecciones Universitarias - Recibida'),
    ).toBeTruthy();
    expect(screen.getAllByText(/ - Recibida$/)).toHaveLength(3);
    expect(screen.queryByText(/Disponible/)).toBeNull();
    expect(screen.queryByText(/Pendiente/)).toBeNull();
    expect(screen.queryByText('Reclamar')).toBeNull();
    expect(screen.getAllByTestId(/^rewardItem_/)).toHaveLength(3);
    expect(screen.getAllByTestId(/^rewardItemIcon_/)).toHaveLength(3);
  });

  it('RR-P0-04-002 navega al detalle con el id correcto al tocar cada recompensa', () => {
    const screen = renderWithProviders(<RewardsScreen navigation={navigation} />);

    fireEvent.press(screen.getByTestId('rewardItem_reward-vote'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.RewardDetailScreen,
      expect.objectContaining({rewardId: 'reward-vote'}),
    );

    fireEvent.press(screen.getByTestId('rewardItem_reward-welcome'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.RewardDetailScreen,
      expect.objectContaining({rewardId: 'reward-welcome'}),
    );

    fireEvent.press(screen.getByTestId('rewardItem_reward-registration'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.RewardDetailScreen,
      expect.objectContaining({rewardId: 'reward-registration'}),
    );
  });

  it('ordena las recompensas por estado: disponibles, pendientes y recibidas', () => {
    const buildReward = (id, status, statusLabel) => ({
      id,
      title: `Recompensa ${id}`,
      amount: 5,
      currency: 'TVD',
      status,
      statusLabel,
      processLabel: `Proceso ${id}`,
    });
    useRewardsQuery.mockReturnValueOnce({
      rewards: {
        data: [
          buildReward('received-1', 'received', 'Recibida'),
          buildReward('pending-1', 'pending', 'Pendiente'),
          buildReward('available-1', 'available', 'Disponible'),
          buildReward('received-2', 'received', 'Recibida'),
          buildReward('pending-2', 'pending', 'Pendiente'),
        ],
        rewardsAvailable: false,
      },
      isLoading: false,
      error: null,
    });

    const screen = renderWithProviders(<RewardsScreen navigation={navigation} />, {
      initialState,
    });

    expect(
      screen.getAllByTestId(/^rewardItem_/).map(item => item.props.testID),
    ).toEqual([
      'rewardItem_available-1',
      'rewardItem_pending-1',
      'rewardItem_pending-2',
      'rewardItem_received-1',
      'rewardItem_received-2',
    ]);
  });

  it('usa mocks locales y no llama backend', () => {
    renderWithProviders(<RewardsScreen navigation={navigation} />);

    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('PAR-NTF-P1-002 / PAR-NTF-P1-003 muestra recompensa por voto disponible sin declarar transferencia ni saldo actualizado', () => {
    const screen = renderWithProviders(
      <RewardsScreen
        navigation={navigation}
        route={{params: {voteRewardAvailable: true, rewardAction: 'OPEN_VOTE_REWARD'}}}
      />,
    );

    expect(screen.getByTestId('voteRewardAvailableNotice')).toBeTruthy();
    expect(screen.getByText('Recompensa por voto disponible')).toBeTruthy();
    expect(screen.getByText('Pulsa Reclamar cuando la reclamación esté habilitada.')).toBeTruthy();
    expect(
      screen.getByText('Recompensa por tu participación - Disponible'),
    ).toBeTruthy();
    expect(screen.getByText('Reclamar')).toBeTruthy();
    expect(screen.getByText('0 TVD')).toBeTruthy();
    expect(screen.queryByText(/transfer/i)).toBeNull();
    expect(screen.queryByText(/saldo actualizado/i)).toBeNull();

    fireEvent.press(screen.getByTestId('rewardItem_reward-vote'));

    expect(navigation.navigate).toHaveBeenCalledWith(
      StackNav.RewardDetailScreen,
      expect.objectContaining({
        rewardId: 'reward-vote',
        reward: expect.objectContaining({
          status: 'available',
          statusLabel: 'Disponible',
        }),
      }),
    );
    expect(axios.post).not.toHaveBeenCalled();
  });
});
