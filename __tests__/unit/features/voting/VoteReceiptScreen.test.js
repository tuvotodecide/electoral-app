import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Text} from 'react-native';
import VoteReceiptScreen from '../../../../src/features/voting/screens/VoteReceiptScreen';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';

jest.mock('@env', () => ({
  FRONTEND_RESULTS: 'https://frontend-results.example',
}));

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
  const MockCSafeAreaView = ({children}) => <View>{children}</View>;
  MockCSafeAreaView.displayName = 'MockCSafeAreaView';
  return MockCSafeAreaView;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCHeader = ({title}) => <Text>{title}</Text>;
  MockCHeader.displayName = 'MockCHeader';
  return MockCHeader;
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCText = ({children}) => <Text>{children}</Text>;
  MockCText.displayName = 'MockCText';
  return MockCText;
});

jest.mock('../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  const MockCButton = ({title, onPress, testID, containerStyle, bgColor, color}) => (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      style={[containerStyle, {backgroundColor: bgColor || 'primary'}]}
    >
      <Text style={color ? {color} : null}>{title}</Text>
    </TouchableOpacity>
  );
  MockCButton.displayName = 'MockCButton';
  return MockCButton;
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

const {useNavigation, useRoute} = require('@react-navigation/native');
const {useVotingState} = require('../../../../src/features/voting/state/useVotingState');
const {releaseVoteForElection} = require('../../../../src/features/voting/offline/queueAdapter');

