import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import CandidateScreen from '../../../../src/features/voting/screens/CandidateScreen';
import {StackNav, TabNav} from '../../../../src/navigation/NavigationKey';

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
  const MockCSafeAreaView = ({children}) => <View>{children}</View>;
  return MockCSafeAreaView;
});

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCHeader = ({title}) => <Text>{title}</Text>;
  return MockCHeader;
});

jest.mock('../../../../src/components/common/CText', () => {
  const React = require('react');
  const {Text} = require('react-native');
  const MockCText = ({children}) => <Text>{children}</Text>;
  return MockCText;
});

jest.mock('../../../../src/components/common/CButton', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  const MockCButton = ({title, onPress, disabled, testID}) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled: !!disabled}}
      disabled={disabled}
      onPress={onPress}
      testID={testID}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
  return MockCButton;
});

jest.mock('../../../../src/components/common/CustomModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  const MockCustomModal = ({
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
  return MockCustomModal;
});

jest.mock('../../../../src/features/voting/components/CandidateCard', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  const MockCandidateCard = ({candidate, isSelected, onSelect}) => (
    <TouchableOpacity onPress={onSelect} testID={`candidateCard_${candidate.id}`}>
      <Text>{candidate.partyName}</Text>
      {isSelected ? <Text>selected:{candidate.id}</Text> : null}
    </TouchableOpacity>
  );
  return MockCandidateCard;
});

jest.mock('../../../../src/features/voting/components/ConfirmVoteModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  const MockConfirmVoteModal = ({visible, presidentName, onConfirm, onCancel, isLoading}) =>
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
  return MockConfirmVoteModal;
});

jest.mock('../../../../src/features/voting/components/OfflineQueuedModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  const MockOfflineQueuedModal = ({visible, title, message, onDismiss}) =>
    visible ? (
      <View>
        <Text>{title}</Text>
        <Text>{message}</Text>
        <TouchableOpacity onPress={onDismiss} testID="offlineDismissButton">
          <Text>Entendido</Text>
        </TouchableOpacity>
      </View>
    ) : null;
  return MockOfflineQueuedModal;
});

