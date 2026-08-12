import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {Linking} from 'react-native';
import InstitutionalInvitationNotificationCard from '../../../../src/features/institutionalAuthorization/components/InstitutionalInvitationNotificationCard';
jest.mock('@env', () => ({FRONTEND_RESULTS: 'https://frontend.example'}));
jest.mock('../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi', () => ({
  acceptInstitutionalInvitation: jest.fn(),
  extractInstitutionalAuthorizationErrorCode: jest.fn(error => error?.code || null),
  getInstitutionalInvitationRequest: jest.fn(),
  rejectInstitutionalInvitation: jest.fn(),
}));

const api = require('../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi');

describe('InstitutionalInvitationNotificationCard', () => {
  const notification = {
    data: {
      event: 'INVITATION_CREATED',
      invitationId: 'inv-1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.getInstitutionalInvitationRequest.mockResolvedValue({
      invitationId: 'inv-1',
      institutionName: 'Colegio Médico',
      dni: '12345678',
      status: 'PENDING',
      expiresAt: '2099-01-01T00:00:00.000Z',
      hasAdminAccount: true,
    });
    api.acceptInstitutionalInvitation.mockResolvedValue({
      applicationStatus: 'PENDING_APPROVAL',
    });
    api.rejectInstitutionalInvitation.mockResolvedValue({
      status: 'REJECTED',
    });
  });

  it('abre invitación con cuenta existente y la deja pendiente de aprobación', async () => {
    const screen = render(
      <InstitutionalInvitationNotificationCard notification={notification} />,
    );

    expect(screen.getByText('Invitación institucional')).toBeTruthy();
    expect(await screen.findByText('Colegio Médico')).toBeTruthy();
    expect(await screen.findByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('Se reutilizará tu cuenta actual.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('institutionalInvitationAcceptButton'));

    await waitFor(() =>
      expect(api.acceptInstitutionalInvitation).toHaveBeenCalledWith(
        'inv-1',
      ),
    );
    expect(await screen.findByText('Pendiente de aprobación')).toBeTruthy();
    expect(screen.getByText('Invitación aceptada. Queda pendiente de aprobación.')).toBeTruthy();
  });

  it('muestra error controlado si falta el identificador de invitación', async () => {
    const screen = render(
      <InstitutionalInvitationNotificationCard
        notification={{
          data: {
            event: 'INVITATION_CREATED',
          },
        }}
      />,
    );

    expect(await screen.findByText('La invitación no contiene un identificador válido.')).toBeTruthy();
    expect(api.acceptInstitutionalInvitation).not.toHaveBeenCalled();
  });

  it('D3 muestra el registro administrativo sin aceptar la invitación prematuramente', async () => {
    api.getInstitutionalInvitationRequest.mockResolvedValueOnce({
      invitationId: 'inv-1',
      institutionName: 'Colegio Médico',
      dni: '12345678',
      status: 'PENDING',
      expiresAt: '2099-01-01T00:00:00.000Z',
      hasAdminAccount: false,
    });
    api.acceptInstitutionalInvitation.mockResolvedValueOnce({
      status: 'REQUIRES_ADMIN_ACCOUNT',
      invitationId: 'inv-1',
      tenant: {id: 'tenant-1', name: 'Colegio Médico'},
    });
    const screen = render(
      <InstitutionalInvitationNotificationCard notification={notification} />,
    );

    fireEvent.press(await screen.findByTestId('institutionalInvitationAcceptButton'));

    expect(
      await screen.findByText('Para aceptar la invitación debes crear tu cuenta administrativa.'),
    ).toBeTruthy();
    expect(screen.getByTestId('institutionalInvitationCreateAccountButton')).toBeTruthy();
    expect(screen.queryByText('Pendiente de aprobación')).toBeNull();
  });

  it('D3 abre el registro web solo con el identificador opaco de la invitación', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined);
    api.getInstitutionalInvitationRequest.mockResolvedValueOnce({
      invitationId: 'inv-1',
      institutionName: 'Colegio Médico',
      dni: '12345678',
      status: 'PENDING',
      expiresAt: '2099-01-01T00:00:00.000Z',
      hasAdminAccount: false,
    });
    api.acceptInstitutionalInvitation.mockResolvedValueOnce({
      status: 'REQUIRES_ADMIN_ACCOUNT',
      invitationId: 'inv-1',
    });
    const screen = render(
      <InstitutionalInvitationNotificationCard notification={notification} />,
    );

    fireEvent.press(await screen.findByTestId('institutionalInvitationAcceptButton'));
    fireEvent.press(await screen.findByTestId('institutionalInvitationCreateAccountButton'));

    await waitFor(() =>
      expect(openUrl).toHaveBeenCalledWith(
        'https://frontend.example/votacion/registrarse?invitationId=inv-1',
      ),
    );
    expect(openUrl.mock.calls[0][0]).not.toMatch(/dni|wallet|password|email/i);
    openUrl.mockRestore();
  });

  it('no habilita acciones si la validación segura falla', async () => {
    api.getInstitutionalInvitationRequest.mockRejectedValueOnce({
      code: 'INSTITUTIONAL_INVITATION_EXPIRED',
    });
    const screen = render(
      <InstitutionalInvitationNotificationCard notification={notification} />,
    );

    expect(await screen.findByText('La invitación venció.')).toBeTruthy();
    expect(screen.queryByTestId('institutionalInvitationAcceptButton')).toBeNull();
    expect(screen.queryByTestId('institutionalInvitationRejectButton')).toBeNull();
  });

  it('rechazar invitación no acepta ni crea solicitud', async () => {
    const screen = render(
      <InstitutionalInvitationNotificationCard notification={notification} />,
    );

    fireEvent.press(
      await screen.findByTestId('institutionalInvitationRejectButton'),
    );

    await waitFor(() =>
      expect(api.rejectInstitutionalInvitation).toHaveBeenCalledWith('inv-1'),
    );
    expect(api.acceptInstitutionalInvitation).not.toHaveBeenCalled();
    expect(await screen.findByText('Rechazada')).toBeTruthy();
    expect(screen.getByText('Invitación rechazada.')).toBeTruthy();
  });
});
