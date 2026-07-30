import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import InstitutionalInvitationNotificationCard from '../../../../src/features/institutionalAuthorization/components/InstitutionalInvitationNotificationCard';
import {StorageService} from '../../../../src/services/StorageService';

const selectorState = {
  wallet: {
    payload: {
      email: 'admin.existente@example.com',
    },
  },
};

jest.mock('react-redux', () => ({
  useSelector: jest.fn(selector => selector(selectorState)),
}));

jest.mock('../../../../src/services/StorageService', () => ({
  StorageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi', () => ({
  acceptInstitutionalInvitation: jest.fn(),
  extractInstitutionalAuthorizationErrorCode: jest.fn(error => error?.code || null),
  rejectInstitutionalInvitation: jest.fn(),
}));

const api = require('../../../../src/features/institutionalAuthorization/api/institutionalAuthorizationApi');

describe('InstitutionalInvitationNotificationCard', () => {
  const notification = {
    data: {
      event: 'INVITATION_CREATED',
      invitationId: 'inv-1',
      token: 'token-1',
      institutionName: 'Colegio Médico',
      dni: '12345678',
      status: 'PENDING',
      expiresAt: '2099-01-01T00:00:00.000Z',
      hasAdminAccount: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    selectorState.wallet.payload.email = 'admin.existente@example.com';
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
    expect(screen.getByText('Colegio Médico')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('Se reutilizará tu cuenta actual.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('institutionalInvitationAcceptButton'));

    await waitFor(() =>
      expect(api.acceptInstitutionalInvitation).toHaveBeenCalledWith(
        'inv-1',
        'token-1',
        'admin.existente@example.com',
      ),
    );
    expect(await screen.findByText('Pendiente de aprobación')).toBeTruthy();
    expect(screen.getByText('Invitación aceptada. Queda pendiente de aprobación.')).toBeTruthy();
  });

  it('persona sin cuenta conserva referencia para continuar registro', async () => {
    selectorState.wallet.payload.email = '';
    const screen = render(
      <InstitutionalInvitationNotificationCard
        notification={{
          data: {
            ...notification.data,
            invitationId: 'inv-2',
            email: '',
            hasAdminAccount: false,
          },
        }}
      />,
    );

    fireEvent.press(screen.getByTestId('institutionalInvitationAcceptButton'));

    await waitFor(() => expect(StorageService.setItem).toHaveBeenCalled());
    expect(api.acceptInstitutionalInvitation).not.toHaveBeenCalled();
    expect(screen.getByText('Completa tu registro y luego vuelve a esta invitación.')).toBeTruthy();
  });

  it('rechazar invitación no acepta ni crea solicitud', async () => {
    const screen = render(
      <InstitutionalInvitationNotificationCard notification={notification} />,
    );

    fireEvent.press(screen.getByTestId('institutionalInvitationRejectButton'));

    await waitFor(() =>
      expect(api.rejectInstitutionalInvitation).toHaveBeenCalledWith('inv-1', 'token-1'),
    );
    expect(api.acceptInstitutionalInvitation).not.toHaveBeenCalled();
    expect(await screen.findByText('Rechazada')).toBeTruthy();
    expect(screen.getByText('Invitación rechazada.')).toBeTruthy();
  });
});
