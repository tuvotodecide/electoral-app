import React from 'react';
import {act, fireEvent} from '@testing-library/react-native';
import RewardDetailScreen from '../../../../src/features/rewards/screens/RewardDetailScreen';
import {useClaimVoteRewardMutation} from '../../../../src/features/rewards/data/rewardsApi';
import {renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  const MockCHeader = ({title, onPressBack}) => (
    <React.Fragment>
      <Text>{title}</Text>
      <TouchableOpacity testID="mockBackButton" onPress={onPressBack}>
        <Text>Volver</Text>
      </TouchableOpacity>
    </React.Fragment>
  );
  return MockCHeader;
});

jest.mock('../../../../src/features/rewards/data/rewardsApi', () => ({
  useClaimVoteRewardMutation: jest.fn(),
}));

const renderDetail = params =>
  renderWithProviders(<RewardDetailScreen route={{params}} />);

const baseReward = {
  id: 'reward-vote',
  title: 'Recompensa por votar',
  amount: 5,
  currency: 'TVD',
  endAtLabel: 'Hoy, 10:45',
  processName: 'Elecciones Universitarias',
  type: 'Recompensa por votar',
};

describe('RewardDetailScreen', () => {
  beforeEach(() => {
    useClaimVoteRewardMutation.mockReturnValue({claimReward: jest.fn()});
  });

  it('RR-P0-04-003 renderiza detalle de recompensa por votar', () => {
    const screen = renderDetail({
      reward: {
        id: 'reward-vote',
        title: 'Recompensa por votar',
        amount: 5,
        currency: 'TVD',
        status: 'received',
        statusLabel: 'Recibida',
        endAtLabel: 'Hoy, 10:45',
        processName: 'Elecciones Universitarias',
        type: 'Recompensa por votar',
        message: 'Recibiste esta recompensa por tu participación.',
      },
    });

    expect(screen.getByText('Detalle de recompensa')).toBeTruthy();
    expect(screen.getByText('Monto')).toBeTruthy();
    expect(screen.getByText('+5')).toBeTruthy();
    expect(screen.getByText('TVD')).toBeTruthy();
    expect(screen.getAllByText('Recibida').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Recompensa por votar')).toBeTruthy();
    expect(screen.getByText('Elecciones Universitarias')).toBeTruthy();
    expect(screen.getByText('Hoy, 10:45')).toBeTruthy();
    expect(screen.getByText('Recibiste esta recompensa por tu participación.')).toBeTruthy();
  });

  it('RR-P0-04-004 no crashea con rewardId inexistente y muestra fallback seguro', () => {
    const screen = renderDetail({rewardId: 'missing'});

    expect(screen.getByText('Detalle de recompensa')).toBeTruthy();
    expect(screen.getByTestId('rewardDetailFallback')).toBeTruthy();
    expect(screen.getByText('Recompensa no encontrada')).toBeTruthy();
    expect(screen.getByTestId('mockBackButton')).toBeTruthy();
  });

  it('RR-P0-04-005 renderiza datos enviados como objeto completo por params', () => {
    const screen = renderDetail({
      reward: {
        id: 'custom-reward',
        title: 'Recompensa personalizada',
        amount: 7,
        currency: 'TVD',
        status: 'received',
        statusLabel: 'Recibida',
        createdAtLabel: 'Hoy, 12:00',
        processName: 'Proceso manual',
        type: 'Recompensa personalizada',
        message: 'Recibiste esta recompensa por tu participación.',
      },
    });

    expect(screen.getByText('+7')).toBeTruthy();
    expect(screen.getByText('Recompensa personalizada')).toBeTruthy();
    expect(screen.getByText('Proceso manual')).toBeTruthy();
  });

  describe('comportamiento según reward.status', () => {
    let claimReward;

    beforeEach(() => {
      claimReward = jest.fn();
      useClaimVoteRewardMutation.mockReturnValue({claimReward});
    });

    it('RR-P0-06-001 recompensa con status "available" muestra el botón Reclamar y lo dispara con el id de la recompensa', () => {
      const screen = renderDetail({
        reward: {
          ...baseReward,
          status: 'available',
          statusLabel: 'Disponible',
          message: 'Tienes una recompensa por voto disponible para reclamar.',
        },
      });

      const claimButton = screen.getByText('Reclamar');
      expect(claimButton).toBeTruthy();

      fireEvent.press(claimButton);

      expect(claimReward).toHaveBeenCalledWith(
        'reward-vote',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
      expect(screen.getByText('Reclamando tu recompensa...')).toBeTruthy();
    });

    it('RR-P0-06-002 status "available" muestra éxito cuando el reclamo se resuelve con onSuccess', () => {
      const screen = renderDetail({
        reward: {
          ...baseReward,
          status: 'available',
          statusLabel: 'Disponible',
          message: 'Tienes una recompensa por voto disponible para reclamar.',
        },
      });

      fireEvent.press(screen.getByText('Reclamar'));
      const {onSuccess} = claimReward.mock.calls[0][1];
      act(() => {
        onSuccess();
      });

      expect(screen.getByText('Reclamaste tu recompensa correctamente.')).toBeTruthy();
      expect(screen.getByTestId('loadingModalCloseButton')).toBeTruthy();
      expect(screen.queryByTestId('loadingModalSecondButton')).toBeNull();

      fireEvent.press(screen.getByTestId('loadingModalCloseButton'));
      expect(
        screen.queryByText('Reclamaste tu recompensa correctamente.'),
      ).toBeNull();
    });

    it('RR-P0-06-003 status "available" muestra error y permite reintentar cuando el reclamo falla', () => {
      const screen = renderDetail({
        reward: {
          ...baseReward,
          status: 'available',
          statusLabel: 'Disponible',
          message: 'Tienes una recompensa por voto disponible para reclamar.',
        },
      });

      fireEvent.press(screen.getByText('Reclamar'));
      const {onError} = claimReward.mock.calls[0][1];
      act(() => {
        onError(new Error('network error'));
      });

      expect(
        screen.getByText('No se pudo reclamar la recompensa. Inténtalo de nuevo.'),
      ).toBeTruthy();
      expect(screen.getByTestId('loadingModalSecondButton')).toBeTruthy();

      fireEvent.press(screen.getByTestId('loadingModalCloseButton'));
      expect(claimReward).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Reclamando tu recompensa...')).toBeTruthy();
    });

    it('RR-P0-06-004 status "available" permite cerrar el modal de error sin reintentar', () => {
      const screen = renderDetail({
        reward: {
          ...baseReward,
          status: 'available',
          statusLabel: 'Disponible',
          message: 'Tienes una recompensa por voto disponible para reclamar.',
        },
      });

      fireEvent.press(screen.getByText('Reclamar'));
      const {onError} = claimReward.mock.calls[0][1];
      act(() => {
        onError(new Error('network error'));
      });

      fireEvent.press(screen.getByTestId('loadingModalSecondButton'));

      expect(claimReward).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByText('No se pudo reclamar la recompensa. Inténtalo de nuevo.'),
      ).toBeNull();
    });

    it('RR-P0-07-001 recompensa con status "received" no muestra el botón Reclamar', () => {
      const screen = renderDetail({
        reward: {
          ...baseReward,
          status: 'received',
          statusLabel: 'Recibida',
          message: 'Recibiste esta recompensa por tu participación.',
        },
      });

      expect(screen.queryByText('Reclamar')).toBeNull();
      expect(claimReward).not.toHaveBeenCalled();
    });

    it('RR-P0-05-001 status "pending" no muestra el botón Reclamar y muestra el mensaje de espera', () => {
      const screen = renderDetail({
        reward: {
          ...baseReward,
          status: 'pending',
          statusLabel: 'Pendiente',
          message: 'Espera a que termine la votación para reclamar tu recompensa.',
        },
      });

      expect(screen.queryByText('Reclamar')).toBeNull();
      expect(
        screen.getByText('Espera a que termine la votación para reclamar tu recompensa.'),
      ).toBeTruthy();
    });
  });
});
