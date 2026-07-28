import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import {
  claimInstitutionalAuthorization,
  extractInstitutionalAuthorizationErrorCode,
  getInstitutionalAuthorizationRequest,
  rejectInstitutionalAuthorization,
  startInstitutionalAuthorizationSigning,
  submitInstitutionalAuthorization,
} from '../api/institutionalAuthorizationApi';
import {
  getInstitutionalAuthorizationDeviceId,
  syncInstitutionalAuthorizationOutbox,
} from '../outbox/institutionalAuthorizationOutbox';
import {sendInstitutionalAuthorizationSubmission} from '../services/institutionalAuthorizationSubmission';
import {
  assertInstitutionalSignerWallet,
  isInstitutionalAuthorizationExpired,
} from '../utils/institutionalAuthorizationRules';

const POLLING_MS = 5000;
const POLLING_STATUSES = [
  'PENDING_CHAIN_CONFIRMATION',
  'CHAIN_RETRY_PENDING',
  'RECONCILIATION_PENDING',
  'CHAIN_FAILED',
];

const statusLabels = {
  PENDING_MOBILE_AUTHORIZATION: 'Pendiente de autorización',
  MOBILE_AUTHORIZATION_EXPIRED: 'Vencida',
  SIGNING: 'Firmando autorización',
  PENDING_CHAIN_CONFIRMATION: 'Procesando autorización',
  CHAIN_RETRY_PENDING: 'Error recuperable',
  RECONCILIATION_PENDING: 'Procesando autorización',
  APPROVED: 'Acceso habilitado',
  REVOKED: 'Acceso eliminado',
  REJECTED: 'Rechazada',
  CHAIN_FAILED: 'Error recuperable',
};

const errorMessages = {
  INSTITUTIONAL_AUTHORIZATION_EXPIRED: 'Esta autorización venció.',
  INSTITUTIONAL_AUTHORIZATION_ALREADY_CLAIMED:
    'Esta autorización ya está siendo procesada en otro dispositivo.',
  INSTITUTIONAL_AUTHORIZATION_DEVICE_MISMATCH:
    'Esta autorización ya está siendo procesada en otro dispositivo.',
  INSTITUTIONAL_AUTHORIZATION_WALLET_MISMATCH:
    'La billetera del teléfono no corresponde al administrador principal.',
  INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH:
    'No se pudo validar el paquete preparado para firma.',
  INSTITUTIONAL_AUTHORIZATION_SUBMISSION_CONFLICT:
    'La operación ya fue enviada y está siendo verificada.',
  INSTITUTIONAL_USER_OP_HASH_REQUIRED:
    'No se recibió el identificador de la operación firmada.',
};

const normalizePayload = data => ({
  applicationId: data?.applicationId || data?.requestId,
  requestId: data?.requestId || data?.applicationId,
  tenantId: data?.tenantId,
  institutionName: data?.institutionName || data?.tenantName,
  stableInstitutionId: data?.stableInstitutionId,
  requesterName: data?.requesterName || data?.name,
  requesterDni: data?.requesterDni || data?.dni,
  targetWallet: data?.targetWallet || data?.accountAddress,
  signerWallet: data?.signerWallet,
  action: data?.action || 'ADD_AUTHORIZED_ADDRESS',
  status: data?.status || 'PENDING_MOBILE_AUTHORIZATION',
  expiresAt: data?.expiresAt,
  userOpHash: data?.userOpHash,
  txHash: data?.txHash,
  safeMessage: data?.safeMessage,
  canSign: data?.canSign,
});

const actionLabels = {
  ADD_AUTHORIZED_ADDRESS: {
    row: 'Autorizar acceso institucional',
    target: 'Billetera a autorizar',
    modalTitle: '¿Autorizar acceso?',
    pending: 'Procesando autorización. El acceso todavía no está habilitado.',
    approved: 'Acceso habilitado.',
  },
  REMOVE_AUTHORIZED_ADDRESS: {
    row: 'Eliminar acceso institucional',
    target: 'Billetera a eliminar',
    modalTitle: '¿Eliminar acceso?',
    pending: 'Eliminación procesándose. El acceso se conserva hasta la confirmación de la red.',
    approved: 'Acceso eliminado.',
  },
};

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

const formatPlainValue = value => {
  if (value === null || value === undefined || value === '') return 'No disponible';
  return String(value);
};

const abbreviate = value => {
  const text = String(value || '').trim();
  if (!text) return 'No disponible';
  if (text.length <= 14) return text;
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
};

const maskDni = value => {
  const text = String(value || '').trim();
  if (text.length <= 4) return text || 'No disponible';
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
};

const getPrivateKey = payload =>
  String(payload?.privKey || payload?.payloadQr?.privKey || '').trim();

const getSmartAccountAddress = payload =>
  String(
    payload?.account ||
      payload?.accountAddress ||
      payload?.walletData?.address ||
      payload?.payloadQr?.account ||
      payload?.payloadQr?.accountAddress ||
      '',
  ).trim();

const sanitizeErrorText = value => {
  const text = String(value || '').trim();
  if (!text || /backend|axioserror|request failed|internal server error/i.test(text)) {
    return '';
  }
  return text;
};

