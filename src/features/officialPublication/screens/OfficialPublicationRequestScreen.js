import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
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
const PROCESSING_STATUSES = [
  'SUBMITTED',
  'CHAIN_PENDING',
  'CHAIN_CONFIRMED',
  'FINALIZING',
];
const TERMINAL_STATUSES = ['COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED'];

const statusLabels = {
  PENDING_APPROVAL: 'Pendiente de confirmación',
  CLAIMED: 'En preparación de firma',
  SIGNING: 'Esperando firma',
  SUBMITTED: 'Firmado correctamente',
  CHAIN_PENDING: 'Confirmación en blockchain',
  CHAIN_CONFIRMED: 'Confirmada en blockchain',
  FINALIZING: 'Finalizando publicación',
  COMPLETED: 'Publicada oficialmente',
  REJECTED: 'Solicitud rechazada',
  EXPIRED: 'Solicitud expirada',
  FAILED_RETRYABLE: 'Sincronización pendiente',
  NEEDS_REVIEW: 'Requiere revisión',
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
    'Esta solicitud debe confirmarse con la cuenta institucional asignada.',
  OFFICIAL_PUBLICATION_CALLDATA_MISMATCH:
    'No se pudo validar el paquete preparado para firma.',
  OFFICIAL_PUBLICATION_SUBMISSION_CONFLICT:
    'La operación ya fue enviada y está siendo verificada.',
  OFFICIAL_PUBLICATION_ALREADY_COMPLETED:
    'La votación fue publicada oficialmente.',
  OFFICIAL_PUBLICATION_NOT_READY:
    'Esta solicitud ya no está lista para firmarse. Solicita una nueva preparación.',
};

const formatDate = value => {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleString();
};

const parseAtomicTvd = value => {
  if (value === null || value === undefined || value === '') return null;
  try {
    const text = String(value).trim();
    return text.toLowerCase().startsWith('0x') ? BigInt(text) : BigInt(text);
  } catch {
    return null;
  }
};

const formatTvdAmount = value => {
  const amount = parseAtomicTvd(value);
  if (amount === null) return 'No disponible';
  const base = 10n ** 18n;
  const whole = amount / base;
  const fraction = amount % base;
  if (fraction === 0n) return `${whole.toString()} TVD`;
  const fractionText = fraction.toString().padStart(18, '0').replace(/0+$/, '');
  const trimmedFraction =
    fractionText.length > 6 ? fractionText.slice(0, 6).replace(/0+$/, '') : fractionText;
  return `${whole.toString()},${trimmedFraction || '0'} TVD`;
};