describe('VoteReceiptScreen', () => {
  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-07-10T20:00:00.000Z').getTime());
    useNavigation.mockReturnValue(navigation);
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'election-1',
      },
    });
  });

  afterEach(() => {
    Date.now.mockRestore();
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

  it('MP-APP-DETAIL-001/002 abre recibo con participacion backend sin AsyncStorage local', async () => {
    const syncStateWithBlockchain = jest.fn();
    useRoute.mockReturnValue({
      params: {
        participationId: 'backend-participation-1',
        electionId: 'event-backend-1',
        participation: {
          id: 'backend-participation-1',
          electionId: 'event-backend-1',
          voteId: 'event-backend-1',
          electionTitle: 'Elección recuperada desde backend',
          status: 'VOTO_REGISTRADO',
          statusLabel: 'VOTO REGISTRADO',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Institución recuperada',
          candidateSelected: null,
          selectedCandidateId: null,
          synced: true,
        },
        allowBack: true,
      },
    });
    useVotingState.mockReturnValue({
      participations: [],
      lastReceipt: null,
      syncStateWithBlockchain,
      syncedWithBlockchain: {status: 'idle'},
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('Voto registrado exitosamente')).toBeTruthy();
    expect(screen.getByText('Elección recuperada desde backend')).toBeTruthy();
    expect(screen.getByText('01 ene 2026, 10:00')).toBeTruthy();
    expect(screen.getByText('Institución recuperada')).toBeTruthy();

    await waitFor(() => {
      expect(syncStateWithBlockchain).toHaveBeenCalledWith('backend-participation-1');
    });
  });

  it('MP-APP-DETAIL-003 tolera candidateSelected null sin mostrar seleccion falsa', async () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'backend-null-selection',
        electionId: 'event-null-selection',
        participation: {
          id: 'backend-null-selection',
          electionId: 'event-null-selection',
          electionTitle: 'Elección sin selección local',
          fullDate: '02 ene 2026, 11:00',
          organization: 'Institución',
          candidateSelected: null,
          synced: true,
        },
        allowBack: true,
      },
    });
    useVotingState.mockReturnValue({
      participations: [],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: {status: 'idle'},
    });

    const screen = render(<VoteReceiptScreen />);

    fireEvent.press(screen.getByText('Detalle de mi selección'));

    expect(screen.getByText('Elección sin selección local')).toBeTruthy();
    expect(screen.queryByText('Partido')).toBeNull();
    expect(screen.queryByText('Lista Azul')).toBeNull();
  });

  it('MP-APP-DETAIL-005 muestra el voto devuelto por contrato usando la UI actual', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'backend-contract',
        electionId: 'event-contract',
        participation: {
          id: 'backend-contract',
          electionId: 'event-contract',
          electionTitle: 'Elección con contrato',
          fullDate: '03 ene 2026, 12:00',
          organization: 'Institución',
          candidateSelected: null,
          synced: true,
        },
        allowBack: true,
      },
    });
    useVotingState.mockReturnValue({
      participations: [],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: {
        status: 'synced',
        data: {
          hasVoted: true,
          option: 'Lista Contrato',
        },
      },
    });

    const screen = render(<VoteReceiptScreen />);

    fireEvent.press(screen.getByText('Detalle de mi selección'));

    expect(screen.getByText('Lista Contrato')).toBeTruthy();
  });

  it('MP-APP-DETAIL-006 muestra alerta controlada si falta VC/nullifier', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'backend-no-credential',
        electionId: 'event-no-credential',
        participation: {
          id: 'backend-no-credential',
          electionId: 'event-no-credential',
          electionTitle: 'Elección sin credencial',
          fullDate: '04 ene 2026, 13:00',
          organization: 'Institución',
          candidateSelected: null,
          synced: true,
        },
        allowBack: true,
      },
    });
    useVotingState.mockReturnValue({
      participations: [],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: {
        status: 'failed',
        error: 'Credential not found for electionId event-no-credential',
      },
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('No se encontró la credencial de esta votación')).toBeTruthy();
  });

  it('MP-APP-DETAIL-007 contrato no sincronizado no muestra seleccion ni consulta backend', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'backend-not-voted',
        electionId: 'event-not-voted',
        participation: {
          id: 'backend-not-voted',
          electionId: 'event-not-voted',
          electionTitle: 'Elección no sincronizada',
          fullDate: '05 ene 2026, 14:00',
          organization: 'Institución',
          candidateSelected: null,
          synced: true,
        },
        allowBack: true,
      },
    });
    useVotingState.mockReturnValue({
      participations: [],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: {
        status: 'not_synced',
        data: {hasVoted: false, option: ''},
      },
    });

    const screen = render(<VoteReceiptScreen />);

    fireEvent.press(screen.getByText('Detalle de mi selección'));

    expect(screen.getByText('Elección no sincronizada')).toBeTruthy();
    expect(screen.queryByText('Partido')).toBeNull();
  });

  it('MP-APP-DETAIL-008 muestra error controlado si falla contrato', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'backend-contract-error',
        electionId: 'event-contract-error',
        participation: {
          id: 'backend-contract-error',
          electionId: 'event-contract-error',
          electionTitle: 'Elección con error de contrato',
          fullDate: '06 ene 2026, 15:00',
          organization: 'Institución',
          candidateSelected: null,
          synced: true,
        },
        allowBack: true,
      },
    });
    useVotingState.mockReturnValue({
      participations: [],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: {
        status: 'failed',
        error: 'RPC failed',
      },
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('No se pudo verificar el voto')).toBeTruthy();
  });

  it('muestra Ver resultados si recibe resultsAvailable true y abre la WebView pública', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'event-results',
        resultsAvailable: true,
        publicPath: '/votacion/elecciones/event-results/publica',
      },
    });
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'event-results',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: true,
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('Voto registrado exitosamente')).toBeTruthy();
    expect(screen.getByText('Ver resultados')).toBeTruthy();
    expect(screen.getByText('Ir al inicio')).toBeTruthy();

    const renderedTexts = screen.UNSAFE_root.findAllByType(Text)
      .map(node => node.props.children)
      .filter(value => typeof value === 'string');
    expect(renderedTexts.indexOf('Ver resultados')).toBeLessThan(
      renderedTexts.indexOf('Ir al inicio'),
    );

    /*const resultsButtonStyle = StyleSheet.flatten(screen.getByTestId('viewResultsButton').props.style);
    const homeButtonStyle = StyleSheet.flatten(screen.getByTestId('goHomeButton').props.style);
    const homeButtonTextStyle = StyleSheet.flatten(screen.getByText('Ir al inicio').props.style);
    expect(resultsButtonStyle.backgroundColor).toBe(commonColor.primary);
    expect(homeButtonStyle.backgroundColor).toBe(commonColor.grayScale200);
    expect(homeButtonTextStyle.color).toBe(commonColor.grayScale600);*/

    fireEvent.press(screen.getByText('Ver resultados'));

    expect(navigation.navigate).toHaveBeenCalledWith(StackNav.PublicElectionWebViewScreen, {
      url: 'https://frontend-results.example/votacion/elecciones/event-results/publica',
      title: 'Resultados',
    });

    fireEvent.press(screen.getByText('Ir al inicio'));

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

  it('muestra Ver resultados si phase es RESULTS', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'event-phase-results',
        phase: 'RESULTS',
        publicPath: '/votacion/elecciones/event-phase-results/publica',
      },
    });
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'event-phase-results',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: true,
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('Ver resultados')).toBeTruthy();
  });

  it('muestra Ver resultados si resultsAt ya pasó', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'event-results-at',
        resultsAt: new Date('2026-07-10T19:00:00.000Z').getTime(),
      },
    });
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'event-results-at',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: true,
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.getByText('Ver resultados')).toBeTruthy();
  });

  it('muestra mensaje pendiente si la votación finalizó pero resultsAt está en el futuro', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'event-pending-results',
        status: 'FINALIZADA',
        resultsAt: new Date('2026-07-10T21:00:00.000Z').getTime(),
      },
    });
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'event-pending-results',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: true,
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.queryByText('Ver resultados')).toBeNull();
    expect(screen.getByText('La votación finalizó. Los resultados aún no están disponibles.')).toBeTruthy();
  });

  it('no muestra Ver resultados para CANCELLED', () => {
    useRoute.mockReturnValue({
      params: {
        participationId: 'participation-1',
        electionId: 'event-cancelled',
        state: 'CANCELLED',
        resultsAvailable: true,
        publicPath: '/votacion/elecciones/event-cancelled/publica',
      },
    });
    useVotingState.mockReturnValue({
      participations: [
        {
          id: 'participation-1',
          electionId: 'event-cancelled',
          electionTitle: 'Centro de estudiantes',
          fullDate: '01 ene 2026, 10:00',
          organization: 'Facultad',
          synced: true,
          candidateSelected: null,
        },
      ],
      lastReceipt: null,
      syncStateWithBlockchain: jest.fn(),
      syncedWithBlockchain: 'synced',
    });

    const screen = render(<VoteReceiptScreen />);

    expect(screen.queryByText('Ver resultados')).toBeNull();
    expect(screen.queryByText('La votación finalizó. Los resultados aún no están disponibles.')).toBeNull();
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

  it('muestra detalle de opcion cuando la participacion corresponde a un referendum', () => {
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

    fireEvent.press(screen.getByText('Detalle de tu opción'));

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
