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
  claimOfficialPublication,
  extractOfficialPublicationErrorCode,
  getOfficialPublicationRequest,
  rejectOfficialPublication,
  startOfficialPublicationSigning,
  submitOfficialPublication,
} from '../api/officialPublicationApi';
import {
  getOfficialPublicationDeviceId,
  syncOfficialPublicationOutbox,
} from '../outbox/officialPublicationOutbox';
import {sendOfficialPublicationSubmission} from '../services/officialPublicationConfirmation';

const POLLING_MS = 5000;
const POLLING_STATUSES = [
  'SUBMITTED',
  'CHAIN_PENDING',
  'CHAIN_CONFIRMED',
  'FINALIZING',
  'FAILED_RETRYABLE',
];

const statusLabels = {
  PENDING_APPROVAL: 'Pendiente de confirmación',
  CLAIMED: 'Pendiente de confirmación',
  SIGNING: 'Firmando publicación',
  SUBMITTED: 'Publicación enviada',
  CHAIN_PENDING: 'Publicación enviada',
  CHAIN_CONFIRMED: 'Confirmada en blockchain',
  FINALIZING: 'Finalizando publicación',
  COMPLETED: 'Publicada oficialmente',
  REJECTED: 'Solicitud rechazada',
  EXPIRED: 'Solicitud expirada',
  FAILED_RETRYABLE: 'Sincronización pendiente',
  NEEDS_REVIEW: 'Requiere revisión',
};

export const getOfficialPublicationSummaryStatus = status => {
  switch (String(status || '').trim().toUpperCase()) {
    case 'PENDING_APPROVAL':
    case 'CLAIMED':
      return 'Pendiente de confirmación';
    case 'SIGNING':
      return 'Firmando publicación';
    case 'SUBMITTED':
    case 'CHAIN_PENDING':
      return 'Firmada y enviada';
    case 'CHAIN_CONFIRMED':
    case 'FINALIZING':
      return 'Confirmada en blockchain';
    case 'COMPLETED':
      return 'Publicada oficialmente';
    case 'REJECTED':
      return 'Solicitud rechazada';
    case 'EXPIRED':
      return 'Solicitud expirada';
    case 'FAILED_RETRYABLE':
      return 'No se pudo completar';
    case 'FAILED_FINAL':
    case 'NEEDS_REVIEW':
      return 'Requiere revisión';
    default:
      return 'Solicitud de publicación';
  }
};

const errorMessages = {
  PUBLICATION_WINDOW_CLOSED:
    'El tiempo para confirmar esta publicación terminó.',
  OFFICIAL_PUBLICATION_REQUEST_EXPIRED:
    'El tiempo para confirmar esta publicación terminó.',
  OFFICIAL_PUBLICATION_ALREADY_CLAIMED:
    'Esta solicitud ya está siendo procesada en otro dispositivo.',
  OFFICIAL_PUBLICATION_DEVICE_MISMATCH:
    'Esta solicitud ya está siendo procesada en otro dispositivo.',
  OFFICIAL_PUBLICATION_WALLET_MISMATCH:
    'La wallet de este dispositivo no corresponde al firmante.',
  OFFICIAL_PUBLICATION_CALLDATA_MISMATCH:
    'No se pudo validar el paquete preparado para firma.',
  OFFICIAL_PUBLICATION_SUBMISSION_CONFLICT:
    'La operación ya fue enviada y está siendo verificada.',
  OFFICIAL_PUBLICATION_ALREADY_COMPLETED:
    'La votación fue publicada oficialmente.',
};