const abbreviate = value => {
  const text = String(value || '');
  if (text.length <= 14) return text || 'No disponible';
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

const getBlockingCopy = request => {
  if (!request) return null;
  if (
    request.publicationReadiness &&
    request.publicationReadiness !== 'PUBLICATION_READY'
  ) {
    if (request.publicationReadiness === 'PUBLICATION_CONTRACT_ROLE_MISSING') {
      return 'Configuración contractual pendiente. Solicita una nueva preparación cuando infraestructura quede lista.';
    }
    if (request.publicationReadiness === 'PUBLICATION_BALANCE_INSUFFICIENT') {
      return 'La wallet institucional no tiene TVD suficientes para esta publicación.';
    }
    return 'Esta solicitud ya no está lista para firmarse. Solicita una nueva preparación.';
  }
  if (request.blockingReason === 'PUBLICATION_WINDOW_CLOSED') {
    return 'El tiempo para confirmar esta publicación terminó.';
  }
  if (request.status === 'SUBMITTED' || request.status === 'CHAIN_PENDING') {
    return 'Firmado correctamente. Esperando confirmación en blockchain.';
  }
  if (request.status === 'CHAIN_CONFIRMED' || request.status === 'FINALIZING') {
    return 'Operación confirmada. Finalizando la publicación oficial.';
  }
  if (request.status === 'COMPLETED') {
    return 'La votación fue publicada oficialmente.';
  }
  if (request.status === 'REJECTED') {
    return 'La solicitud fue rechazada.';
  }
  if (request.status === 'FAILED_RETRYABLE') {
    return 'La operación fue enviada. Reintentaremos sincronizarla automáticamente.';
  }
  if (request.status === 'NEEDS_REVIEW') {
    return 'La publicación requiere revisión. No vuelvas a enviarla.';
  }
  return null;
};

const isPublicationReadyForSignature = request =>
  !request?.publicationReadiness ||
  request.publicationReadiness === 'PUBLICATION_READY';

const OfficialPublicationRequestScreen = ({route}) => {
  const requestId = route?.params?.requestId;
  const walletPayload = useSelector(state => state.wallet?.payload);
  const [request, setRequest] = useState(null);
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const mountedRef = useRef(true);

  const smartAccountAddress = useMemo(
    () => getSmartAccountAddress(walletPayload),
    [walletPayload],
  );
  const privateKey = useMemo(() => getPrivateKey(walletPayload), [walletPayload]);

  const loadRequest = useCallback(async () => {
    if (!requestId) return null;
    const next = await getOfficialPublicationRequest(requestId);
    if (mountedRef.current) {
      setRequest(next);
      setErrorMessage('');
    }
    return next;
  }, [requestId]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const id = await getOfficialPublicationDeviceId();
      if (mountedRef.current) setDeviceId(id);
      await syncOfficialPublicationOutbox(submitOfficialPublication);
      await loadRequest();
    } catch (error) {
      if (mountedRef.current) {
        setErrorMessage(resolveErrorMessage(error));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loadRequest]);

  useEffect(() => {
    mountedRef.current = true;
    loadInitial();
    return () => {
      mountedRef.current = false;
    };
  }, [loadInitial]);

  useEffect(() => {
    if (!request || !PROCESSING_STATUSES.includes(request.status)) return undefined;
    const timer = setInterval(() => {
      loadRequest().catch(() => {});
    }, POLLING_MS);
    return () => clearInterval(timer);
  }, [loadRequest, request]);

  const canConfirm =
    request?.status === 'PENDING_APPROVAL' &&
    request?.canPublish !== false &&
    isPublicationReadyForSignature(request) &&
    !busy &&
    !TERMINAL_STATUSES.includes(request?.status);
  const canReject =
    ['PENDING_APPROVAL', 'CLAIMED', 'SIGNING'].includes(request?.status) &&
    !request?.userOpHash &&
    !busy;

  const handleConfirmPublication = async () => {
    if (busy) return;
    setConfirmVisible(false);
    setBusy(true);
    setErrorMessage('');
    let userOpHash = null;

    try {
      if (!privateKey || !smartAccountAddress) {
        throw new Error(
          'Esta solicitud debe confirmarse con la cuenta institucional asignada.',
        );
      }

      const freshRequest = await loadRequest();
      if (freshRequest?.canPublish === false) {
        const error = new Error('Ventana cerrada');
        error.code = 'PUBLICATION_WINDOW_CLOSED';
        throw error;
      }
      if (!isPublicationReadyForSignature(freshRequest)) {
        const error = new Error('Solicitud no lista para firma');
        error.code = 'OFFICIAL_PUBLICATION_NOT_READY';
        throw error;
      }

      const claim = await claimOfficialPublication(requestId, deviceId);
      await startOfficialPublicationSigning(requestId, deviceId);
      const {userOpHash: submittedUserOpHash} =
        await sendOfficialPublicationSubmission({
          requestId,
          deviceId,
          request: freshRequest,
          claim,
          privateKey,
          smartAccountAddress,
        });
      userOpHash = submittedUserOpHash;
      await loadRequest();
    } catch (error) {
      if (userOpHash) {
        setErrorMessage(
          'La operación fue enviada. Reintentaremos sincronizarla automáticamente.',
        );
      } else {
        setErrorMessage(resolveErrorMessage(error));
      }
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!canReject) return;
    setBusy(true);
    setErrorMessage('');
    try {
      const rejected = await rejectOfficialPublication(requestId, deviceId);
      setRequest(rejected);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const visibleMessage = errorMessage || getBlockingCopy(request);

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title="Publicación oficial" testID="officialPublicationHeader" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator testID="officialPublicationLoading" />
          <Text style={styles.loadingText}>Validando identidad del dispositivo...</Text>
        </View>
      ) : !request && errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.message} testID="officialPublicationMessage">
            {errorMessage}
          </Text>
          <TouchableOpacity
            testID="officialPublicationRetryValidationButton"
            style={styles.button}
            onPress={loadInitial}>
            <Text style={styles.buttonText}>Reintentar validación</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title} testID="officialPublicationTitle">
            {request?.eventName || 'Votación institucional'}
          </Text>
          <Text style={styles.subtitle} testID="officialPublicationInstitution">
            {request?.institutionName || 'Institución'}
          </Text>

          <View style={styles.section}>
            <InfoRow label="Estado" value={statusLabels[request?.status] || request?.status} />
            <InfoRow label="Fecha de inicio" value={formatDate(request?.votingStart)} />
            <InfoRow label="Fecha de finalización" value={formatDate(request?.votingEnd)} />
            <InfoRow
              label="Publicación de resultados"
              value={formatDate(request?.resultsPublishAt)}
            />
            <InfoRow
              label="Tiempo límite para confirmar"
              value={formatDate(request?.publicationDeadline)}
              testID="officialPublicationDeadline"
            />
          </View>

          <View style={styles.section}>
            <InfoRow label="Empadronados" value={request?.votersCount} />
            <InfoRow label="Créditos requeridos" value={request?.requiredCredits} />
            <InfoRow label="TVD requerido" value={formatTvdAmount(request?.requiredTvd)} />
            <InfoRow
              label="Cuenta"
              value={abbreviate(request?.smartAccountAddress || request?.signerWallet)}
              testID="officialPublicationWallet"
            />
          </View>

          {visibleMessage ? (
            <Text style={styles.message} testID="officialPublicationMessage">
              {visibleMessage}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {canReject ? (
              <TouchableOpacity
                testID="officialPublicationRejectButton"
                style={[styles.button, styles.secondaryButton]}
                onPress={handleReject}
                disabled={busy}>
                <Text style={styles.secondaryButtonText}>Rechazar</Text>
              </TouchableOpacity>
            ) : null}
            {request?.status === 'PENDING_APPROVAL' ? (
              <TouchableOpacity
                testID="officialPublicationConfirmButton"
                style={[styles.button, !canConfirm && styles.disabledButton]}
                onPress={() => canConfirm && setConfirmVisible(true)}
                disabled={!canConfirm}>
                <Text style={styles.buttonText}>
                  {busy ? 'Procesando...' : 'Confirmar publicación'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Confirmar publicación oficial?</Text>
            <Text style={styles.modalText}>
              Esta acción publicará la votación en blockchain y reservará los TVD
              necesarios para habilitarla.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                testID="officialPublicationModalCancel"
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setConfirmVisible(false)}
                disabled={busy}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="officialPublicationModalConfirm"
                style={styles.button}
                onPress={handleConfirmPublication}
                disabled={busy}>
                <Text style={styles.buttonText}>Confirmar publicación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CSafeAreaView>
  );
};

const resolveErrorMessage = error => {
  if (Number(error?.response?.status) === 401) {
    return 'No se pudo validar la identidad de este dispositivo.';
  }
  if (
    String(error?.message || '').includes('validar tu acceso institucional') ||
    String(error?.message || '').includes('validar la identidad de este dispositivo')
  ) {
    return 'No se pudo validar la identidad de este dispositivo.';
  }
  const code = error?.code || extractOfficialPublicationErrorCode(error);
  if (code && errorMessages[code]) {
    return errorMessages[code];
  }
  if (error?.message && !String(error.message).includes('0x')) {
    const message = String(error.message);
    if (message.includes('status code 401')) {
      return 'No se pudo validar la identidad de este dispositivo.';
    }
    if (!/backend|axioserror|request failed|internal server error/i.test(message)) {
      return message;
    }
  }
  return 'No se pudo procesar la publicación oficial.';
};

const InfoRow = ({label, value, testID}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} testID={testID}>
      {value || 'No disponible'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    color: '#152238',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#546179',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    marginBottom: 14,
    paddingHorizontal: 14,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 10,
  },
  rowLabel: {
    color: '#6B7280',
    flex: 1,
    fontSize: 14,
  },
  rowValue: {
    color: '#111827',
    flex: 1.25,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  message: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderRadius: 8,
    borderWidth: 1,
    color: '#9A3412',
    fontSize: 14,
    marginBottom: 16,
    padding: 12,
  },
  loadingText: {
    color: '#546179',
    fontSize: 14,
    marginTop: 12,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#166534',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
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

export default OfficialPublicationRequestScreen;
