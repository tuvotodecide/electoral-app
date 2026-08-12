import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import InstitutionalAuthorizationNotificationCard from '../../../../src/features/institutionalAuthorization/components/InstitutionalAuthorizationNotificationCard';

jest.mock('@env', () => ({
  CHAIN: 'base-sepolia',
  BACKEND_RESULT: 'https://backend.example.test',
}));

const selectorState = {
  wallet: {
    payload: {
      privKey: '0xpriv',
      account: '0x1111111111111111111111111111111111111111',
    },
  },
};

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector => selector(selectorState)),
}));

jest.mock('../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi', () => ({
  claimInstitutionalAuthorization: jest.fn(),
  extractInstitutionalAuthorizationErrorCode: jest.fn(error => error?.code || null),
  getInstitutionalAuthorizationRequest: jest.fn(),
  rejectInstitutionalAuthorization: jest.fn(),
  startInstitutionalAuthorizationSigning: jest.fn(),
  submitInstitutionalAuthorization: jest.fn(),
}));

jest.mock('../../../../src/features/institutionalAuthorization/outbox/institutionalAuthorizationOutbox', () => ({
  getInstitutionalAuthorizationDeviceId: jest.fn(async () => 'device-1'),
  markInstitutionalAuthorizationOutboxSynced: jest.fn(async () => []),
  saveInstitutionalAuthorizationOutboxItem: jest.fn(async item => item),
  syncInstitutionalAuthorizationOutbox: jest.fn(async () => []),
}));

jest.mock('../../../../src/api/account', () => ({
  sendOperationWithUserOpHash: jest.fn(),
}));

const api = require('../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi');
const account = require('../../../../src/api/account');

