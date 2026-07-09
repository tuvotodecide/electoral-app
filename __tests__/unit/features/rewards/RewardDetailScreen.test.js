import React from 'react';
import RewardDetailScreen from '../../../../src/features/rewards/screens/RewardDetailScreen';
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

const renderDetail = params =>
  renderWithProviders(<RewardDetailScreen route={{params}} />);

describe('RewardDetailScreen', () => {
  it('renderiza detalle de recompensa por votar', () => {
    const screen = renderDetail({rewardId: 'reward-vote'});

    expect(screen.getByText('Detalle de recompensa')).toBeTruthy();
    expect(screen.getByText('Monto recibido')).toBeTruthy();
    expect(screen.getByText('+5')).toBeTruthy();
    expect(screen.getByText('TVD')).toBeTruthy();
    expect(screen.getAllByText('Recibida').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Recompensa por votar')).toBeTruthy();
    expect(screen.getByText('Elecciones Universitarias')).toBeTruthy();
    expect(screen.getByText('Hoy, 10:45')).toBeTruthy();
    expect(screen.getByText('Recibiste esta recompensa por tu participación.')).toBeTruthy();
  });

  it('renderiza detalle de incentivo inicial', () => {
    const screen = renderDetail({rewardId: 'reward-welcome'});

    expect(screen.getByText('+10')).toBeTruthy();
    expect(screen.getByText('Incentivo inicial')).toBeTruthy();
    expect(screen.getByText('Bienvenida a la plataforma')).toBeTruthy();
    expect(screen.getAllByText('Recibida').length).toBeGreaterThanOrEqual(2);
  });

  it('renderiza detalle de recompensa por registro', () => {
    const screen = renderDetail({rewardId: 'reward-registration'});

    expect(screen.getByText('+3')).toBeTruthy();
    expect(screen.getByText('Recompensa por registro')).toBeTruthy();
    expect(screen.getByText('Registro de usuario')).toBeTruthy();
    expect(screen.getAllByText('Recibida').length).toBeGreaterThanOrEqual(2);
  });

  it('no crashea con rewardId inexistente y muestra fallback seguro', () => {
    const screen = renderDetail({rewardId: 'missing'});

    expect(screen.getByText('Detalle de recompensa')).toBeTruthy();
    expect(screen.getByTestId('rewardDetailFallback')).toBeTruthy();
    expect(screen.getByText('Recompensa no encontrada')).toBeTruthy();
    expect(screen.getByTestId('mockBackButton')).toBeTruthy();
  });

  it('renderiza datos enviados como objeto completo por params', () => {
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
    expect(screen.getByText('Hoy, 12:00')).toBeTruthy();
  });
});
