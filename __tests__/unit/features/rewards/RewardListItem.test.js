import React from 'react';
import {fireEvent, render} from '@testing-library/react-native';
import RewardListItem from '../../../../src/features/rewards/components/RewardListItem';

const baseReward = {
  id: 'reward-vote',
  title: 'Recompensa por votar',
  amount: 5,
  currency: 'TVD',
  processLabel: 'Elecciones Universitarias',
};

const renderItem = (overrides, onPress = jest.fn()) =>
  render(
    <RewardListItem reward={{...baseReward, ...overrides}} onPress={onPress} />,
  );

describe('RewardListItem', () => {
  it('status "pending" muestra reloj gris con fondo gris, sin "+" ni botón Reclamar', () => {
    const screen = renderItem({status: 'pending', statusLabel: 'Pendiente'});

    const icon = screen.getByTestId('rewardItemIcon_reward-vote');
    expect(icon.props.name).toBe('time-outline');
    expect(icon.props.style).toContainEqual(expect.objectContaining({color: '#9CA3AF'}));
    expect(
      screen.getByTestId('rewardItemIconBox_reward-vote').props.style,
    ).toContainEqual(expect.objectContaining({backgroundColor: '#F3F4F6'}));
    expect(
      screen.getByText('Elecciones Universitarias - Pendiente'),
    ).toBeTruthy();
    expect(screen.getByText('5 TVD')).toBeTruthy();
    expect(screen.queryByText('Reclamar')).toBeNull();
  });

  it('status "available" muestra regalo amarillo con fondo amarillo y botón Reclamar, sin "+"', () => {
    const screen = renderItem({status: 'available', statusLabel: 'Disponible'});

    const icon = screen.getByTestId('rewardItemIcon_reward-vote');
    expect(icon.props.name).toBe('gift-outline');
    expect(icon.props.style).toContainEqual(expect.objectContaining({color: '#F59E0B'}));
    expect(
      screen.getByTestId('rewardItemIconBox_reward-vote').props.style,
    ).toContainEqual(expect.objectContaining({backgroundColor: '#FEF3C7'}));
    expect(
      screen.getByText('Elecciones Universitarias - Disponible'),
    ).toBeTruthy();
    expect(screen.getByText('5 TVD')).toBeTruthy();
    expect(screen.getByText('Reclamar')).toBeTruthy();
  });

  it('status "received" muestra check verde con fondo verde y monto con "+", sin botón Reclamar', () => {
    const screen = renderItem({status: 'received', statusLabel: 'Recibida'});

    const icon = screen.getByTestId('rewardItemIcon_reward-vote');
    expect(icon.props.name).toBe('checkmark-circle-outline');
    expect(icon.props.style).toContainEqual(expect.objectContaining({color: '#459151'}));
    expect(
      screen.getByTestId('rewardItemIconBox_reward-vote').props.style,
    ).toContainEqual(expect.objectContaining({backgroundColor: '#E8F5E9'}));
    expect(screen.getByText('Elecciones Universitarias - Recibida')).toBeTruthy();
    expect(screen.getByText('+5 TVD')).toBeTruthy();
    expect(screen.queryByText('Reclamar')).toBeNull();
  });

  it('llama onPress con la recompensa al tocar el item', () => {
    const onPress = jest.fn();
    const screen = renderItem(
      {id: 'reward-other', status: 'received', statusLabel: 'Recibida'},
      onPress,
    );
    fireEvent.press(screen.getByTestId('rewardItem_reward-other'));

    expect(onPress).toHaveBeenCalledWith(
      expect.objectContaining({id: 'reward-other', status: 'received'}),
    );
  });
});