const resolveErrorMessage = (
  error,
  fallback = 'No se pudo cargar la autorización institucional.',
) => {
  const code = error?.code || extractInstitutionalAuthorizationErrorCode(error);
  if (code && errorMessages[code]) return errorMessages[code];
  return sanitizeErrorText(error?.message) || fallback;
};

function InfoRow({label, value, testID}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text testID={testID} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

export default function InstitutionalAuthorizationNotificationCard({
  notification,
  onStatusChange,
}) {
  const initialSummary = useMemo(
    () => normalizePayload(notification?.data || {}),
    [notification],
  );
  const applicationId = initialSummary.applicationId;
  const walletPayload = useSelector(state => state.wallet?.payload);
  const privateKey = useMemo(() => getPrivateKey(walletPayload), [walletPayload]);
  const smartAccountAddress = useMemo(
    () => getSmartAccountAddress(walletPayload),
    [walletPayload],
  );
  const [request, setRequest] = useState(initialSummary);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(Boolean(applicationId));
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [preparedClaim, setPreparedClaim] = useState(null);
  const mountedRef = useRef(true);
  const prepareInFlightRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const rejectInFlightRef = useRef(false);

  const currentRequest = request || initialSummary;
  const expired = isInstitutionalAuthorizationExpired(currentRequest);
  const status = expired ? 'MOBILE_AUTHORIZATION_EXPIRED' : currentRequest?.status;
  const actionCopy = actionLabels[currentRequest?.action] || actionLabels.ADD_AUTHORIZED_ADDRESS;
  const isActionable =
    status === 'PENDING_MOBILE_AUTHORIZATION' &&
    currentRequest?.canSign !== false &&
    !busy &&
    !loading &&
    !expired;
  const isRejectable =
    status === 'PENDING_MOBILE_AUTHORIZATION' &&
    !currentRequest?.userOpHash &&
    !busy &&
    !loading &&
    !expired;

  const loadRequest = useCallback(async () => {
    if (!applicationId) return null;
    setLoading(true);
    setErrorMessage('');
    try {
      const next = await getInstitutionalAuthorizationRequest(
        applicationId,
        smartAccountAddress,
      );
      if (mountedRef.current) {
        const normalized = normalizePayload({...initialSummary, ...next});
        setRequest(normalized);
        onStatusChange?.(normalized.status);
      }
      return next;
    } catch (error) {
      if (mountedRef.current) setErrorMessage(resolveErrorMessage(error));
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [applicationId, initialSummary, onStatusChange, smartAccountAddress]);

  useEffect(() => {
    mountedRef.current = true;
    getInstitutionalAuthorizationDeviceId()
      .then(id => mountedRef.current && setDeviceId(id))
      .catch(() => {});
    syncInstitutionalAuthorizationOutbox(submitInstitutionalAuthorization).catch(() => {});
    loadRequest();
    return () => {
      mountedRef.current = false;
    };
  }, [loadRequest]);

  useEffect(() => {
    if (!POLLING_STATUSES.includes(status)) return undefined;
    const timer = setInterval(() => {
      loadRequest().catch(() => {});
    }, POLLING_MS);
    return () => clearInterval(timer);
  }, [loadRequest, status]);

  const handlePrepareAuthorization = async () => {
    if (!isActionable || !applicationId || prepareInFlightRef.current) return;
    prepareInFlightRef.current = true;
    setBusy(true);
    setErrorMessage('');
    try {
      const fresh = await getInstitutionalAuthorizationRequest(
        applicationId,
      );
      const normalizedFresh = normalizePayload({...initialSummary, ...fresh});
      if (isInstitutionalAuthorizationExpired(normalizedFresh)) {
        setRequest({...normalizedFresh, status: 'MOBILE_AUTHORIZATION_EXPIRED'});
        onStatusChange?.('MOBILE_AUTHORIZATION_EXPIRED');
        setErrorMessage('Esta autorización venció.');
        return;
      }
      assertInstitutionalSignerWallet(normalizedFresh.signerWallet, smartAccountAddress);
      const claim = await claimInstitutionalAuthorization(
        applicationId,
        deviceId,
      );
      await startInstitutionalAuthorizationSigning(
        applicationId,
        deviceId,
      );
      setRequest({...normalizedFresh, status: 'SIGNING'});
      onStatusChange?.('SIGNING');
      setPreparedClaim({request: fresh, claim});
      setConfirmVisible(true);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'No se pudo preparar la firma.'));
    } finally {
      prepareInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleSubmitAuthorization = async () => {
    if (!preparedClaim || busy || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setConfirmVisible(false);
    setBusy(true);
    setErrorMessage('');
    try {
      if (!privateKey || !smartAccountAddress) {
        throw new Error('Esta solicitud debe firmarse con la billetera institucional asignada.');
      }
      const {submitted} = await sendInstitutionalAuthorizationSubmission({
        applicationId,
        deviceId,
        walletAddress: smartAccountAddress,
        request: preparedClaim.request,
        claim: preparedClaim.claim,
        privateKey,
        smartAccountAddress,
      });
      setRequest(prev => {
        const normalized = normalizePayload({...prev, ...submitted});
        onStatusChange?.(normalized.status);
        return normalized;
      });
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'No se pudo enviar la autorización.'));
    } finally {
      submitInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!isRejectable || !applicationId || rejectInFlightRef.current) return;
    rejectInFlightRef.current = true;
    setBusy(true);
    setErrorMessage('');
    try {
      const rejected = await rejectInstitutionalAuthorization(
        applicationId,
        deviceId,
      );
      const normalized = normalizePayload({...initialSummary, ...rejected, status: 'REJECTED'});
      setRequest(normalized);
      onStatusChange?.(normalized.status);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'No se pudo rechazar la autorización.'));
    } finally {
      rejectInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const stateMessage = (() => {
    if (errorMessage) return errorMessage;
    if (expired) return 'Esta autorización venció. Debe solicitarse una nueva firma.';
    if (busy || status === 'SIGNING') return 'Firmando autorización...';
    if (status === 'PENDING_CHAIN_CONFIRMATION' || status === 'RECONCILIATION_PENDING') {
      return actionCopy.pending;
    }
    if (status === 'CHAIN_RETRY_PENDING' || status === 'CHAIN_FAILED') {
      return 'No se pudo confirmar todavía. El sistema volverá a intentar.';
    }
    if (status === 'APPROVED' || status === 'REVOKED') return actionCopy.approved;
    if (status === 'REJECTED') return 'Autorización rechazada.';
    return '';
  })();

  return (
    <View testID="institutionalAuthorizationCard" style={styles.card}>
      <Text testID="institutionalAuthorizationTitle" style={styles.title}>
        Autorización institucional
      </Text>
      <Text testID="institutionalAuthorizationInstitution" style={styles.subtitle}>
        {formatPlainValue(currentRequest?.institutionName)}
      </Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator testID="institutionalAuthorizationLoading" />
          <Text style={styles.loadingText}>Cargando solicitud...</Text>
        </View>
      ) : null}

      {!loading ? (
        <View style={styles.rows}>
          <InfoRow label="Estado" value={statusLabels[status] || formatPlainValue(status)} />
          <InfoRow label="Persona" value={formatPlainValue(currentRequest?.requesterName)} />
          <InfoRow label="CI o DNI" value={maskDni(currentRequest?.requesterDni)} />
          <InfoRow
            label={actionCopy.target}
            value={abbreviate(currentRequest?.targetWallet)}
            testID="institutionalAuthorizationTargetWallet"
          />
          <InfoRow
            label="Billetera firmante"
            value={abbreviate(currentRequest?.signerWallet)}
            testID="institutionalAuthorizationSignerWallet"
          />
          <InfoRow label="Acción" value={actionCopy.row} />
          <InfoRow label="Vence" value={formatDateTime(currentRequest?.expiresAt)} />
        </View>
      ) : null}

      {stateMessage ? (
        <Text testID="institutionalAuthorizationMessage" style={styles.message}>
          {stateMessage}
        </Text>
      ) : null}

      {errorMessage && !expired ? (
        <TouchableOpacity
          testID="institutionalAuthorizationRetryButton"
          style={styles.secondaryButton}
          onPress={loadRequest}
          disabled={loading || busy}>
          <Text style={styles.secondaryButtonText}>Volver a intentar</Text>
        </TouchableOpacity>
      ) : null}

      {isActionable || isRejectable ? (
        <View style={styles.actions}>
          {isRejectable ? (
            <TouchableOpacity
              testID="institutionalAuthorizationRejectButton"
              style={styles.secondaryButton}
              onPress={handleReject}
              disabled={busy || loading}>
              <Text style={styles.secondaryButtonText}>Rechazar</Text>
            </TouchableOpacity>
          ) : null}
          {isActionable ? (
            <TouchableOpacity
              testID="institutionalAuthorizationAcceptButton"
              style={styles.primaryButton}
              onPress={handlePrepareAuthorization}
              disabled={busy || loading}>
              <Text style={styles.primaryButtonText}>Aceptar y firmar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {confirmVisible ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{actionCopy.modalTitle}</Text>
              <Text style={styles.modalText}>
                La operación fue preparada por el sistema. Tu teléfono la firmará sin
                cambiar sus datos.
                {'\n'}
                Institución: {formatPlainValue(currentRequest?.institutionName)}
                {'\n'}
                Persona: {formatPlainValue(currentRequest?.requesterName)}
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  testID="institutionalAuthorizationCancelSignatureButton"
                  style={styles.secondaryButton}
                  onPress={() => setConfirmVisible(false)}
                  disabled={busy}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="institutionalAuthorizationSubmitSignatureButton"
                  style={styles.primaryButton}
                  onPress={handleSubmitAuthorization}
                  disabled={busy}>
                  <Text style={styles.primaryButtonText}>Firmar y enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  loadingText: {
    color: '#475569',
    marginLeft: 8,
  },
  rows: {
    marginTop: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
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
    paddingHorizontal: 14,
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
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  modalText: {
    color: '#475569',
    marginTop: 8,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
});
