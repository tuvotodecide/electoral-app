import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import OfficialPublicationRequestScreen from '../../../../src/features/officialPublication/screens/OfficialPublicationRequestScreen';
import {renderWithProviders} from '../../../setup/test-utils';
import {buildOfficialPublicationCallDataHash} from '../../../../src/features/officialPublication/utils/officialPublicationHash';

jest.mock('@env', () => ({
  CHAIN: 'base-sepolia',
}));

jest.mock('../../../../src/components/common/CHeader', () => {
  const React = require('react');
  const {Text} = require('react-native');
  function CHeader({title, testID}) {
    return React.createElement(Text, {testID}, title);
  }
  return CHeader;
});

jest.mock('../../../../src/components/common/CSafeAreaView', () => {
  const React = require('react');
  const {View} = require('react-native');
  function CSafeAreaView ({children, style}) {
    return React.createElement(View, {style}, children);
  }
  return CSafeAreaView;
});

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

jest.mock('../../../../src/features/officialPublication/api/officialPublicationApi', () => ({
  claimOfficialPublication: jest.fn(),
  extractOfficialPublicationErrorCode: jest.fn(error => error?.code || null),
  getOfficialPublicationRequest: jest.fn(),
  rejectOfficialPublication: jest.fn(),
  startOfficialPublicationSigning: jest.fn(),
  submitOfficialPublication: jest.fn(),
}));

jest.mock('../../../../src/features/officialPublication/outbox/officialPublicationOutbox', () => ({
  getOfficialPublicationDeviceId: jest.fn(async () => 'device-1'),
  markOfficialPublicationOutboxSynced: jest.fn(async () => []),
  saveOfficialPublicationOutboxItem: jest.fn(async item => item),
  syncOfficialPublicationOutbox: jest.fn(async () => []),
}));

jest.mock('../../../../src/api/account', () => ({
  sendOperationWithUserOpHash: jest.fn(async () => ({
    userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    smartAccountAddress: '0x1111111111111111111111111111111111111111',
    entryPointAddress: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789',
    entryPointVersion: '0.6',
  })),
}));

const api = require('../../../../src/features/officialPublication/api/officialPublicationApi');
const outbox = require('../../../../src/features/officialPublication/outbox/officialPublicationOutbox');
const account = require('../../../../src/api/account');
const {useSelector} = require('react-redux');

