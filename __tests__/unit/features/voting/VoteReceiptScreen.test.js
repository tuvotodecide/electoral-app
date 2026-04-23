import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import VoteReceiptScreen from '../../../../src/features/voting/screens/VoteReceiptScreen';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn(callback => callback()),
}));

jest.mock('../../../../src/features/voting/state/useVotingState', () => ({
  useVotingState: jest.fn(),
}));

jest.mock('../../../../src/features/voting/offline/queueAdapter', () => ({
  releaseVoteForElection: jest.fn(),
}));

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children}) => <View>{children}</View>;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({title}) => <Text>{title}</Text>;
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return ({children}) => <Text>{children}</Text>;
});

jest.mock('../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  return ({title, onPress}) => (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

const {useNavigation, useRoute} = require('@react-navigation/native');
const {useVotingState} = require('../../../../src/features/voting/state/useVotingState');
const {releaseVoteForElection} = require('../../../../src/features/voting/offline/queueAdapter');

describe('VoteReceiptScreen', () => {
  const navigation = {
    reset: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'election-1',
      },
    });
  });

  it('renderiza el comprobante exitoso y sincroniza con blockchain cuando corresponde', async () => {
    const syncStateWithBlockchain = jest.fn();
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'election-1',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          transactionId: '0xabc',
          synced: true,
          candidateSelected: {
            partyName: 'Lista Azul',
            presidentName: 'Ana Perez',
            viceName: 'Luis Rojas',
          },
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain,
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('Voto registrado exitosamente')).toBeTruthy();
    expect(screen.getByText('Centro de estudiantes')).toBeTruthy();

    fireEvent.press(screen.getByText('Detalle de mi selección'));
    expect(screen.getByText('Lista Azul')).toBeTruthy();
    expect(screen.getByText('Ana Perez')).toBeTruthy();

    await waitFor(() => {
      expect(syncStateWithBlockchain).toHaveBeenCalledWith('participation-1');
    });
  });

  it('muestra estado en cola sin forzar sincronizacion inmediata', () => {
    const syncStateWithBlockchain = jest.fn();
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'election-1',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: false,
          status: 'EN_COLA',
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain,
      syncedWithBlockchain: 'loading',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('Voto en cola para sincronizar')).toBeTruthy();
    expect(syncStateWithBlockchain).not.toHaveBeenCalled();
  });

  it('muestra detalle de respuesta cuando la participacion corresponde a un referendum', () => {
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'election-1',
          electionTitle: '¿Aprueba la nueva normativa institucional?',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: true,
          isReferendum: true,
          candidateSelected: {
            partyName: 'Sí',
            presidentName: 'Sí',
            isReferendum: true,
            questionTitle: '¿Aprueba la nueva normativa institucional?',
          },
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    fireEvent.press(screen.getByText('Detalle de mi respuesta'));

    expect(screen.getByText('Sí')).toBeTruthy();
    expect(screen.getByText('Opción')).toBeTruthy();
    expect(screen.queryByText('Partido')).toBeNull();
  });

  it('permite liberar un voto fallido y volver al inicio', async () => {
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'election-1',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: false,
          status: 'ERROR',
          errorMessage: 'No se pudo completar el voto',
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'failed',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getAllByText('No se pudo completar el voto').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByText('Volver a votar'));

    await waitFor(() => {
      expect(releaseVoteForElection).toHaveBeenCalledWith('election-1');
    });

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
          params: {screen: TabNav.HomeScreen},
        },
      ],
    });
  });
});
