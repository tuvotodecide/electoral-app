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
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock del módulo de feature flags
jest.mock('../../../../src/config/featureFlags', () => ({
  DEV_FLAGS: {
    ENABLE_DYNAMIC_COUNTDOWN: false,
    FORCE_NOT_ELIGIBLE: false,
    FORCE_STARTS_IN_MINUTES: 0,
  },
}));

// Mock del useCountdown hook
jest.mock('../../../../src/features/universityElection/utils/useCountdown', () => ({
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

// Import después de los mocks
import ElectionCard from '../../../../src/features/universityElection/components/ElectionCard';
import { useCountdown } from '../../../../src/features/universityElection/utils/useCountdown';

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
  title: 'Elecciones Universitarias',
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

      expect(getByText('Elecciones Universitarias')).toBeTruthy();
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
  });
});