describe('OfficialPublicationRequestScreen', () => {
  const targetAddress = '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb';
  const callData = '0x12345678';
  const callDataHash = buildOfficialPublicationCallDataHash({
    targetAddress,
    value: '0',
    callData,
  });
  const request = {
    requestId: 'req-1',
    eventId: 'event-1',
    eventName: 'Elección oficial',
    institutionName: 'Institución Uno',
    status: 'PENDING_APPROVAL',
    expiresAt: '2099-01-01T06:00:00.000Z',
    votingStart: '2099-01-01T12:00:00.000Z',
    votingEnd: '2099-01-01T18:00:00.000Z',
    resultsPublishAt: '2099-01-01T20:00:00.000Z',
    publicationDeadline: '2099-01-01T06:00:00.000Z',
    canPublish: true,
    votersCount: '3',
    requiredCredits: '3',
    requiredTvd: '3000000000000000000',
    tvdPerCredit: '1000000000000000000',
    smartAccountAddress: '0x1111111111111111111111111111111111111111',
    signerWallet: '0x1111111111111111111111111111111111111111',
    chainId: 84532,
  };
  const claim = {
    requestId: 'req-1',
    status: 'CLAIMED',
    claimExpiresAt: '2099-01-01T06:10:00.000Z',
    execution: {
      chainId: 84532,
      targetAddress,
      value: '0',
      callData,
      callDataHash,
      onChainElectionId: '1',
    },
    economicSummary: {
      votersCount: '3',
      requiredCredits: '3',
      requiredTvd: '3000000000000000000',
      tvdPerCredit: '1000000000000000000',
    },
  };

  const renderScreen = () =>
    renderWithProviders(
      <OfficialPublicationRequestScreen route={{params: {requestId: 'req-1'}}} />,
      {
        initialState: {
          wallet: {
            payload: {
              did: 'did:example:admin',
              privKey: '0xpriv',
              account: '0x1111111111111111111111111111111111111111',
            },
          },
        },
      },
    );

  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockImplementation(selector =>
      selector({
        wallet: {
          payload: {
            did: 'did:example:admin',
            privKey: '0xpriv',
            account: '0x1111111111111111111111111111111111111111',
          },
        },
      }),
    );
    api.getOfficialPublicationRequest.mockResolvedValue(request);
    api.claimOfficialPublication.mockResolvedValue(claim);
    api.startOfficialPublicationSigning.mockResolvedValue({
      ...request,
      status: 'SIGNING',
    });
    api.submitOfficialPublication.mockResolvedValue({
      ...request,
      status: 'SUBMITTED',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    api.rejectOfficialPublication.mockResolvedValue({
      ...request,
      status: 'REJECTED',
    });
  });

  it('muestra detalle seguro sin callData ni datos internos', async () => {
    const screen = renderScreen();

    expect(screen.getByText('Validando identidad del dispositivo...')).toBeTruthy();
    expect(await screen.findByText('Elección oficial')).toBeTruthy();
    expect(screen.getByText('Institución Uno')).toBeTruthy();
    expect(screen.getByText('Empadronados')).toBeTruthy();
    expect(screen.getByText('TVD requerido')).toBeTruthy();
    expect(screen.getByText('3 TVD')).toBeTruthy();
    expect(screen.getByTestId('officialPublicationWallet').props.children).toBe(
      '0x1111...1111',
    );
    expect(screen.queryByText(callData)).toBeNull();
    expect(screen.queryByText(callDataHash)).toBeNull();
  });

  it('EA2-05-001 muestra en la solicitud de firma que la votación es abierta y el máximo de votantes', async () => {
    api.getOfficialPublicationRequest.mockResolvedValueOnce({
      ...request,
      isOpenVoting: true,
      votersCount: '500',
    });

    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    expect(screen.getByText('Tipo de votación')).toBeTruthy();
    expect(screen.getByText('Votación abierta')).toBeTruthy();
    expect(screen.getByText('Número de votos disponibles')).toBeTruthy();
    expect(screen.getByText('500')).toBeTruthy();
    expect(screen.queryByText('Empadronados')).toBeNull();
  });

  it('EA2-05-002 muestra empadronados y votación cerrada cuando la solicitud no es de votación abierta', async () => {
    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    expect(screen.getByText('Tipo de votación')).toBeTruthy();
    expect(screen.getByText('Votación cerrada')).toBeTruthy();
    expect(screen.getByText('Empadronados')).toBeTruthy();
    expect(screen.queryByText('Número de votos disponibles')).toBeNull();
    expect(screen.queryByText('Votación abierta')).toBeNull();
  });

  it('abre modal y cancelar no ejecuta requests de firma', async () => {
    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    fireEvent.press(screen.getByTestId('officialPublicationConfirmButton'));
    expect(screen.getByText('¿Confirmar publicación oficial?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('officialPublicationModalCancel'));

    expect(api.claimOfficialPublication).not.toHaveBeenCalled();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('muestra error de validacion silenciosa sin login ni ceros falsos', async () => {
    api.getOfficialPublicationRequest.mockRejectedValueOnce({
      response: {status: 401},
    });

    const screen = renderScreen();

    expect(
      await screen.findByText('No se pudo validar la identidad de este dispositivo.'),
    ).toBeTruthy();
    expect(screen.getByText('Reintentar validación')).toBeTruthy();
    expect(screen.queryByText('Empadronados')).toBeNull();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('Iniciar sesion')).toBeNull();
  });

  it('confirma con claim, signing, wrapper AA, outbox y submission', async () => {
    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    fireEvent.press(screen.getByTestId('officialPublicationConfirmButton'));
    fireEvent.press(screen.getByTestId('officialPublicationModalConfirm'));

    await waitFor(() => expect(api.claimOfficialPublication).toHaveBeenCalledWith(
      'req-1',
      'device-1',
    ));
    expect(api.startOfficialPublicationSigning).toHaveBeenCalledWith(
      'req-1',
      'device-1',
    );
    expect(account.sendOperationWithUserOpHash).toHaveBeenCalledWith(
      '0xpriv',
      '0x1111111111111111111111111111111111111111',
      'base-sepolia',
      [{to: targetAddress, value: '0', data: callData}],
    );
    expect(outbox.saveOfficialPublicationOutboxItem).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-1',
        deviceId: 'device-1',
        userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        syncStatus: 'PENDING',
      }),
    );
    expect(api.submitOfficialPublication).toHaveBeenCalledWith(
      'req-1',
      'device-1',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      undefined,
    );
    expect(outbox.markOfficialPublicationOutboxSynced).toHaveBeenCalled();
  });

  it('bloquea envio si el hash canonico no coincide', async () => {
    api.claimOfficialPublication.mockResolvedValueOnce({
      ...claim,
      execution: {
        ...claim.execution,
        callDataHash: `${callDataHash.slice(0, -1)}${callDataHash.endsWith('0') ? '1' : '0'}`,
      },
    });
    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    fireEvent.press(screen.getByTestId('officialPublicationConfirmButton'));
    fireEvent.press(screen.getByTestId('officialPublicationModalConfirm'));

    await waitFor(() =>
      expect(screen.getByText('No se pudo validar el paquete preparado para firma.')).toBeTruthy(),
    );
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
    expect(api.submitOfficialPublication).not.toHaveBeenCalled();
  });

  it('rechaza sin ejecutar blockchain y deshabilita publicacion con ventana cerrada', async () => {
    api.getOfficialPublicationRequest.mockResolvedValueOnce({
      ...request,
      canPublish: false,
      blockingReason: 'PUBLICATION_WINDOW_CLOSED',
    });
    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    expect(screen.getByText('El tiempo para confirmar esta publicación terminó.')).toBeTruthy();
    expect(screen.getByTestId('officialPublicationConfirmButton').props.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('officialPublicationRejectButton'));
    await waitFor(() => expect(api.rejectOfficialPublication).toHaveBeenCalledWith(
      'req-1',
      'device-1',
    ));
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('no firma si backend marca solicitud no ready por configuracion contractual', async () => {
    api.getOfficialPublicationRequest.mockResolvedValueOnce({
      ...request,
      publicationReadiness: 'PUBLICATION_CONTRACT_ROLE_MISSING',
    });
    const screen = renderScreen();
    await screen.findByText('Elección oficial');

    expect(
      screen.getByText(
        'Configuración contractual pendiente. Solicita una nueva preparación cuando infraestructura quede lista.',
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('officialPublicationConfirmButton').props.disabled).toBe(true);

    fireEvent.press(screen.getByTestId('officialPublicationConfirmButton'));
    expect(api.claimOfficialPublication).not.toHaveBeenCalled();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });
});