jest.mock('../../../../src/features/voting/components/CameraScannerModal', () => {
  const React = require('react');
  const {Text, TouchableOpacity, View} = require('react-native');
  const MockCameraScannerModal = ({
    visible,
    onClose,
    onBarcodeScanned,
    hasPermission,
    onRequestPermission,
  }) =>
    visible ? (
      <View>
        <TouchableOpacity onPress={onClose} testID="cameraModalCloseButton">
          <Text>Cerrar</Text>
        </TouchableOpacity>
        {hasPermission ? (
          <View>
            <Text>Escanear QR</Text>
            <TouchableOpacity
              onPress={() => onBarcodeScanned({data: 'qr-token-1'})}
              testID="scanQrButton">
              <Text>Simular scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text>Se requiere permiso de cámara</Text>
            <TouchableOpacity
              onPress={onRequestPermission}
              testID="cameraModalPermissionButton">
              <Text>Conceder permiso</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ) : null;
  return MockCameraScannerModal;
});

jest.mock('expo-camera', () => {
  const React = require('react');
  let initialPermission = {granted: true, status: 'granted'};
  const requestPermissionMock = jest.fn(async () => ({
    granted: true,
    status: 'granted',
  }));

  const useCameraPermissions = () => {
    const [permission, setPermission] = React.useState(initialPermission);
    const requestPermission = React.useCallback(async () => {
      const result = await requestPermissionMock();
      setPermission(result);
      return result;
    }, []);
    return [permission, requestPermission];
  };

  return {
    __esModule: true,
    useCameraPermissions,
    __requestPermissionMock: requestPermissionMock,
    __setInitialCameraPermission: value => {
      initialPermission = value;
    },
  };
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
const {
  __requestPermissionMock: requestPermissionMock,
  __setInitialCameraPermission: setInitialCameraPermission,
} = require('expo-camera');

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
  const navigation = {replace: jest.fn(), reset: jest.fn()};
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
    setInitialCameraPermission({granted: true, status: 'granted'});
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

  it('VOT-BAL-P0-001 | renderiza la papeleta y carga opciones activas desde el repositorio', async () => {
    const screen = renderScreen({params: {election}});

    expect(screen.getByText('Papeleta')).toBeTruthy();
    expect(screen.getByText('Elige a un candidato')).toBeTruthy();

    await waitFor(() => {
      expect(repository.getCandidates).toHaveBeenCalledWith('election-1');
    });

    expect(screen.getByText('Lista Azul')).toBeTruthy();
    expect(screen.getByText('Lista Verde')).toBeTruthy();
  });

  it('deshabilita el boton de votar cuando falla la carga de candidaturas', async () => {
    repository.getCandidates.mockResolvedValueOnce([]);

    const screen = renderScreen({params: {election}});

    await waitFor(() => {
      expect(repository.getCandidates).toHaveBeenCalledWith('election-1');
    });

    const voteButton = screen.getByTestId('voteButton');
    expect(screen.queryByTestId('candidateCard_blank')).toBeNull();
    expect(screen.getByText(/selecciona un candidato/i)).toBeTruthy();
    expect(voteButton.props.accessibilityState.disabled).toBe(true);
  });

  it('deja la lista vacia y deshabilita el boton de votar cuando falla la carga de candidaturas', async () => {
    repository.getCandidates.mockRejectedValueOnce(new Error('network error'));

    const screen = renderScreen({params: {election}});

    await waitFor(() => {
      expect(repository.getCandidates).toHaveBeenCalledWith('election-1');
    });

    expect(screen.queryByText('Lista Azul')).toBeNull();
    expect(screen.queryByText('Lista Verde')).toBeNull();

    const voteButton = screen.getByTestId('voteButton');
    expect(screen.queryByTestId('candidateCard_blank')).toBeNull();
    expect(screen.getByText(/selecciona un candidato/i)).toBeTruthy();
    expect(voteButton.props.accessibilityState.disabled).toBe(true);
  });

  it('VOT-SEL-P0-001 / VOT-SEL-P1-003 | permite seleccion unica, cambio y deseleccion local sin carnet', async () => {
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

  it('deshabilita el boton de votar mientras no exista seleccion', async () => {
    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');

    const isVoteButtonDisabled = () =>
      screen.getByTestId('voteButton').props.accessibilityState.disabled;

    expect(screen.getByText(/selecciona un candidato/i)).toBeTruthy();
    expect(isVoteButtonDisabled()).toBe(true);

    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    expect(isVoteButtonDisabled()).toBe(false);

    fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
    expect(isVoteButtonDisabled()).toBe(true);
  });

  it('ofrece el voto en blanco como una opcion mas debajo de las candidaturas', async () => {
    const screen = renderScreen({params: {election}});

    await screen.findByText('Lista Azul');

    const cardIds = screen
      .getAllByTestId(/^candidateCard_/)
      .map(card => card.props.testID);
    expect(cardIds).toEqual([
      'candidateCard_cand-1',
      'candidateCard_cand-2',
      'candidateCard_blank',
    ]);

    fireEvent.press(screen.getByTestId('candidateCard_blank'));

    expect(screen.getByText('selected:blank')).toBeTruthy();
    expect(screen.getByText(/votar en blanco/i)).toBeTruthy();
    expect(
      screen.getByTestId('voteButton').props.accessibilityState.disabled,
    ).toBe(false);
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

  it('VOT-REV-P0-002 / VOT-PRE-P0-001 / VOT-UX-P1-001 | prepara y envia una sola vez el voto online con confirmacion controlada', async () => {
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

  it('KIO-HAB-P0-001 | no pide QR cuando presentialKioskEnabled esta apagado', async () => {
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

  it('KIO-SCN-P0-005 KIO-AUT-P0-001 KIO-CNS-P0-001 | pide QR cuando presentialKioskEnabled esta encendido y envia presentialSessionId al submit final', async () => {
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

  it('solicita permiso de camara y abre el escaner cuando el usuario lo concede', async () => {
    setInitialCameraPermission({granted: false, status: 'undetermined'});
    requestPermissionMock.mockResolvedValueOnce({granted: true, status: 'granted'});

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

    await screen.findByTestId('cameraModalPermissionButton');
    expect(screen.queryByTestId('scanQrButton')).toBeNull();

    fireEvent.press(screen.getByTestId('cameraModalPermissionButton'));

    await waitFor(() => {
      expect(requestPermissionMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('scanQrButton')).toBeTruthy();
    });
    expect(screen.queryByTestId('cameraModalPermissionButton')).toBeNull();
  });

  it('mantiene la vista de permiso sin abrir el escaner cuando el usuario deniega el permiso de camara', async () => {
    setInitialCameraPermission({granted: false, status: 'undetermined'});
    requestPermissionMock.mockResolvedValueOnce({granted: false, status: 'denied'});

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

    const permissionButton = await screen.findByTestId('cameraModalPermissionButton');
    fireEvent.press(permissionButton);

    await waitFor(() => {
      expect(requestPermissionMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId('scanQrButton')).toBeNull();
    expect(screen.getByTestId('cameraModalPermissionButton')).toBeTruthy();
    expect(repository.verifyVoteQrCode).not.toHaveBeenCalled();
    expect(repository.submitVote).not.toHaveBeenCalled();
  });

  it('cierra el modal de la camara al presionar el boton de cerrar', async () => {
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

    fireEvent.press(screen.getByTestId('cameraModalCloseButton'));

    expect(screen.queryByTestId('scanQrButton')).toBeNull();
    expect(screen.queryByTestId('cameraModalCloseButton')).toBeNull();
    expect(repository.submitVote).not.toHaveBeenCalled();
  });

  it('solicita permiso de camara y abre el escaner cuando el usuario lo concede', async () => {
    setInitialCameraPermission({granted: false, status: 'undetermined'});
    requestPermissionMock.mockResolvedValueOnce({granted: true, status: 'granted'});

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

    await screen.findByTestId('cameraModalPermissionButton');
    expect(screen.queryByTestId('scanQrButton')).toBeNull();

    fireEvent.press(screen.getByTestId('cameraModalPermissionButton'));

    await waitFor(() => {
      expect(requestPermissionMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('scanQrButton')).toBeTruthy();
    });
    expect(screen.queryByTestId('cameraModalPermissionButton')).toBeNull();
  });

  it('mantiene la vista de permiso sin abrir el escaner cuando el usuario deniega el permiso de camara', async () => {
    setInitialCameraPermission({granted: false, status: 'undetermined'});
    requestPermissionMock.mockResolvedValueOnce({granted: false, status: 'denied'});

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

    const permissionButton = await screen.findByTestId('cameraModalPermissionButton');
    fireEvent.press(permissionButton);

    await waitFor(() => {
      expect(requestPermissionMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId('scanQrButton')).toBeNull();
    expect(screen.getByTestId('cameraModalPermissionButton')).toBeTruthy();
    expect(repository.verifyVoteQrCode).not.toHaveBeenCalled();
    expect(repository.submitVote).not.toHaveBeenCalled();
  });

  it('cierra el modal de la camara al presionar el boton de cerrar', async () => {
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

    fireEvent.press(screen.getByTestId('cameraModalCloseButton'));

    expect(screen.queryByTestId('scanQrButton')).toBeNull();
    expect(screen.queryByTestId('cameraModalCloseButton')).toBeNull();
    expect(repository.submitVote).not.toHaveBeenCalled();
  });

  it('KIO-SCN-P0-004 KIO-VAL-P0-001 KIO-AUT-P1-002 KIO-SEC-P0-003 | si el scan QR falla muestra error y no envia el voto', async () => {
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

  it('muestra modal de sin conexion cuando es voto presencial y no hay internet', async () => {
    checkInternetConnection.mockResolvedValueOnce(false);

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
      expect(screen.getByText('Sin conexión')).toBeTruthy();
      expect(
        screen.getByText(
          'No se puede votar presencialmente sin conexión, revise su internet',
        ),
      ).toBeTruthy();
    });

    expect(repository.verifyVoteQrCode).not.toHaveBeenCalled();
    expect(repository.submitVote).not.toHaveBeenCalled();
    expect(enqueueVote).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('muestra modal de sin conexion cuando es voto presencial y no hay internet', async () => {
    checkInternetConnection.mockResolvedValueOnce(false);

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
      expect(screen.getByText('Sin conexión')).toBeTruthy();
      expect(
        screen.getByText(
          'No se puede votar presencialmente sin conexión, revise su internet',
        ),
      ).toBeTruthy();
    });

    expect(repository.verifyVoteQrCode).not.toHaveBeenCalled();
    expect(repository.submitVote).not.toHaveBeenCalled();
    expect(enqueueVote).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('VOT-ERR-P0-002 / KIO-CNS-P1-003 / KIO-CON-P0-002 | si el voto queda emitido en cadena pero falla backend, encola sincronizacion sin reenviar', async () => {
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

    expect(repository.submitVote).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Voto emitido, sincronización pendiente')).toBeTruthy();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('VOT-ERR-P1-003 | encola el voto directamente cuando hay error antes de enviar por falta de internet', async () => {
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

  it('KIO-SCN-P1-001 KIO-CON-P0-004 | bloquea apertura de camara presencial offline sin emitir ni encolar voto', async () => {
    checkInternetConnection.mockResolvedValueOnce(false);

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
      expect(screen.getByText('Sin conexión')).toBeTruthy();
      expect(
        screen.getByText('No se puede votar presencialmente sin conexión, revise su internet'),
      ).toBeTruthy();
    });

    expect(screen.queryByTestId('scanQrButton')).toBeNull();
    expect(repository.verifyVoteQrCode).not.toHaveBeenCalled();
    expect(repository.submitVote).not.toHaveBeenCalled();
    expect(enqueueVote).not.toHaveBeenCalled();
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

  it('VOT-ERR-P1-003 | usa fallback offline cuando el verificador/backend no responde antes de enviar', async () => {
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

  it('VOT-ERR-P0-001 | captura nullifier usado o voto duplicado con error recuperable', async () => {
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

  describe('EA2-09 tokens de respaldo agotados', () => {
    const creditsEmptyMessage =
      'Lo sentimos, los tokens de respaldo para esta votación se agotaron';

    const submitVoteUntilCreditsEmpty = async screen => {
      await screen.findByText('Lista Azul');
      fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
      fireEvent.press(screen.getByTestId('voteButton'));
      fireEvent.press(screen.getByTestId('confirmVoteButton'));

      await waitFor(() => {
        expect(screen.getByText(creditsEmptyMessage)).toBeTruthy();
      });
    };

    it('EA2-09-002 muestra el mensaje de tokens agotados cuando el backend responde 409', async () => {
      repository.submitVote.mockResolvedValueOnce({
        success: false,
        error: creditsEmptyMessage,
      });

      const screen = renderScreen({params: {election}});
      await submitVoteUntilCreditsEmpty(screen);

      expect(screen.getByText('No se pudo registrar el voto')).toBeTruthy();
      expect(navigation.replace).not.toHaveBeenCalled();
      expect(enqueueVote).not.toHaveBeenCalled();
    });

    it('EA2-09-003 solo ofrece volver al inicio y no permite reintentar el voto sin tokens', async () => {
      repository.submitVote.mockResolvedValueOnce({
        success: false,
        error: creditsEmptyMessage,
      });

      const screen = renderScreen({params: {election}});
      await submitVoteUntilCreditsEmpty(screen);

      expect(screen.queryByTestId('customModalSecondaryButton')).toBeNull();
      expect(screen.queryByText('Reintentar')).toBeNull();
      expect(screen.getByText('Volver al inicio')).toBeTruthy();

      fireEvent.press(screen.getByTestId('customModalPrimaryButton'));

      await waitFor(() => {
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
      expect(repository.submitVote).toHaveBeenCalledTimes(1);
    });

    it('EA2-09-004 muestra el mensaje de tokens agotados en el voto presencial por QR', async () => {
      repository.submitVote.mockResolvedValueOnce({
        success: false,
        error: creditsEmptyMessage,
      });

      const screen = renderScreen({
        params: {election: {...election, presentialKioskEnabled: true}},
      });

      await screen.findByText('Lista Azul');
      fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
      fireEvent.press(screen.getByTestId('voteButton'));
      fireEvent.press(screen.getByTestId('confirmVoteButton'));

      await waitFor(() => expect(screen.getByTestId('scanQrButton')).toBeTruthy());
      fireEvent.press(screen.getByTestId('scanQrButton'));

      await waitFor(() => {
        expect(screen.getByText(creditsEmptyMessage)).toBeTruthy();
      });
      // No cae en el copy genérico de error de QR: el motivo real es el límite
      // de tokens de la votación.
      expect(screen.queryByText('Error al procesar el voto')).toBeNull();
      expect(
        screen.queryByText(
          'Ocurrió un error al procesar tu voto. Puedes intentar escaneando el código QR nuevamente.',
        ),
      ).toBeNull();
      expect(screen.queryByTestId('customModalSecondaryButton')).toBeNull();
      expect(enqueueBackendParticipationSync).not.toHaveBeenCalled();
    });

    it('EA2-09-005 mantiene reintentar y cerrar para errores de voto distintos a tokens agotados', async () => {
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
        expect(
          screen.getByText('Esta votación ya figura como registrada para tu usuario.'),
        ).toBeTruthy();
      });

      expect(screen.getByText('Reintentar')).toBeTruthy();
      expect(screen.getByTestId('customModalSecondaryButton')).toBeTruthy();
      expect(navigation.reset).not.toHaveBeenCalled();
    });
  });

  it('VOT-ERR-P0-001 / VOT-REV-P0-002 | previene doble envio mientras el primer confirm sigue en curso', async () => {
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

  describe('modo demostración', () => {
    const {
      __resetDemoSessionForTests,
      startDemoSession,
    } = require('../../../../src/features/demo/demoSession');

    afterEach(() => {
      __resetDemoSessionForTests();
    });

    it('no sondea la red y emite el voto igualmente', async () => {
      await startDemoSession();
      // Peor caso: el revisor prueba con la red caída.
      checkInternetConnection.mockResolvedValue(false);
      backendProbe.mockResolvedValue({ok: false});

      const screen = renderScreen({params: {election}});

      await screen.findByText('Lista Azul');
      fireEvent.press(screen.getByTestId('candidateCard_cand-1'));
      fireEvent.press(screen.getByTestId('voteButton'));
      fireEvent.press(screen.getByTestId('confirmVoteButton'));

      await waitFor(() => {
        expect(repository.submitVote).toHaveBeenCalled();
      });

      expect(backendProbe).not.toHaveBeenCalled();
      expect(checkInternetConnection).not.toHaveBeenCalled();
      expect(enqueueVote).not.toHaveBeenCalled();
      expect(navigation.replace).toHaveBeenCalled();
    });

    it('sin demo, la red caída sigue encolando el voto', async () => {
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
    });
  });
});
