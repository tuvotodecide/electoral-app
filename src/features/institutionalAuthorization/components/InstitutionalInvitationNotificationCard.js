import React, {useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';
import {
  acceptInstitutionalInvitation,
  extractInstitutionalAuthorizationErrorCode,
  rejectInstitutionalInvitation,
} from '../api/institutionalAuthorizationApi';
import {StorageService} from '../../../services/StorageService';

const INVITATION_RESUME_KEY = 'institutionalInvitation.resume';

const statusLabels = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
  PENDING_APPROVAL: 'Pendiente de aprobación',
};

const errorMessages = {
  INSTITUTIONAL_INVITATION_EXPIRED: 'La invitación venció.',
  INSTITUTIONAL_INVITATION_TOKEN_INVALID: 'La invitación ya no es válida.',
  INSTITUTIONAL_INVITATION_EMAIL_CONFLICT:
    'Ya tienes una cuenta registrada. Inicia sesión con tu correo actual.',
  IDENTITY_PERSON_NOT_REGISTERED:
    'La persona debe registrarse primero en Tu Voto Decide.',
};

const normalizeInvitation = data => ({
  invitationId: data?.invitationId || data?.id,
  token: data?.token || data?.invitationToken,
  institutionName: data?.institutionName || data?.tenantName,
  dni: data?.dni || data?.requesterDni,
  email: data?.email,
  status: data?.status || 'PENDING',
  expiresAt: data?.expiresAt,
  hasAdminAccount: data?.hasAdminAccount,
});

const formatDateTime = value => {
  if (!value) return 'No disponible';
  const parsed = Date.parse(String(value));
  if (!Number.isFinite(parsed)) return 'No disponible';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
};

const resolveErrorMessage = (error, fallback) => {
  const code = error?.code || extractInstitutionalAuthorizationErrorCode(error);
  if (code && errorMessages[code]) return errorMessages[code];
  const message = String(error?.message || '').trim();
  if (message && !/axioserror|request failed|internal server error/i.test(message)) {
    return message;
  }
  return fallback;
};

const getCurrentEmail = payload =>
  String(
    payload?.email ||
      payload?.payloadQr?.email ||
      payload?.vc?.credentialSubject?.email ||
      '',
  ).trim();

export const saveInstitutionalInvitationResume = async invitation => {
  await StorageService.setItem(INVITATION_RESUME_KEY, JSON.stringify(invitation));
};

export const getInstitutionalInvitationResume = async () => {
  try {
    const value = await StorageService.getItem(INVITATION_RESUME_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export default function InstitutionalInvitationNotificationCard({
  notification,
  onStatusChange,
}) {
  const initial = useMemo(
    () => normalizeInvitation(notification?.data || {}),
    [notification],
  );
  const walletPayload = useSelector(state => state.wallet?.payload);
  const currentEmail = useMemo(() => getCurrentEmail(walletPayload), [walletPayload]);
  const [invitation, setInvitation] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const inFlightRef = useRef(false);
  const status = invitation.status;
  const actionable = status === 'PENDING' && !busy;
  const hasExistingAccount =
    invitation.hasAdminAccount === true || Boolean(currentEmail || invitation.email);

  const handleAccept = async () => {
    if (!actionable || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      if (!hasExistingAccount) {
        await saveInstitutionalInvitationResume(invitation);
        setMessage('Completa tu registro y luego vuelve a esta invitación.');
        return;
      }
      const accepted = await acceptInstitutionalInvitation(
        invitation.invitationId,
        invitation.token,
        currentEmail || invitation.email,
      );
      const next = {
        ...invitation,
        status: accepted?.applicationStatus || accepted?.status || 'PENDING_APPROVAL',
      };
      setInvitation(next);
      onStatusChange?.(next.status);
      setMessage('Invitación aceptada. Queda pendiente de aprobación.');
    } catch (error) {
      setMessage(resolveErrorMessage(error, 'No se pudo aceptar la invitación.'));
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!actionable || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      await rejectInstitutionalInvitation(invitation.invitationId, invitation.token);
      const next = {...invitation, status: 'REJECTED'};
      setInvitation(next);
      onStatusChange?.('REJECTED');
      setMessage('Invitación rechazada.');
    } catch (error) {
      setMessage(resolveErrorMessage(error, 'No se pudo rechazar la invitación.'));
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  return (
    <View testID="institutionalInvitationCard" style={styles.card}>
      <Text style={styles.title}>Invitación institucional</Text>
      <Text testID="institutionalInvitationInstitution" style={styles.subtitle}>
        {invitation.institutionName || 'Institución'}
      </Text>
      <Text testID="institutionalInvitationStatus" style={styles.status}>
        {statusLabels[status] || status}
      </Text>
      <Text style={styles.info}>CI o DNI: {invitation.dni || 'No disponible'}</Text>
      <Text style={styles.info}>Vence: {formatDateTime(invitation.expiresAt)}</Text>
      {hasExistingAccount ? (
        <Text style={styles.info}>Se reutilizará tu cuenta actual.</Text>
      ) : (
        <Text style={styles.info}>
          Para aceptar debes completar tu registro en Tu Voto Decide.
        </Text>
      )}
      {message ? (
        <Text testID="institutionalInvitationMessage" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionable ? (
        <View style={styles.actions}>
          <TouchableOpacity
            testID="institutionalInvitationRejectButton"
            style={styles.secondaryButton}
            onPress={handleReject}
            disabled={busy}>
            <Text style={styles.secondaryButtonText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="institutionalInvitationAcceptButton"
            style={styles.primaryButton}
            onPress={handleAccept}
            disabled={busy}>
            <Text style={styles.primaryButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE4F2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#334155',
    fontSize: 15,
    marginTop: 4,
  },
  status: {
    alignSelf: 'flex-start',
    color: '#1447E6',
    backgroundColor: '#EAF0FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
    fontWeight: '700',
  },
  info: {
    color: '#475569',
    fontSize: 14,
    marginTop: 8,
  },
  message: {
    color: '#334155',
    fontSize: 14,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1447E6',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
});
