/**
 * Tests unitarios para ElectionCard
 *
 * Prueba los diferentes estados del card:
 * - Estado normal (puede votar)
 * - Estado "ya votó"
 * - Estado "no habilitado"
 * - Estado "inicia en" (countdown)
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Import después de los mocks
import ElectionCard from '../../../../src/features/voting/components/ElectionCard';
import { useCountdown } from '../../../../src/features/voting/utils/useCountdown';

// Mock del módulo de feature flags
jest.mock('../../../../src/config/featureFlags', () => ({
  DEV_FLAGS: {
    ENABLE_DYNAMIC_COUNTDOWN: false,
    FORCE_NOT_ELIGIBLE: false,
    FORCE_STARTS_IN_MINUTES: 0,
  },
}));

// Mock del useCountdown hook
jest.mock('../../../../src/features/voting/utils/useCountdown', () => ({
  useCountdown: jest.fn(() => ({
    countdownLabel: 'Cierra en 2h',
    countdownTime: '',
    isStarting: false,
    isEnded: false,
    remainingMs: 7200000,
  })),
}));

// Mock de react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Helper para crear store de Redux mock
const createMockStore = () => {
  return configureStore({
    reducer: {
      theme: () => ({
        theme: {
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
        },
      }),
    },
  });
};

// Helper para renderizar con Provider
const renderWithProvider = (component) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

// Mock de elección
const mockElection = {
  id: 'election_test',
  title: 'Votación General',
  status: 'ACTIVA',
  closesInLabel: 'Cierra en 2h',
  instituteName: 'Carrera de Informática',
};

describe('ElectionCard', () => {
  const mockOnVotePress = jest.fn();
  const mockOnDetailsPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset useCountdown mock al estado por defecto
    useCountdown.mockReturnValue({
      countdownLabel: 'Cierra en 2h',
      countdownTime: '',
      isStarting: false,
      isEnded: false,
      remainingMs: 7200000,
    });
  });

  describe('Renderizado básico', () => {
    test('renderiza el título de la elección', () => {
      const { getByText } = renderWithProvider(
        <ElectionCard
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('Votación General')).toBeTruthy();
    });

    test('renderiza el badge de estado ACTIVA', () => {
      const { getByText } = renderWithProvider(
        <ElectionCard
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('ACTIVA')).toBeTruthy();
    });

    test('renderiza el botón "Votar ahora" cuando no ha votado', () => {
      const { getByTestId } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      const button = getByTestId('electionCardButton');
      expect(button).toBeTruthy();
    });

    test('ejecuta onVotePress al tocar "Votar ahora"', () => {
      const { getByTestId } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      fireEvent.press(getByTestId('electionCardButton'));
      expect(mockOnVotePress).toHaveBeenCalledTimes(1);
      expect(mockOnDetailsPress).not.toHaveBeenCalled();
    });

    test('renderiza la eleccion mockeada del home con subtitulo y contador', () => {
      useCountdown.mockReturnValue({
        countdownLabel: '2h 11m 33s',
        countdownTime: '',
        isStarting: false,
        isEnded: false,
        remainingMs: 7200000,
      });

      const { getByText } = renderWithProvider(
        <ElectionCard
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('ACTIVA')).toBeTruthy();
      expect(getByText('Elecciones Universitarias')).toBeTruthy();
      expect(getByText('Carrera de Informática')).toBeTruthy();
      expect(getByText('CIERRA EN')).toBeTruthy();
      expect(getByText('2h 11m 33s')).toBeTruthy();
      expect(getByText('Votar ahora')).toBeTruthy();
    });

    test('no se rompe si recibe datos reales con campos opcionales faltantes', () => {
      const { getByText } = renderWithProvider(
        <ElectionCard
          election={{id: 'real-election', title: 'Proceso real', status: 'ACTIVA'}}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('Proceso real')).toBeTruthy();
      expect(getByText('ACTIVA')).toBeTruthy();
    });
  });

  describe('Estado: Ya votó', () => {
    test('muestra mensaje "Ya participaste" cuando hasVoted=true', () => {
      const { getByText } = renderWithProvider(
        <ElectionCard
          hasVoted={true}
          voteSynced={true}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('Ya participaste en esta votación')).toBeTruthy();
    });

    test('muestra botón "Ver detalles" cuando ya votó y está sincronizado', () => {
      const { getByText } = renderWithProvider(
        <ElectionCard
          hasVoted={true}
          voteSynced={true}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('Ver detalles')).toBeTruthy();
    });
  });

  describe('Estado: No habilitado', () => {
    test('muestra mensaje de no habilitado cuando isEligible=false', () => {
      const { getByText } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          isEligible={false}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText(/no está habilitado/i)).toBeTruthy();
    });

    test('no muestra botón cuando no está habilitado', () => {
      const { queryByTestId } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          isEligible={false}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(queryByTestId('electionCardButton')).toBeNull();
    });

    test('permite abrir detalle sin mostrar aviso cuando allowIneligibleDetails=true', () => {
      const { getByTestId, getByText, queryByText } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          isEligible={false}
          allowIneligibleDetails={true}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(queryByText(/no está habilitado/i)).toBeNull();
      expect(getByText('Cierra en 2h')).toBeTruthy();

      fireEvent.press(getByTestId('electionCardButton'));
      expect(mockOnDetailsPress).toHaveBeenCalledTimes(1);
      expect(mockOnVotePress).not.toHaveBeenCalled();
    });
  });

 
  describe('Estado: Elección terminada', () => {
    test('muestra "Votación cerrada" cuando isEnded=true y no votó', () => {
      useCountdown.mockReturnValue({
        countdownLabel: 'Cerrada',
        countdownTime: '',
        isStarting: false,
        isEnded: true,
        remainingMs: 0,
      });

      const { getByText } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('Votación cerrada')).toBeTruthy();
    });

    test('muestra "Ver resultados" cuando terminó, no votó y los resultados están disponibles', () => {
      useCountdown.mockReturnValue({
        countdownLabel: 'Cerrada',
        countdownTime: '',
        isStarting: false,
        isEnded: true,
        remainingMs: 0,
      });

      const { getByText, getByTestId, queryByText } = renderWithProvider(
        <ElectionCard
          hasVoted={false}
          resultsAvailable={true}
          election={mockElection}
          onVotePress={mockOnVotePress}
          onDetailsPress={mockOnDetailsPress}
        />
      );

      expect(getByText('Ver resultados')).toBeTruthy();
      expect(queryByText('Votación cerrada')).toBeNull();

      fireEvent.press(getByTestId('electionCardButton'));
      expect(mockOnDetailsPress).toHaveBeenCalledTimes(1);
      expect(mockOnVotePress).not.toHaveBeenCalled();
    });
  });
});
