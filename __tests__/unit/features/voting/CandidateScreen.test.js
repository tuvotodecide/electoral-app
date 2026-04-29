import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import CandidateScreen from '../../../../src/features/voting/screens/CandidateScreen';
import {StackNav} from '../../../../src/navigation/NavigationKey';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../../../src/features/voting/data/useElectionRepository', () => ({
  useElectionRepository: jest.fn(),
}));

jest.mock('../../../../src/features/voting/state/useVotingState', () => ({
  useVotingState: jest.fn(),
}));

jest.mock('../../../../src/features/voting/offline/queueAdapter', () => ({
  enqueueBackendParticipationSync: jest.fn(),
  enqueueVote: jest.fn(),
}));

jest.mock('../../../../src/features/voting/offline/voteJournal', () => ({
  clearVoteJournal: jest.fn(),
  startVoteJournal: jest.fn(),
}));

jest.mock('../../../../src/utils/networkUtils', () => ({
  backendProbe: jest.fn(),
  checkInternetConnection: jest.fn(),
}));

jest.mock('../../../../src/config/featureFlags', () => ({
  DEV_FLAGS: {
    FORCE_OFFLINE_VOTING: false,
  },
}));

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
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
  return ({title, onPress, disabled, testID}) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled: !!disabled}}
      disabled={disabled}
      onPress={onPress}
      testID={testID}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../../../../src/components/common/CustomModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  return ({
    visible,
    title,
    message,
    buttonText,
    onButtonPress,
    secondaryButtonText,
    onSecondaryPress,
  }) =>
    visible ? (
      <View>
        <Text>{title}</Text>
        <Text>{message}</Text>
        <TouchableOpacity onPress={onButtonPress} testID="customModalPrimaryButton">
          <Text>{buttonText}</Text>
        </TouchableOpacity>
        {secondaryButtonText ? (
          <TouchableOpacity onPress={onSecondaryPress} testID="customModalSecondaryButton">
            <Text>{secondaryButtonText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : null;
});

jest.mock('../../../../src/features/voting/components/CandidateCard', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  return ({candidate, isSelected, onSelect}) => (
    <TouchableOpacity onPress={onSelect} testID={`candidateCard_${candidate.id}`}>
      <Text>{candidate.partyName}</Text>
      {isSelected ? <Text>selected:{candidate.id}</Text> : null}
    </TouchableOpacity>
  );
});

jest.mock('../../../../src/features/voting/components/ConfirmVoteModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  return ({visible, presidentName, onConfirm, onCancel, isLoading}) =>
    visible ? (
      <View>
        <Text>{presidentName}</Text>
        {isLoading ? (
          <Text>Procesando...</Text>
        ) : (
          <>
            <TouchableOpacity onPress={onConfirm} testID="confirmVoteButton">
              <Text>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} testID="cancelVoteButton">
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    ) : null;
});

jest.mock('../../../../src/features/voting/components/OfflineQueuedModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  return ({visible, title, message, onDismiss}) =>
    visible ? (
      <View>
        <Text>{title}</Text>
        <Text>{message}</Text>
        <TouchableOpacity onPress={onDismiss} testID="offlineDismissButton">
          <Text>Entendido</Text>
        </TouchableOpacity>
      </View>
    ) : null;
});

jest.mock('../../../../src/features/voting/components/CameraScannerModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  return ({visible, onBarcodeScanned}) =>
    visible ? (
      <View>
        <Text>Escanear QR</Text>
        <TouchableOpacity
          onPress={() => onBarcodeScanned({data: 'qr-token-1'})}
          testID="scanQrButton">
          <Text>Simular scan</Text>
        </TouchableOpacity>
      </View>
    ) : null;
});

const {useNavigation} = require('@react-navigation/native');
const {useElectionRepository} = require('../../../../src/features/voting/data/useElectionRepository');
const {useVotingState} = require('../../../../src/features/voting/state/useVotingState');
const {
  enqueueBackendParticipationSync,
  enqueueVote,
} = require('../../../../src/features/voting/offline/queueAdapter');
const {
  clearVoteJournal,
  startVoteJournal,
} = require('../../../../src/features/voting/offline/voteJournal');
const {
  backendProbe,
  checkInternetConnection,
} = require('../../../../src/utils/networkUtils');
const {captureError} = require('../../../../src/config/sentry');

