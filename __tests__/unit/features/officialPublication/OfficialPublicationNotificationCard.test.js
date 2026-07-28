import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import OfficialPublicationNotificationCard, {
  formatTvdAmount,
} from '../../../../src/features/officialPublication/components/OfficialPublicationNotificationCard';

jest.mock('@env', () => ({
  CHAIN: 'base-sepolia',
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector =>
    selector({
      wallet: {
        payload: {
          privKey: '0xpriv',
          account: '0x1111111111111111111111111111111111111111',
        },
      },
    }),
  ),
}));

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
  sendOperationWithUserOpHash: jest.fn(),
}));

jest.mock(
  '../../../../src/features/officialPublication/utils/officialPublicationHash',
  () => ({
    OFFICIAL_PUBLICATION_CALLDATA_MISMATCH:
      'OFFICIAL_PUBLICATION_CALLDATA_MISMATCH',
    assertOfficialPublicationExecutionMatches: jest.fn(() => ({
      calls: [{target: '0xTarget', value: '0', callData: '0x1234'}],
    })),
  }),
);

const api = require('../../../../src/features/officialPublication/api/officialPublicationApi');
const account = require('../../../../src/api/account');

describe('OfficialPublicationNotificationCard', () => {
  const notification = {
    id: 'notification-1',
    data: {
      type: 'OFFICIAL_PUBLICATION_REQUEST',
      requestId: 'req-1',
      eventName: 'Votación oficial',
      institutionName: 'Institución Uno',
      status: 'PENDING_APPROVAL',
      votingStartAt: '2099-01-01T12:00:00.000Z',
      votingEndAt: '2099-01-01T18:00:00.000Z',
      resultsPublishAt: '2099-01-01T20:00:00.000Z',
      expiresAt: '2099-01-01T21:00:00.000Z',
      votersCount: '120',
      requiredCredits: '4',
      requiredTvd: '1000000000000000000',
      smartAccountAddress: '0x1111111111111111111111111111111111111111',
    },
  };

  const authoritativeRequest = {
    requestId: 'req-1',
    eventName: 'Votación oficial',
    institutionName: 'Institución Uno',
    status: 'PENDING_APPROVAL',
    votingStart: '2099-01-01T12:00:00.000Z',
    votingEnd: '2099-01-01T18:00:00.000Z',
    resultsPublishAt: '2099-01-01T20:00:00.000Z',
    publicationDeadline: '2099-01-01T21:00:00.000Z',
    expiresAt: '2099-01-01T21:00:00.000Z',
    canPublish: true,
    votersCount: '120',
    requiredCredits: '4',
    requiredTvd: '1000000000000000000',
    smartAccountAddress: '0x1111111111111111111111111111111111111111',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.getOfficialPublicationRequest.mockResolvedValue(authoritativeRequest);
    api.claimOfficialPublication.mockResolvedValue({
      requestId: 'req-1',
      status: 'CLAIMED',
      execution: {
        chainId: 84532,
        targetAddress: '0xTarget',
        value: '0',
        callData: '0x1234',
        callDataHash: '0xhash',
      },
    });
    api.startOfficialPublicationSigning.mockResolvedValue({
      ...authoritativeRequest,
      status: 'SIGNING',
    });
    api.rejectOfficialPublication.mockResolvedValue({
      ...authoritativeRequest,
      status: 'REJECTED',
    });
    api.submitOfficialPublication.mockResolvedValue({
      ...authoritativeRequest,
      status: 'SUBMITTED',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    account.sendOperationWithUserOpHash.mockResolvedValue({
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
  });

  it('muestra todos los datos oficiales dentro de la notificación y no muestra Revisar solicitud', async () => {
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);

    expect(screen.getByText('Validando la solicitud...')).toBeTruthy();
    expect(screen.getByText('Votación oficial')).toBeTruthy();
    expect(screen.getByText('Institución Uno')).toBeTruthy();
    expect(screen.getByText('Estado')).toBeTruthy();
    expect(screen.getByText('Fecha de inicio')).toBeTruthy();
    expect(screen.getByText('Fecha de finalización')).toBeTruthy();
    expect(screen.getByText('Publicación de resultados')).toBeTruthy();
    expect(screen.getByText('Empadronados')).toBeTruthy();
    expect(screen.getByText('Créditos requeridos')).toBeTruthy();
    expect(screen.getByText('TVD requerido')).toBeTruthy();
    expect(screen.getByText('Tiempo límite para confirmar')).toBeTruthy();
    expect(screen.getByText('Smart account')).toBeTruthy();
    expect(screen.getByText('0x1111...1111')).toBeTruthy();
    expect(screen.queryByText('Revisar solicitud')).toBeNull();
    expect(await screen.findByText('Pendiente de confirmación')).toBeTruthy();
  });

  it('solicitud vigente muestra Confirmar publicación y Rechazar', async () => {
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);

    expect(await screen.findByText('Confirmar publicación')).toBeTruthy();
    expect(screen.getByText('Rechazar')).toBeTruthy();
  });

  it.each([
    ['SUBMITTED', 'Firmado correctamente. Esperando confirmación en blockchain.'],
    ['COMPLETED', 'La votación fue publicada oficialmente.'],
    ['REJECTED', 'La solicitud de publicación fue rechazada.'],
    ['EXPIRED', 'El tiempo para confirmar esta publicación terminó.'],
    ['FAILED_FINAL', 'La publicación requiere revisión.'],
    ['NEEDS_REVIEW', 'La publicación requiere revisión.'],
  ])('%s queda solo lectura sin acciones', async (status, message) => {
    api.getOfficialPublicationRequest.mockResolvedValueOnce({
      ...authoritativeRequest,
      status,
      expiresAt: status === 'EXPIRED' ? '2020-01-01T00:00:00.000Z' : '2099-01-01T21:00:00.000Z',
      publicationDeadline:
        status === 'EXPIRED' ? '2020-01-01T00:00:00.000Z' : '2099-01-01T21:00:00.000Z',
      userOpHash:
        status === 'SUBMITTED'
          ? '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
          : undefined,
    });

    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.queryByText('Confirmar publicación')).toBeNull();
    expect(screen.queryByText('Rechazar')).toBeNull();
  });

  it('solicitud expirada no muestra acciones y muestra mensaje funcional', async () => {
    api.getOfficialPublicationRequest.mockResolvedValueOnce({
      ...authoritativeRequest,
      status: 'EXPIRED',
      expiresAt: '2020-01-01T00:00:00.000Z',
      publicationDeadline: '2020-01-01T00:00:00.000Z',
    });
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);

    expect(await screen.findByText('Solicitud expirada')).toBeTruthy();
    expect(
      screen.getByText('El tiempo para confirmar esta publicación terminó.'),
    ).toBeTruthy();
    expect(screen.queryByText('Confirmar publicación')).toBeNull();
    expect(screen.queryByText('Rechazar')).toBeNull();
  });

  it('abrir la tarjeta no ejecuta claim', async () => {
    render(<OfficialPublicationNotificationCard notification={notification} />);

    await waitFor(() =>
      expect(api.getOfficialPublicationRequest).toHaveBeenCalledWith('req-1'),
    );
    expect(api.claimOfficialPublication).not.toHaveBeenCalled();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('confirmar ejecuta claim una sola vez y espera confirmación explícita para firmar', async () => {
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);
    const button = await screen.findByTestId('officialPublicationNotificationConfirmButton');

    fireEvent.press(button);
    fireEvent.press(button);

    await waitFor(() =>
      expect(api.claimOfficialPublication).toHaveBeenCalledTimes(1),
    );
    expect(api.startOfficialPublicationSigning).toHaveBeenCalledTimes(1);
    expect(screen.getByText('¿Confirmar publicación oficial?')).toBeTruthy();
    expect(account.sendOperationWithUserOpHash).not.toHaveBeenCalled();
  });

  it('firma desde notificaciones y no muestra blockchain antes de /submission', async () => {
    let resolveSubmission;
    api.submitOfficialPublication.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveSubmission = resolve;
        }),
    );
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);
    fireEvent.press(await screen.findByTestId('officialPublicationNotificationConfirmButton'));
    fireEvent.press(await screen.findByTestId('officialPublicationNotificationModalConfirm'));

    await waitFor(() => expect(account.sendOperationWithUserOpHash).toHaveBeenCalledTimes(1));
    expect(api.submitOfficialPublication).toHaveBeenCalledWith(
      'req-1',
      'device-1',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      undefined,
    );
    expect(
      screen.queryByText('Firmado correctamente. Esperando confirmación en blockchain.'),
    ).toBeNull();

    resolveSubmission({
      ...authoritativeRequest,
      status: 'SUBMITTED',
      userOpHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });

    expect(
      await screen.findByText('Firmado correctamente. Esperando confirmación en blockchain.'),
    ).toBeTruthy();
  });

  it('error de sendUserOperation es visible y no envía submission sin userOpHash', async () => {
    account.sendOperationWithUserOpHash.mockRejectedValueOnce(
      new Error('No se pudo enviar la publicación'),
    );
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);
    fireEvent.press(await screen.findByTestId('officialPublicationNotificationConfirmButton'));
    fireEvent.press(await screen.findByTestId('officialPublicationNotificationModalConfirm'));

    expect(await screen.findByText('No se pudo enviar la publicación')).toBeTruthy();
    expect(api.submitOfficialPublication).not.toHaveBeenCalled();
  });

  it('no envía submission si la firma no devuelve userOpHash', async () => {
    account.sendOperationWithUserOpHash.mockResolvedValueOnce({});
    const screen = render(<OfficialPublicationNotificationCard notification={notification} />);
    fireEvent.press(await screen.findByTestId('officialPublicationNotificationConfirmButton'));
    fireEvent.press(await screen.findByTestId('officialPublicationNotificationModalConfirm'));

    expect(
      await screen.findByText('No se recibió el identificador de la operación.'),
    ).toBeTruthy();
    expect(api.submitOfficialPublication).not.toHaveBeenCalled();
  });

  it('formatea TVD en unidades humanas desde decimal y hexadecimal', () => {
    expect(formatTvdAmount('1000000000000000000')).toBe('1 TVD');
    expect(formatTvdAmount('1500000000000000000')).toBe('1,5 TVD');
    expect(formatTvdAmount('0xde0b6b3a7640000')).toBe('1 TVD');
  });

  it('no muestra valores falsos en cero cuando falla la carga autoritativa', async () => {
    api.getOfficialPublicationRequest.mockRejectedValueOnce({
      response: {status: 500},
    });
    const incompleteNotification = {
      ...notification,
      data: {
        type: 'OFFICIAL_PUBLICATION_REQUEST',
        requestId: 'req-1',
        eventName: 'Votación oficial',
        institutionName: 'Institución Uno',
      },
    };

    const screen = render(
      <OfficialPublicationNotificationCard notification={incompleteNotification} />,
    );

    expect(await screen.findByText('No se pudo cargar la solicitud.')).toBeTruthy();
    expect(screen.getAllByText('No disponible').length).toBeGreaterThan(0);
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('0 TVD')).toBeNull();
  });
});
