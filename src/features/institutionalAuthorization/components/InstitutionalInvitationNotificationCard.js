import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {FRONTEND_RESULTS} from '@env';
import {
  acceptInstitutionalInvitation,
  extractInstitutionalAuthorizationErrorCode,
  getInstitutionalInvitationRequest,
  rejectInstitutionalInvitation,
} from '../api/institutionalAuthorizationApi';

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
  institutionName: data?.institutionName || data?.tenantName,
  dni: data?.dni || data?.requesterDni,
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

export default function InstitutionalInvitationNotificationCard({
  notification,
  onStatusChange,
}) {
  const initial = useMemo(
    () => normalizeInvitation(notification?.data || {}),
    [notification],
  );
  const [invitation, setInvitation] = useState(initial);
  const [loading, setLoading] = useState(Boolean(initial.invitationId));
  const [validated, setValidated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [requiresAdminAccount, setRequiresAdminAccount] = useState(false);
  const inFlightRef = useRef(false);
  const status = invitation.status;
  const actionable = status === 'PENDING' && validated && !busy && !loading;
  const hasExistingAccount = invitation.hasAdminAccount === true;

  useEffect(() => {
    let active = true;
    const loadInvitation = async () => {
      if (!initial.invitationId) {
        if (active) {
          setLoading(false);
          setValidated(false);
          setMessage('La invitación no contiene un identificador válido.');
        }
        return;
      }
      try {
        const detail = await getInstitutionalInvitationRequest(initial.invitationId);
        if (active && detail) {
          setInvitation(current => ({...current, ...detail}));
          setValidated(true);
        }
      } catch (error) {
        if (active) {
          setValidated(false);
          setMessage(resolveErrorMessage(error, 'No se pudo validar la invitación.'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadInvitation();
    return () => {
      active = false;
    };
  }, [initial.invitationId]);

  const handleAccept = async () => {
    if (!actionable || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const accepted = await acceptInstitutionalInvitation(invitation.invitationId);
      if (accepted?.status === 'REQUIRES_ADMIN_ACCOUNT') {
        setRequiresAdminAccount(true);
        setMessage('Para aceptar la invitación debes crear tu cuenta administrativa.');
        return;
      }
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

  const openAdministrativeRegistration = async () => {
    const base = String(FRONTEND_RESULTS || '').replace(/\/+$/, '');
    if (!base || !invitation.invitationId) {
      setMessage('No se pudo abrir el registro administrativo.');
      return;
    }
    const url = `${base}/votacion/registrarse?invitationId=${encodeURIComponent(
      invitation.invitationId,
    )}`;
    try {
      await Linking.openURL(url);
    } catch {
      setMessage('No se pudo abrir el registro administrativo.');
    }
  };

  const handleReject = async () => {
    if (!actionable || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      await rejectInstitutionalInvitation(invitation.invitationId);
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
        {loading ? 'Validando' : statusLabels[status] || status}
      </Text>
      <Text style={styles.info}>CI o DNI: {invitation.dni || 'No disponible'}</Text>
      <Text style={styles.info}>Vence: {formatDateTime(invitation.expiresAt)}</Text>
      {loading ? (
        <Text style={styles.info}>Validando invitación segura...</Text>
      ) : hasExistingAccount ? (
        <Text style={styles.info}>Se reutilizará tu cuenta actual.</Text>
      ) : (
        <Text style={styles.info}>
          Crearás tus propias credenciales administrativas para esta institución.
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
      {requiresAdminAccount ? (
        <TouchableOpacity
          testID="institutionalInvitationCreateAccountButton"
          style={styles.primaryButton}
          onPress={openAdministrativeRegistration}>
          <Text style={styles.primaryButtonText}>Crear cuenta administrativa</Text>
        </TouchableOpacity>
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
