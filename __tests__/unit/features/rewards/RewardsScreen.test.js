import React from 'react';
import {fireEvent} from '@testing-library/react-native';
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

const axios = require('axios');

describe('RewardsScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza resumen y las 3 recompensas mockeadas', () => {
    const screen = renderWithProviders(<RewardsScreen navigation={navigation} />);

    expect(screen.getByText('Mis recompensas')).toBeTruthy();
    expect(screen.getByTestId('rewardsSummaryCard')).toBeTruthy();
    expect(screen.getByText('Tus recompensas por participar')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('TVD disponibles')).toBeTruthy();

    expect(screen.getByText('Recompensa por votar')).toBeTruthy();
    expect(screen.getByText('Incentivo inicial')).toBeTruthy();
    expect(screen.getByText('Recompensa por registro')).toBeTruthy();

    expect(screen.getByText('+5')).toBeTruthy();
    expect(screen.getByText('+10')).toBeTruthy();
    expect(screen.getByText('+3')).toBeTruthy();
    expect(screen.getAllByText('TVD')).toHaveLength(3);
    expect(screen.getAllByText('Recibida')).toHaveLength(3);
    expect(screen.queryByText('Disponible')).toBeNull();
    expect(screen.queryByText('Pendiente')).toBeNull();
    expect(screen.getAllByTestId(/rewardItem_/)).toHaveLength(3);
  });

  it('navega al detalle con el id correcto al tocar cada recompensa', () => {
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

  it('usa mocks locales y no llama backend', () => {
    renderWithProviders(<RewardsScreen navigation={navigation} />);

    expect(axios.get).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