describe('InstitutionalAuthorizationNotificationCard', () => {
  const request = {
    applicationId: 'app-1',
    requestId: 'app-1',
    tenantId: 'tenant-1',
    institutionName: 'Colegio Médico',
    stableInstitutionId: 'tenant-1',
    requesterName: 'Persona Solicitante',
    requesterDni: '12345678',
    targetWallet: '0x2222222222222222222222222222222222222222',
    signerWallet: '0x1111111111111111111111111111111111111111',
    action: 'ADD_AUTHORIZED_ADDRESS',
    status: 'PENDING_MOBILE_AUTHORIZATION',
    expiresAt: '2099-01-01T00:00:00.000Z',
    canSign: true,
  };
  const notification = {
    data: {
      event: 'MOBILE_AUTHORIZATION_REQUESTED',
      applicationId: 'app-1',
      institutionName: 'Colegio Médico',
      status: 'PENDING_MOBILE_AUTHORIZATION',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    selectorState.wallet.payload.account = '0x1111111111111111111111111111111111111111';
    api.getInstitutionalAuthorizationRequest.mockResolvedValue(request);
    api.claimInstitutionalAuthorization.mockResolvedValue({
      request,
      execution: {
        chainId: 84532,
        stableInstitutionId: 'tenant-1',
        action: 'ADD_AUTHORIZED_ADDRESS',
        signerWallet: '0x1111111111111111111111111111111111111111',
        targetWallet: '0x2222222222222222222222222222222222222222',
        calls: [{
          target: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
          value: '0',
          callData: '0x1234',
          purpose: 'ADD_AUTHORIZED_ADDRESS',
        }],
      },
    });
    api.startInstitutionalAuthorizationSigning.mockResolvedValue({
      ...request,
      status: 'SIGNING',
    });
    api.rejectInstitutionalAuthorization.mockResolvedValue({
      ...request,
      status: 'REJECTED',
    });
    api.submitInstitutionalAuthorization.mockResolvedValue({
      ...request,
      status: 'PENDING_CHAIN_CONFIRMATION',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    account.sendOperationWithUserOpHash.mockResolvedValue({
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
  });

  it('D-SIGN-001: muestra datos de autorización vigente y permite decidir', async () => {
    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );

    expect(screen.getByText('Autorización institucional')).toBeTruthy();
    expect(screen.getByText('Colegio Médico')).toBeTruthy();
    expect(await screen.findByText('Pendiente de autorización')).toBeTruthy();
    expect(screen.getByText('Persona Solicitante')).toBeTruthy();
    expect(screen.getByText('12***78')).toBeTruthy();
    expect(screen.getByText('Autorizar acceso institucional')).toBeTruthy();
    expect(screen.getByText('Aceptar y firmar')).toBeTruthy();
    expect(screen.getByText('Rechazar')).toBeTruthy();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('D-SIGN-004: bloquea firma si la billetera local no corresponde', async () => {
    selectorState.wallet.payload.account = '0x3333333333333333333333333333333333333333';
    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );
    fireEvent.press(await screen.findByTestId('institutionalAuthorizationAcceptButton'));

    expect(await screen.findByText('La billetera del teléfono no corresponde al administrador principal.')).toBeTruthy();
    expect(api.claimInstitutionalAuthorization).not.toHaveBeenCalled();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('D-SIGN-003: rechazar cierra sin firmar ni enviar operación', async () => {
    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );
    fireEvent.press(await screen.findByTestId('institutionalAuthorizationRejectButton'));

    await waitFor(() =>
      expect(api.rejectInstitutionalAuthorization).toHaveBeenCalledWith(
        'app-1',
        'device-1',
      ),
    );
    expect(await screen.findByText('Autorización rechazada.')).toBeTruthy();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('D-SIGN-005/D-SIGN-007/D-SIGN-008: doble pulsación prepara una firma local y deja procesando autorización', async () => {
    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );
    const acceptButton = await screen.findByTestId('institutionalAuthorizationAcceptButton');

    fireEvent.press(acceptButton);
    fireEvent.press(acceptButton);

    await waitFor(() =>
      expect(api.claimInstitutionalAuthorization).toHaveBeenCalledTimes(1),
    );
    expect(api.startInstitutionalAuthorizationSigning).toHaveBeenCalledTimes(1);
    expect(screen.getByText('¿Autorizar acceso?')).toBeTruthy();

    fireEvent.press(screen.getByTestId('institutionalAuthorizationSubmitSignatureButton'));

    await waitFor(() =>
      expect(account.sendOperationWithUserOpHash).toHaveBeenCalledTimes(1),
    );
    expect(account.sendOperationWithUserOpHash).toHaveBeenCalledWith(
      '0xpriv',
      '0x1111111111111111111111111111111111111111',
      'base-sepolia',
      [{
        to: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
        value: '0',
        data: '0x1234',
      }],
    );
    await waitFor(() =>
      expect(api.submitInstitutionalAuthorization).toHaveBeenCalledWith(
        'app-1',
        'device-1',
        '0x1111111111111111111111111111111111111111',
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      ),
    );
    expect(await screen.findByText('Procesando autorización')).toBeTruthy();
    expect(screen.getByText('Procesando autorización. El acceso todavía no está habilitado.')).toBeTruthy();
  });

  it('D-REV-003/D-REV-004: firma eliminación con removeAuthorizedAddress desde el detalle', async () => {
    const removeRequest = {
      ...request,
      action: 'REMOVE_AUTHORIZED_ADDRESS',
      status: 'PENDING_MOBILE_AUTHORIZATION',
    };
    api.getInstitutionalAuthorizationRequest
      .mockResolvedValueOnce(removeRequest)
      .mockResolvedValueOnce(removeRequest);
    api.claimInstitutionalAuthorization.mockResolvedValueOnce({
      request: {
        ...request,
        action: 'REMOVE_AUTHORIZED_ADDRESS',
      },
      execution: {
        chainId: 84532,
        stableInstitutionId: 'tenant-1',
        action: 'REMOVE_AUTHORIZED_ADDRESS',
        signerWallet: '0x1111111111111111111111111111111111111111',
        targetWallet: '0x2222222222222222222222222222222222222222',
        calls: [{
          target: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
          value: '0',
          callData: '0x5678',
          purpose: 'REMOVE_AUTHORIZED_ADDRESS',
        }],
      },
    });

    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );
    expect(await screen.findByText('Eliminar acceso institucional')).toBeTruthy();

    fireEvent.press(screen.getByTestId('institutionalAuthorizationAcceptButton'));
    await waitFor(() =>
      expect(api.claimInstitutionalAuthorization).toHaveBeenCalledWith(
        'app-1',
        'device-1',
      ),
    );
    expect(screen.getByText('¿Eliminar acceso?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('institutionalAuthorizationSubmitSignatureButton'));

    await waitFor(() =>
      expect(account.sendOperationWithUserOpHash).toHaveBeenCalledWith(
        '0xpriv',
        '0x1111111111111111111111111111111111111111',
        'base-sepolia',
        [{
          to: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
          value: '0',
          data: '0x5678',
        }],
      ),
    );
  });

  it('D-TRF-005/D-TRF-006: firma transferencia principal desde el detalle sin pantalla intermedia', async () => {
    const transferRequest = {
      ...request,
      action: 'CHANGE_INSTITUTION_ADMIN',
      status: 'PENDING_MOBILE_AUTHORIZATION',
    };
    api.getInstitutionalAuthorizationRequest
      .mockResolvedValueOnce(transferRequest)
      .mockResolvedValueOnce(transferRequest);
    api.claimInstitutionalAuthorization.mockResolvedValueOnce({
      request: transferRequest,
      execution: {
        chainId: 84532,
        stableInstitutionId: 'tenant-1',
        action: 'CHANGE_INSTITUTION_ADMIN',
        signerWallet: '0x1111111111111111111111111111111111111111',
        targetWallet: '0x2222222222222222222222222222222222222222',
        calls: [{
          target: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
          value: '0',
          callData: '0x9abc',
          purpose: 'CHANGE_INSTITUTION_ADMIN',
        }],
      },
    });

    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );
    expect(await screen.findByText('Transferir rol principal')).toBeTruthy();
    expect(screen.queryByText('Revisar autorización')).toBeNull();

    fireEvent.press(screen.getByTestId('institutionalAuthorizationAcceptButton'));
    await waitFor(() =>
      expect(api.claimInstitutionalAuthorization).toHaveBeenCalledWith(
        'app-1',
        'device-1',
      ),
    );
    expect(screen.getByText('¿Transferir rol principal?')).toBeTruthy();
    fireEvent.press(screen.getByTestId('institutionalAuthorizationSubmitSignatureButton'));

    await waitFor(() =>
      expect(account.sendOperationWithUserOpHash).toHaveBeenCalledWith(
        '0xpriv',
        '0x1111111111111111111111111111111111111111',
        'base-sepolia',
        [{
          to: '0x7B57eE9103fc46eD6794329C36D2919293F0Fabb',
          value: '0',
          data: '0x9abc',
        }],
      ),
    );
  });

  it('D-SIGN-002/D-SIGN-014/D-RETRY-004: autorización vencida queda sin acciones', async () => {
    api.getInstitutionalAuthorizationRequest.mockResolvedValueOnce({
      ...request,
      status: 'MOBILE_AUTHORIZATION_EXPIRED',
      expiresAt: '2020-01-01T00:00:00.000Z',
      canSign: false,
    });
    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );

    expect(await screen.findByText('Vencida')).toBeTruthy();
    expect(screen.queryByText('Aceptar y firmar')).toBeNull();
    expect(screen.queryByText('Rechazar')).toBeNull();
  });

  it('D-SIGN-009/D-SIGN-012/D-SIGN-013/D-RETRY-007: refresca autorización procesando sin pedir otra firma', async () => {
    api.getInstitutionalAuthorizationRequest.mockResolvedValueOnce({
      ...request,
      status: 'PENDING_CHAIN_CONFIRMATION',
      canSign: false,
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });

    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );

    expect(await screen.findByText('Procesando autorización')).toBeTruthy();
    expect(screen.queryByText('Aceptar y firmar')).toBeNull();
    expect(screen.queryByText('Rechazar')).toBeNull();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('UI-02: no habilita firma si una notificación antigua no trae canSign', async () => {
    api.getInstitutionalAuthorizationRequest.mockResolvedValueOnce({
      ...request,
      canSign: undefined,
    });

    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );

    await screen.findByText('Pendiente de autorización');
    expect(screen.queryByText('Aceptar y firmar')).toBeNull();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('UI-04/UI-05: el polling mantiene procesamiento y luego refleja aprobación sin reabrir la firma', async () => {
    jest.useFakeTimers();
    api.getInstitutionalAuthorizationRequest
      .mockResolvedValueOnce({
        ...request,
        status: 'PENDING_CHAIN_CONFIRMATION',
        canSign: false,
        userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
      .mockResolvedValueOnce({
        ...request,
        status: 'APPROVED',
        canSign: false,
        userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      });

    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );

    await screen.findByText('Procesando autorización');
    expect(screen.queryByText('Aceptar y firmar')).toBeNull();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });
    expect(await screen.findByText('Acceso habilitado')).toBeTruthy();
    expect(screen.queryByText('Aceptar y firmar')).toBeNull();
    jest.useRealTimers();
  });

  it('D-SIGN-010/D-RETRY-001/D-RETRY-002/D-RETRY-003: muestra error recuperable y conserva operación local', async () => {
    api.getInstitutionalAuthorizationRequest.mockResolvedValueOnce({
      ...request,
      status: 'CHAIN_RETRY_PENDING',
      canSign: false,
      safeMessage: 'El sistema volverá a intentar la confirmación.',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });

    const screen = render(
      <InstitutionalAuthorizationNotificationCard notification={notification} />,
    );

    expect(await screen.findByText('Error recuperable')).toBeTruthy();
    expect(screen.getByText('No se pudo confirmar todavía. El sistema volverá a intentar.')).toBeTruthy();
    expect(screen.queryByText('Aceptar y firmar')).toBeNull();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });
});