const normalizePayload = data => ({
  requestId: data?.requestId,
  eventName: data?.eventName || data?.title,
  institutionName: data?.institutionName,
  status: data?.status || 'PENDING_APPROVAL',
  votingStart: data?.votingStart || data?.votingStartAt || data?.startsAt,
  votingEnd: data?.votingEnd || data?.votingEndAt || data?.endsAt,
  resultsPublishAt: data?.resultsPublishAt,
  publicationDeadline:
    data?.publicationDeadline || data?.expiresAt || data?.deadline,
  expiresAt: data?.expiresAt || data?.publicationDeadline || data?.deadline,
  userOpHash: data?.userOpHash,
  txHash: data?.txHash,
  errorCode: data?.errorCode,
  errorStage: data?.errorStage,
  safeMessage: data?.safeMessage,
  votersCount: data?.votersCount,
  requiredCredits: data?.requiredCredits,
  requiredTvd: data?.requiredTvd,
  smartAccountAddress: data?.smartAccountAddress || data?.signerWallet,
  signerWallet: data?.signerWallet,
  canPublish: data?.canPublish,
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

const formatPlainValue = value => {
  if (value === null || value === undefined || value === '') {
    return 'No disponible';
  }
  return String(value);
};

const parseAtomicTvd = value => {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  try {
    return text.toLowerCase().startsWith('0x') ? BigInt(text) : BigInt(text);
  } catch {
    return null;
  }
};

export const formatTvdAmount = value => {
  const amount = parseAtomicTvd(value);
  if (amount === null) return 'No disponible';
  const base = 10n ** 18n;
  const whole = amount / base;
  const fraction = amount % base;
  if (fraction === 0n) {
    return `${whole.toString()} TVD`;
  }
  const fractionText = fraction.toString().padStart(18, '0').replace(/0+$/, '');
  const trimmedFraction =
    fractionText.length > 6 ? fractionText.slice(0, 6).replace(/0+$/, '') : fractionText;
  return `${whole.toString()},${trimmedFraction || '0'} TVD`;
};

const abbreviate = value => {
  const text = String(value || '').trim();
  if (!text) return 'No disponible';
  if (text.length <= 14) return text;
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
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

const isExpiredRequest = request => {
  if (!request) return false;
  if (request.status === 'EXPIRED') return true;
  const expiresAt = request.expiresAt || request.publicationDeadline;
  const parsed = Date.parse(String(expiresAt || ''));
  return Number.isFinite(parsed) && Date.now() >= parsed;
};

const sanitizeErrorText = value => {
  const text = String(value || '').trim();
  if (
    !text ||
    /backend|axioserror|request failed|internal server error/i.test(text)
  ) {
    return '';
  }
  return text;
};

const resolveErrorMessage = (error, fallback = 'No se pudo cargar la solicitud.') => {
  if (Number(error?.response?.status) === 401) {
    return 'No se pudo validar la identidad del dispositivo.';
  }
  const code = error?.code || extractOfficialPublicationErrorCode(error);
  if (code && errorMessages[code]) {
    return errorMessages[code];
  }
  return sanitizeErrorText(error?.message) || fallback;
};

export default function OfficialPublicationNotificationCard({notification, onStatusChange}) {
  const initialSummary = useMemo(
    () => normalizePayload(notification?.data || {}),
    [notification],
  );
  const requestId = initialSummary.requestId;
  const walletPayload = useSelector(state => state.wallet?.payload);
  const [request, setRequest] = useState(initialSummary);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(Boolean(requestId));
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [preparedClaim, setPreparedClaim] = useState(null);
  const mountedRef = useRef(true);
  const prepareInFlightRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const rejectInFlightRef = useRef(false);

  const privateKey = useMemo(() => getPrivateKey(walletPayload), [walletPayload]);
  const smartAccountAddress = useMemo(
    () => getSmartAccountAddress(walletPayload),
    [walletPayload],
  );
  const currentRequest = request || initialSummary;
  const expired = isExpiredRequest(currentRequest);
  const status = expired ? 'EXPIRED' : currentRequest?.status;
  const isActionable =
    ['PENDING_APPROVAL', 'CLAIMED'].includes(status) &&
    currentRequest?.canPublish !== false &&
    !busy &&
    !loading &&
    !expired;
  const isRejectable =
    ['PENDING_APPROVAL', 'CLAIMED'].includes(status) &&
    !currentRequest?.userOpHash &&
    !busy &&
    !loading &&
    !expired;

  const loadRequest = useCallback(async () => {
    if (!requestId) return null;
    setLoading(true);
    setErrorMessage('');
    try {
      const next = await getOfficialPublicationRequest(requestId);
      if (mountedRef.current) {
        const normalized = normalizePayload({...initialSummary, ...next});
        setRequest(normalized);
        onStatusChange?.(normalized.status);
      }
      return next;
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(resolveErrorMessage(error));
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [initialSummary, requestId]);

  useEffect(() => {
    mountedRef.current = true;
    getOfficialPublicationDeviceId()
      .then(id => mountedRef.current && setDeviceId(id))
      .catch(() => {});
    syncOfficialPublicationOutbox(submitOfficialPublication).catch(() => {});
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

  const handlePrepareConfirmation = async () => {
    if (!isActionable || !requestId || prepareInFlightRef.current) return;
    prepareInFlightRef.current = true;
    setBusy(true);
    setErrorMessage('');
    try {
      const fresh = await getOfficialPublicationRequest(requestId);
      const normalizedFresh = normalizePayload({...initialSummary, ...fresh});
      if (isExpiredRequest(normalizedFresh)) {
        setRequest({...normalizedFresh, status: 'EXPIRED'});
        onStatusChange?.('EXPIRED');
        setErrorMessage('El tiempo para confirmar esta publicación terminó.');
        return;
      }
      let claim;
      try {
        claim = await claimOfficialPublication(requestId, deviceId);
      } catch (error) {
        throw new Error(resolveErrorMessage(error, 'No se pudo reclamar la solicitud.'));
      }
      try {
        await startOfficialPublicationSigning(requestId, deviceId);
      } catch (error) {
        throw new Error(resolveErrorMessage(error, 'No se pudo preparar la firma.'));
      }
      setRequest({...normalizedFresh, status: 'SIGNING'});
      onStatusChange?.('SIGNING');
      setPreparedClaim({request: fresh, claim});
      setConfirmVisible(true);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      prepareInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleSubmitConfirmation = async () => {
    if (!preparedClaim || busy || submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    setConfirmVisible(false);
    setBusy(true);
    setErrorMessage('');
    let userOpHash = null;
    try {
      if (!privateKey || !smartAccountAddress) {
        throw new Error('Esta solicitud debe confirmarse con la cuenta institucional asignada.');
      }
      const {submitted, userOpHash: submittedUserOpHash} =
        await sendOfficialPublicationSubmission({
          requestId,
          deviceId,
          request: preparedClaim.request,
          claim: preparedClaim.claim,
          privateKey,
          smartAccountAddress,
        });
      userOpHash = submittedUserOpHash;
      setRequest(prev => {
        const normalized = normalizePayload({...prev, ...submitted});
        onStatusChange?.(normalized.status);
        return normalized;
      });
    } catch (error) {
      if (userOpHash) {
        setErrorMessage(resolveErrorMessage(error, 'No se pudo enviar la publicación.'));
      } else {
        setErrorMessage(resolveErrorMessage(error, 'No se pudo enviar la publicación.'));
      }
    } finally {
      submitInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!isRejectable || !requestId || rejectInFlightRef.current) return;
    rejectInFlightRef.current = true;
    setBusy(true);
    setErrorMessage('');
    try {
      const rejected = await rejectOfficialPublication(requestId, deviceId);
      const normalized = normalizePayload({...initialSummary, ...rejected, status: 'REJECTED'});
      setRequest(normalized);
      onStatusChange?.(normalized.status);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'No se pudo rechazar la solicitud.'));
    } finally {
      rejectInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  const stateMessage = (() => {
    if (errorMessage) return errorMessage;
    if (expired) return 'El tiempo para confirmar esta publicación terminó.';
    if (busy || status === 'CLAIMED' || status === 'SIGNING') {
      return 'Firmando publicación...';
    }
    if (status === 'SUBMITTED' || status === 'CHAIN_PENDING') {
      return 'Firmado correctamente. Esperando confirmación en blockchain.';
    }
    if (status === 'CHAIN_CONFIRMED' || status === 'FINALIZING') {
      return 'Operación confirmada. Finalizando la publicación oficial.';
    }
    if (status === 'COMPLETED') {
      return 'La votación fue publicada oficialmente.';
    }
    if (status === 'REJECTED') {
      return 'La solicitud de publicación fue rechazada.';
    }
    if (status === 'FAILED_RETRYABLE') {
      return 'No se pudo completar la publicación.';
    }
    if (status === 'FAILED_FINAL' || status === 'NEEDS_REVIEW') {
      return 'La publicación requiere revisión.';
    }
    return '';
  })();

  return (
    <View testID="officialPublicationNotificationCard" style={styles.card}>
      <Text testID="officialPublicationNotificationTitle" style={styles.title}>
        {formatPlainValue(currentRequest?.eventName)}
      </Text>
      <Text testID="officialPublicationNotificationInstitution" style={styles.subtitle}>
        {formatPlainValue(currentRequest?.institutionName)}
      </Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator testID="officialPublicationNotificationLoading" />
          <Text style={styles.loadingText}>Validando la solicitud...</Text>
        </View>
      ) : null}

      <View style={styles.rows}>
        <InfoRow label="Estado" value={statusLabels[status] || formatPlainValue(status)} />
        <InfoRow label="Fecha de inicio" value={formatDateTime(currentRequest?.votingStart)} />
        <InfoRow label="Fecha de finalización" value={formatDateTime(currentRequest?.votingEnd)} />
        <InfoRow
          label="Publicación de resultados"
          value={formatDateTime(currentRequest?.resultsPublishAt)}
        />
        <InfoRow
          label="Empadronados"
          value={formatPlainValue(currentRequest?.votersCount)}
        />
        <InfoRow
          label="Créditos requeridos"
          value={formatPlainValue(currentRequest?.requiredCredits)}
        />
        <InfoRow
          label="TVD requerido"
          value={formatTvdAmount(currentRequest?.requiredTvd)}
          testID="officialPublicationNotificationTvd"
        />
        <InfoRow
          label="Tiempo límite para confirmar"
          value={formatDateTime(currentRequest?.publicationDeadline || currentRequest?.expiresAt)}
        />
        <InfoRow
          label="Smart account"
          value={abbreviate(currentRequest?.smartAccountAddress || currentRequest?.signerWallet)}
        />
      </View>

      {stateMessage ? (
        <Text testID="officialPublicationNotificationMessage" style={styles.message}>
          {stateMessage}
        </Text>
      ) : null}

      {errorMessage && !expired ? (
        <TouchableOpacity
          testID="officialPublicationNotificationRetryButton"
          style={styles.secondaryButton}
          onPress={loadRequest}
          disabled={loading || busy}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      ) : null}

      {isActionable || isRejectable ? (
        <View style={styles.actions}>
          {isRejectable ? (
            <TouchableOpacity
              testID="officialPublicationNotificationRejectButton"
              style={styles.secondaryButton}
              onPress={handleReject}
              disabled={busy || loading}>
              <Text style={styles.secondaryButtonText}>Rechazar</Text>
            </TouchableOpacity>
          ) : null}
          {isActionable ? (
            <TouchableOpacity
              testID="officialPublicationNotificationConfirmButton"
              style={styles.primaryButton}
              onPress={handlePrepareConfirmation}
              disabled={busy || loading}>
              <Text style={styles.primaryButtonText}>Confirmar publicación</Text>
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
              <Text style={styles.modalTitle}>¿Confirmar publicación oficial?</Text>
              <Text style={styles.modalText}>
                La solicitud ya fue preparada para firma. Confirma para enviarla a
                blockchain.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  testID="officialPublicationNotificationModalCancel"
                  style={styles.secondaryButton}
                  onPress={() => setConfirmVisible(false)}
                  disabled={busy}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="officialPublicationNotificationModalConfirm"
                  style={styles.primaryButton}
                  onPress={handleSubmitConfirmation}
                  disabled={busy}>
                  <Text style={styles.primaryButtonText}>Confirmar publicación</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const InfoRow = ({label, value, testID}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text testID={testID} style={styles.rowValue}>
      {formatPlainValue(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '700',
  },
  rows: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 6,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  rowLabel: {
    color: '#64748B',
    flex: 1,
    fontSize: 13,
    marginRight: 10,
  },
  rowValue: {
    color: '#0F172A',
    flex: 1.1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  message: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderRadius: 8,
    borderWidth: 1,
    color: '#9A3412',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    padding: 10,
  },
  actions: {
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#166534',
    borderRadius: 8,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    width: '100%',
  },
  modalTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  modalText: {
    color: '#475569',
    fontSize: 14,
    marginTop: 10,
  },
  modalActions: {
    gap: 10,
    marginTop: 18,
  },
});