const createStore = () =>
  configureStore({
    reducer: {
      theme: (state = {theme: {primary: '#41A44D', white: '#FFFFFF', paper: '#FFFFFF'}}) =>
        state,
    },
  });

const renderScreen = route =>
  render(
    <Provider store={createStore()}>
      <CandidateScreen route={route} />
    </Provider>,
  );

describe('CandidateScreen', () => {
  const navigation = {replace: jest.fn()};
  const repository = {
    getElection: jest.fn(),
    getCandidates: jest.fn(),
    submitVote: jest.fn(),
    verifyVoteQrCode: jest.fn(),
  };
  const recordVote = jest.fn();

  const election = {
    id: 'election-1',
    title: 'Consejo universitario',
    organization: 'UMSA',
  };

  const candidates = [
    {
      id: 'cand-1',
      partyName: 'Lista Azul',
      presidentName: 'Ana Perez',
      viceName: 'Luis Rojas',
      partyColor: '#111111',
    },
    {
      id: 'cand-2',
      partyName: 'Lista Verde',
      presidentName: 'Bruno Diaz',
      viceName: 'Marta Soto',
      partyColor: '#222222',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue(navigation);
    useElectionRepository.mockReturnValue(repository);
    useVotingState.mockReturnValue({
      recordVote,
      hasVoted: false,
      participationId: null,
      lastReceipt: null,
      isLoading: false,
    });
    repository.getElection.mockResolvedValue(election);
    repository.getCandidates.mockResolvedValue(candidates);
    repository.submitVote.mockResolvedValue({
      success: true,
      participationId: 'server-participation',
      participatedAt: '2026-01-01T10:00:00.000Z',
      transactionId: '0xabc',
    });
    repository.verifyVoteQrCode.mockResolvedValue('presential-session-1');
    recordVote.mockResolvedValue({id: 'local-participation'});
    checkInternetConnection.mockResolvedValue(true);
    backendProbe.mockResolvedValue({ok: true});
  });

  it('renderiza la pantalla principal y carga candidaturas reales del repositorio', async () => {
    const screen = renderScreen({params: {election}});

    expect(screen.getByText('Papeleta')).toBeTruthy();
    expect(screen.getByText('Elige a un candidato')).toBeTruthy();

    await waitFor(() => {
      expect(repository.getCandidates).toHaveBeenCalledWith('election-1');
    });

    expect(screen.getByText('Lista Azul')).toBeTruthy();
    expect(screen.getByText('Lista Verde')).toBeTruthy();
  });

  it('mantiene el boton en voto blanco cuando no existe seleccion', async () => {
    repository.getCandidates.mockResolvedValueOnce([]);

    const screen = renderScreen({params: {election}});

    await waitFor(() => {
      expect(repository.getCandidates).toHaveBeenCalledWith('election-1');
    });

    const voteButton = screen.getByTestId('voteButton');
    expect(screen.getByText(/votar en blanco/i)).toBeTruthy();
    expect(voteButton.props.accessibilityState.disabled).toBe(false);
  });

  it('permite seleccionar una opcion valida y cambiar la seleccion antes de votar', async () => {
    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');

    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    expect(screen.getByText('selected:cand-1')).toBeTruthy();
    expect(screen.getByText('VOTAR POR ANA PEREZ')).toBeTruthy();

    fireEvent.press(screen.getByTestId('candidateCard_cand-2'));
    expect(screen.queryByText('selected:cand-1')).toBeNull();
    expect(screen.getByText('selected:cand-2')).toBeTruthy();
    expect(screen.getByText('VOTAR POR BRUNO DIAZ')).toBeTruthy();
  });

  it('usa la descripcion de la consulta y copy de opciones cuando es referendum', async () => {
    repository.getElection.mockResolvedValue({
      id: 'election-ref-1',
      title: 'Consulta institucional',
      organization: 'UMSA',
      objective: '¿Aprueba la nueva normativa institucional?',
      questionTitle: '¿Aprueba la nueva normativa institucional?',
      isReferendum: true,
    });
    repository.getCandidates.mockResolvedValue([
      {
        id: 'cand-ref-1',
        partyName: 'Sí',
        presidentName: 'Sí',
        partyColor: '#0F766E',
        isReferendum: true,
      },
    ]);

    const screen = renderScreen({
      params: {
        election: {
          id: 'election-ref-1',
          title: 'Consulta institucional',
          organization: 'UMSA',
          objective: '¿Aprueba la nueva normativa institucional?',
          questionTitle: '¿Aprueba la nueva normativa institucional?',
          isReferendum: true,
        },
      },
    });

    await waitFor(() => {
      expect(
        screen.getByText('¿Aprueba la nueva normativa institucional?'),
      ).toBeTruthy();
    });

    expect(screen.getByText('Referéndum')).toBeTruthy();
    expect(screen.queryByText('Elige a un candidato')).toBeNull();

    fireEvent.press(screen.getByTestId('candidateCard_cand-ref-1'));

    expect(screen.getByText('VOTAR ESTA OPCIÓN')).toBeTruthy();
  });

  it('envia el voto online, construye el metadata real y navega al comprobante en exito', async () => {
    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(startVoteJournal).toHaveBeenCalledWith({
        electionId: 'election-1',
        candidateId: 'cand-1',
        candidateName: 'Lista Azul',
        presidentName: 'Ana Perez',
        electionTitle: 'Consejo universitario',
        organization: 'UMSA',
        presentialSessionId: null,
        candidateSelected: {
          partyName: 'Lista Azul',
          presidentName: 'Ana Perez',
          ticketEntries: [],
          viceName: 'Luis Rojas',
        },
      });
    });

    expect(repository.submitVote).toHaveBeenCalledWith(
      'election-1',
      'cand-1',
      undefined,
    );
    expect(recordVote).toHaveBeenCalledWith('cand-1', true, {
      participationId: 'server-participation',
      participatedAt: '2026-01-01T10:00:00.000Z',
      transactionId: '0xabc',
      electionId: 'election-1',
      electionTitle: 'Consejo universitario',
      organization: 'UMSA',
      candidateSelected: {
        partyName: 'Lista Azul',
        presidentName: 'Ana Perez',
        ticketEntries: [],
        viceName: 'Luis Rojas',
      },
    });

    expect(navigation.replace).toHaveBeenCalledWith(StackNav.VotingReceiptScreen, {
      participationId: 'local-participation',
      electionId: 'election-1',
    });
  });

  it('no pide QR cuando presentialKioskEnabled esta apagado', async () => {
    const screen = renderScreen({
      params: {
        election: {
          ...election,
          presentialKioskEnabled: false,
        },
      },
    });

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(repository.submitVote).toHaveBeenCalledWith(
        'election-1',
        'cand-1',
        undefined,
      );
    });
    expect(repository.verifyVoteQrCode).not.toHaveBeenCalled();
    expect(screen.queryByTestId('scanQrButton')).toBeNull();
  });

  it('pide QR cuando presentialKioskEnabled esta encendido y envia presentialSessionId al submit final', async () => {
    const screen = renderScreen({
      params: {
        election: {
          ...election,
          presentialKioskEnabled: true,
        },
      },
    });

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(screen.getByTestId('scanQrButton')).toBeTruthy();
    });
    expect(repository.submitVote).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('scanQrButton'));

    await waitFor(() => {
      expect(repository.verifyVoteQrCode).toHaveBeenCalledWith('qr-token-1');
      expect(repository.submitVote).toHaveBeenCalledWith(
        'election-1',
        'cand-1',
        'presential-session-1',
      );
    });
  });

  it('si el scan QR falla muestra error y no envia el voto', async () => {
    repository.verifyVoteQrCode.mockRejectedValueOnce(new Error('Qr verification failed'));

    const screen = renderScreen({
      params: {
        election: {
          ...election,
          presentialKioskEnabled: true,
        },
      },
    });

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await screen.findByTestId('scanQrButton');
    fireEvent.press(screen.getByTestId('scanQrButton'));

    await waitFor(() => {
      expect(repository.verifyVoteQrCode).toHaveBeenCalledWith('qr-token-1');
      expect(repository.submitVote).not.toHaveBeenCalled();
      expect(screen.getByText('Código QR no reconocido')).toBeTruthy();
    });
  });

  it('si el voto QR queda emitido en cadena pero falla backend, encola sincronizacion con presentialSessionId', async () => {
    repository.submitVote.mockResolvedValueOnce({
      success: false,
      error: 'Backend unavailable',
      blockchainCommitted: true,
      shouldQueueBackendSync: true,
      presentialSessionId: 'presential-session-1',
    });
    recordVote.mockResolvedValueOnce({id: 'queued-backend-sync'});

    const screen = renderScreen({
      params: {
        election: {
          ...election,
          presentialKioskEnabled: true,
        },
      },
    });

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await screen.findByTestId('scanQrButton');
    fireEvent.press(screen.getByTestId('scanQrButton'));

    await waitFor(() => {
      expect(enqueueBackendParticipationSync).toHaveBeenCalledWith({
        electionId: 'election-1',
        candidateId: 'cand-1',
        candidateName: 'Lista Azul',
        presidentName: 'Ana Perez',
        electionTitle: 'Consejo universitario',
        presentialSessionId: 'presential-session-1',
      });
    });

    expect(screen.getByText('Voto emitido, sincronización pendiente')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('encola el voto directamente cuando no hay internet', async () => {
    checkInternetConnection.mockResolvedValueOnce(false);
    recordVote.mockResolvedValueOnce({id: 'queued-offline'});

    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(enqueueVote).toHaveBeenCalled();
    });

    expect(repository.submitVote).not.toHaveBeenCalled();
    expect(screen.getByText('Voto Guardado en Dispositivo')).toBeTruthy();
  });

  it('encola el voto cuando falla por red y navega al comprobante offline al cerrar el modal', async () => {
    repository.submitVote.mockResolvedValueOnce({
      success: false,
      error: 'network request failed',
    });
    checkInternetConnection
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    recordVote.mockResolvedValueOnce({id: 'queued-local'});

    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(enqueueVote).toHaveBeenCalledWith({
        electionId: 'election-1',
        candidateId: 'cand-1',
        candidateName: 'Lista Azul',
        presidentName: 'Ana Perez',
        electionTitle: 'Consejo universitario',
      });
    });

    expect(recordVote).toHaveBeenCalledWith('cand-1', false, {
      electionId: 'election-1',
      electionTitle: 'Consejo universitario',
      organization: 'UMSA',
      candidateSelected: {
        partyName: 'Lista Azul',
        presidentName: 'Ana Perez',
        ticketEntries: [],
        viceName: 'Luis Rojas',
      },
    });

    fireEvent.press(screen.getByTestId('offlineDismissButton'));
    expect(navigation.replace).toHaveBeenCalledWith(StackNav.VotingReceiptScreen, {
      participationId: 'queued-local',
      electionId: 'election-1',
    });
  });

  it('usa fallback offline cuando hay red local pero el backend no responde', async () => {
    backendProbe.mockResolvedValueOnce({ok: false, errorType: 'SERVER_5XX'});
    recordVote.mockResolvedValueOnce({id: 'queued-by-probe'});

    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(enqueueVote).toHaveBeenCalledWith({
        electionId: 'election-1',
        candidateId: 'cand-1',
        candidateName: 'Lista Azul',
        presidentName: 'Ana Perez',
        electionTitle: 'Consejo universitario',
        presentialSessionId: null,
      });
    });

    expect(screen.getByText('Conexión con el servidor pendiente')).toBeTruthy();
    expect(repository.submitVote).not.toHaveBeenCalled();
  });

  it('captura y muestra error del backend cuando el voto no puede registrarse', async () => {
    repository.submitVote.mockResolvedValueOnce({
      success: false,
      error: 'already_voted',
    });

    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    fireEvent.press(screen.getByTestId('confirmVoteButton'));

    await waitFor(() => {
      expect(clearVoteJournal).toHaveBeenCalledWith('election-1');
    });

    expect(captureError).toHaveBeenCalled();
    expect(screen.getByText('Esta votación ya figura como registrada para tu usuario.')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('previene doble envio mientras el primer confirm sigue en curso', async () => {
    let resolveSubmit;
    repository.submitVote.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSubmit = resolve;
        }),
    );

    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');
    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    fireEvent.press(screen.getByTestId('voteButton'));
    const confirmButton = await screen.findByTestId('confirmVoteButton');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(repository.submitVote).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(confirmButton);
    expect(repository.submitVote).toHaveBeenCalledTimes(1);

    resolveSubmit({
      success: true,
      participationId: 'server-participation',
      participatedAt: '2026-01-01T10:00:00.000Z',
      transactionId: '0xabc',
    });

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalled();
    });
  });
});
