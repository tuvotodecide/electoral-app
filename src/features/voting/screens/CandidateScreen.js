/**
 * Candidate Screen
 *
 * Pantalla para seleccionar candidato y votar.
 * Usa los componentes existentes del repo.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Components
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import CustomModal from '../../../components/common/CustomModal';
import CameraScannerModal from '../components/CameraScannerModal';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Feature components
import CandidateCard from '../components/CandidateCard';
import ConfirmVoteModal from '../components/ConfirmVoteModal';
import OfflineQueuedModal from '../components/OfflineQueuedModal';

// Feature logic
import { useVotingState } from '../state/useVotingState';
import { useElectionRepository } from '../data/useElectionRepository';
import {
  enqueueBackendParticipationSync,
  enqueueVote,
} from '../offline/queueAdapter';
import { clearVoteJournal, startVoteJournal } from '../offline/voteJournal';
import { UI_STRINGS } from '../data/mockData';
import { DEV_FLAGS } from '../../../config/featureFlags';

// Utils
import { backendProbe, checkInternetConnection } from '../../../utils/networkUtils';
import { moderateScale, getHeight } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKey';
import { captureError } from '../../../config/sentry';
import { useSelector } from 'react-redux';
import { blankVote } from '../data/params';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helpers
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const getPrimaryCandidateName = candidate => {
  if (!candidate) return UI_STRINGS.confirmVoteBlank;

  const primaryTicketEntry = Array.isArray(candidate?.ticketEntries)
    ? candidate.ticketEntries.find(entry => String(entry?.name || '').trim())
    : null;

  return String(
    primaryTicketEntry?.name ||
      candidate?.presidentName ||
      candidate?.partyName ||
      '',
  ).trim();
};

const isLikelyNetworkVoteError = error => {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('network') ||
    message.includes('internet') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('request failed')
  );
};

const buildVoteErrorMessage = error => {
  const raw = String(error?.message || error || '').trim();
  const message = raw.toLowerCase();

  if (!raw) {
    return 'Ocurrió un error al registrar el voto. Puedes reintentar.';
  }
  if (
    message.includes('already voted') ||
    message.includes('ya participaste') ||
    message.includes('already_voted')
  ) {
    return 'Esta votación ya figura como registrada para tu usuario.';
  }
  if (
    message.includes('outside_voting_window') ||
    message.includes('fuera del horario')
  ) {
    return 'La votación ya no se encuentra disponible en este horario.';
  }
  if (
    message.includes('vote does not exist') ||
    message.includes('execution reverted')
  ) {
    return 'No se pudo registrar el voto en blockchain. Puedes reintentar o volver a votar más tarde.';
  }
  if (isLikelyNetworkVoteError(raw)) {
    return 'Hubo un problema de conexión al registrar el voto. Puedes reintentar.';
  }

  return raw;
};

const buildPendingSyncCopy = ({
  serverUnavailable = false,
} = {}) => {
  if (serverUnavailable) {
    return {
      title: 'Conexion con servidor pendiente',
      message:
        'Detectamos red disponible, pero el servidor no respondio. Tu voto quedo guardado y la app lo sincronizara automaticamente.',
    };
  }

  return {
    title: UI_STRINGS.offlineTitle,
    message: UI_STRINGS.offlineMessage,
  };
};

const resolveElectionTitle = election =>
  String(
    election?.title ||
      election?.name ||
      election?.eventName ||
      election?.electionTitle ||
      '',
  ).trim() || 'Votación institucional';

const resolveElectionOrganization = election =>
  String(
    election?.organization ||
      election?.organizationName ||
      election?.institutionName ||
      election?.instituteName ||
      election?.tenantName ||
      '',
  ).trim();

const CandidateScreen = ({ route }) => {
  const navigation = useNavigation();
  const repository = useElectionRepository();

  const [electionInfo, setElectionInfo] = useState(route?.params?.election || null);
  const electionId = route?.params?.electionId || electionInfo?.id || '';
  
  // State
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(blankVote);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [queuedParticipationId, setQueuedParticipationId] = useState(null);
  const [offlineModalCopy, setOfflineModalCopy] = useState({
    title: UI_STRINGS.offlineTitle,
    message: UI_STRINGS.offlineMessage,
  });
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: 'No se pudo registrar el voto',
    message: '',
  });
  const isSubmittingVoteRef = useRef(false);
  const isInPlaceVote = route?.params?.isInPlaceVote === true;
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraMounted, setIsCameraMounted] = useState(false);

  // Election state hook
  const {
    recordVote,
    hasVoted,
    participationId,
    lastReceipt,
    isLoading: isVotingStateLoading,
  } = useVotingState(electionId);

  // Load candidates
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        let resolvedElection = electionInfo;
        if (!electionInfo?.id) {
          const currentElection = await repository.getElection();
          if (currentElection?.id) {
            resolvedElection = currentElection;
            setElectionInfo(currentElection);
          }
        }

        const resolvedElectionId = route?.params?.electionId || resolvedElection?.id || '';
        if (!resolvedElectionId) {
          setCandidates([]);
          return;
        }

        const data = await repository.getCandidates(resolvedElectionId);
        setCandidates(data);
      } catch (error) {
        console.error('[CandidateScreen] Error loading candidates:', error);
        setCandidates([]);
      }
    };
    loadCandidates();
  }, [electionId, repository, electionInfo, route?.params?.electionId]);

  useEffect(() => {
    if (isVotingStateLoading || !hasVoted || !electionId) {
      return;
    }

    const resolvedParticipationId =
      lastReceipt?.electionId === electionId ? lastReceipt?.id : participationId;

    if (resolvedParticipationId) {
      navigation.replace(StackNav.VotingReceiptScreen, {
        participationId: resolvedParticipationId,
        electionId,
      });
    }
  }, [
    electionId,
    hasVoted,
    isVotingStateLoading,
    lastReceipt,
    navigation,
    participationId,
  ]);

  // Handle candidate selection
  const handleSelectCandidate = useCallback((candidate) => {
    if (selectedCandidate?.id === candidate.id) {
      setSelectedCandidate(blankVote);
    } else {
      setSelectedCandidate(candidate);
    }
  }, [selectedCandidate]);

  // Handle vote button press
  const handleVotePress = useCallback(() => {
    setShowConfirmModal(true);
  }, [selectedCandidate]);

  const submitInPlaceVote = async () => {
    setIsCameraMounted(true);
  };

  const handleBarcodeScanned = async (result) => {
    isSubmittingVoteRef.current = true;
    setIsLoading(true);
    setIsCameraMounted(false);

    try {
      if (!result?.data) {
        setErrorModal({
          visible: true,
          title: UI_STRINGS.badQrTitle,
          message: UI_STRINGS.badQrDesc,
        });
        throw new Error('QR code data is empty');
      }

      let presentialSessionId;
      try {
        presentialSessionId = await repository.verifyVoteQrCode(result.data);
        if (!presentialSessionId) {
          throw new Error('Invalid QR code: No session ID returned');
        }
      } catch (error) {
        setErrorModal({
          visible: true,
          title: UI_STRINGS.badQrTitle,
          message: UI_STRINGS.badQrDesc,
        });
        throw error;
      }

      const voteResult = await submitVote(presentialSessionId);
      if (!voteResult.success) {
        setErrorModal({
          visible: true,
          title: UI_STRINGS.qrVoteErrorTitle,
          message: UI_STRINGS.qrVoteErrorDesc,
        });
        throw new Error(voteResult.error || 'Vote submission failed');
      }
    } catch (error) {
      console.error('[CandidateScreen] Error in QR vote flow:', error);
      captureError(voteResult.error, {
        flow: 'qr_voting_flow',
        step: 'submit_vote',
        critical: false,
        allowPii: false,
        extra: {
          electionId,
        },
      });
    } finally {
      setShowConfirmModal(false);
      isSubmittingVoteRef.current = false;
      setIsLoading(false);
    }
  };

  // Handle confirm vote
  const handleConfirmVote = useCallback(async () => {
    if (!selectedCandidate || isSubmittingVoteRef.current) return;

    isSubmittingVoteRef.current = true;
    setIsLoading(true);

    try {
      const queueVoteAndShowReceipt = async () => {
        await enqueueVote({
          electionId,
          candidateId: selectedCandidate.id,
          candidateName: selectedCandidate.partyName,
          presidentName: selectedCandidate.presidentName,
          electionTitle: resolveElectionTitle(electionInfo),
        });

        const receipt = await recordVote(selectedCandidate.id, false, {
          electionId,
          electionTitle: resolveElectionTitle(electionInfo),
          organization: resolveElectionOrganization(electionInfo),
          candidateSelected: {
            partyName: selectedCandidate.partyName,
            presidentName: selectedCandidate.presidentName,
            viceName: selectedCandidate.viceName,
            ticketEntries: selectedCandidate.ticketEntries || [],
          },
        });

        setOfflineModalCopy(buildPendingSyncCopy());
        setQueuedParticipationId(receipt?.id || null);
        setShowConfirmModal(false);
        setShowOfflineModal(true);
      };

      // Check connectivity (allow DEV_FLAGS override for testing)
      const isOnline = DEV_FLAGS.FORCE_OFFLINE_VOTING
        ? false
        : await checkInternetConnection();

      if (isInPlaceVote) {
        if (!isOnline) {
          setErrorModal({
            visible: true,
            title: UI_STRINGS.cantVoteOfflineTitle,
            message: UI_STRINGS.cantVoteOfflineDesc,
          });
          return;
        } else {
          await submitInPlaceVote();
          return;
        }
      }

      if (isOnline) {
        const probe = await backendProbe({ timeoutMs: 2000 });
        if (!probe?.ok) {
          await enqueueVote({
            electionId,
            candidateId: selectedCandidate.id,
            candidateName: selectedCandidate.partyName,
            presidentName: selectedCandidate.presidentName,
            electionTitle: resolveElectionTitle(electionInfo),
          });

          const receipt = await recordVote(selectedCandidate.id, false, {
            electionId,
            electionTitle: resolveElectionTitle(electionInfo),
            organization: resolveElectionOrganization(electionInfo),
            candidateSelected: {
              partyName: selectedCandidate.partyName,
              presidentName: selectedCandidate.presidentName,
              viceName: selectedCandidate.viceName,
              ticketEntries: selectedCandidate.ticketEntries || [],
            },
          });

          setOfflineModalCopy(buildPendingSyncCopy({ serverUnavailable: true }));
          setQueuedParticipationId(receipt?.id || null);
          setShowConfirmModal(false);
          setShowOfflineModal(true);
          return;
        }

        const result = await submitVote();

        if (result?.shouldQueueBackendSync && result?.blockchainCommitted) {
          await enqueueBackendParticipationSync({
            electionId,
            candidateId: selectedCandidate.id,
            candidateName: selectedCandidate.partyName,
            presidentName: selectedCandidate.presidentName,
            electionTitle: resolveElectionTitle(electionInfo),
          });

          const receipt = await recordVote(selectedCandidate.id, false, {
            electionId,
            electionTitle: resolveElectionTitle(electionInfo),
            organization: resolveElectionOrganization(electionInfo),
            candidateSelected: {
              partyName: selectedCandidate.partyName,
              presidentName: selectedCandidate.presidentName,
              viceName: selectedCandidate.viceName,
              ticketEntries: selectedCandidate.ticketEntries || [],
            },
            errorMessage: null,
          });

          setOfflineModalCopy({
            title: 'Voto emitido, sincronización pendiente',
            message:
              'Tu voto ya fue emitido, pero falta registrar la participación en el backend. La app lo reintentará automáticamente.',
          });
          setQueuedParticipationId(receipt?.id || null);
          setShowConfirmModal(false);
          setShowOfflineModal(true);
        } else {
          const stillOnline = await checkInternetConnection();
          if (!stillOnline && isLikelyNetworkVoteError(result.error)) {
            await queueVoteAndShowReceipt();
            return;
          }
          throw new Error(result.error || 'Vote failed');
        }
      } else {
        await queueVoteAndShowReceipt();
      }
    } catch (error) {
      if (!String(error?.message || '').toLowerCase().includes('blockchain')) {
        await clearVoteJournal(electionId);
      }
      captureError(error, {
        flow: 'voting_flow',
        step: 'submit_vote',
        critical: false,
        allowPii: false,
        extra: {
          electionId,
          candidateId: selectedCandidate?.id || null,
        },
      });
      console.error('[CandidateScreen] Vote error:', error);
      setShowConfirmModal(false);
      setErrorModal({
        visible: true,
        title: 'No se pudo registrar el voto',
        message: buildVoteErrorMessage(error),
      });
    } finally {
      isSubmittingVoteRef.current = false;
      setIsLoading(false);
    }
  }, [selectedCandidate, electionId, repository, recordVote, navigation, electionInfo]);

  const submitVote = useCallback(async (presentialSessionId) => {
    await startVoteJournal({
      electionId,
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.partyName,
      presidentName: selectedCandidate.presidentName,
      electionTitle: resolveElectionTitle(electionInfo),
      organization: resolveElectionOrganization(electionInfo),
      candidateSelected: {
        partyName: selectedCandidate.partyName,
        presidentName: selectedCandidate.presidentName,
        viceName: selectedCandidate.viceName,
        ticketEntries: selectedCandidate.ticketEntries || [],
      },
    });


    // Online: Submit vote directly
    const result = await repository.submitVote(electionId, selectedCandidate.partyName, presentialSessionId);

    if (result.success) {
      const receipt = await recordVote(selectedCandidate.id, true, {
        participationId: result.participationId,
        participatedAt: result.participatedAt,
        transactionId: result.transactionId || null,
        electionId,
        electionTitle: resolveElectionTitle(electionInfo),
        organization: resolveElectionOrganization(electionInfo),
        candidateSelected: {
          partyName: selectedCandidate.partyName,
          presidentName: selectedCandidate.presidentName,
          viceName: selectedCandidate.viceName,
          ticketEntries: selectedCandidate.ticketEntries || [],
        },
      });

      setShowConfirmModal(false);

      // Navigate to receipt/comprobante screen
      navigation.replace(StackNav.VotingReceiptScreen, {
        participationId: receipt?.id || result.participationId,
        electionId,
      });
    } else {
      await clearVoteJournal(electionId);
    }

    return result;
  }, [selectedCandidate, electionId, repository, recordVote, navigation, electionInfo]);

  // Handle cancel confirm
  const handleCancelConfirm = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  // Handle offline modal dismiss
  const handleOfflineDismiss = useCallback(() => {
    setShowOfflineModal(false);
    navigation.replace(StackNav.VotingReceiptScreen, {
      participationId: queuedParticipationId || participationId || lastReceipt?.id,
      electionId,
    });
  }, [electionId, lastReceipt?.id, navigation, participationId, queuedParticipationId]);

  const handleRetryVote = useCallback(() => {
    setErrorModal(modal => ({...modal, visible: false}));
    handleConfirmVote();
  }, [handleConfirmVote]);

  // Get button text
  const getButtonText = () => {
    if (!selectedCandidate || selectedCandidate.id === blankVote.id) {
      return UI_STRINGS.voteBlank;
    }
    const primaryName = getPrimaryCandidateName(selectedCandidate);
    const [firstName = '', secondName = ''] = primaryName.split(' ');
    return `${UI_STRINGS.voteFor} ${firstName.toUpperCase()} ${secondName.toUpperCase()}`.trim();
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.candidateHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <CText type="B22" style={styles.title}>
          {UI_STRINGS.chooseCandidate}
        </CText>

        {/* Candidate cards */}
        <View style={styles.candidatesList}>
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={selectedCandidate?.id === candidate.id}
              onSelect={() => handleSelectCandidate(candidate)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottomContainer}>
        <CButton
          title={getButtonText()}
          type="B16"
          onPress={handleVotePress}
          containerStyle={styles.voteButton}
          style={styles.voteButtonText}
          textProps={{
            numberOfLines: 2,
            adjustsFontSizeToFit: true,
            minimumFontScale: 0.72,
          }}
          sinMargen
          testID="voteButton"
          icon={<Ionicons
            name={isInPlaceVote ? 'qr-code' : 'checkmark-circle'}
            style={{marginLeft: moderateScale(8)}}
            size={moderateScale(24)} color="white"
          />}
        />

        <CText type="R12" style={styles.securityNote}>
          {UI_STRINGS.voteSecureNote}
        </CText>
      </View>

      <CameraScannerModal
        visible={isCameraMounted}
        onClose={() => setIsCameraMounted(false)}
        onBarcodeScanned={handleBarcodeScanned}
        hasPermission={cameraPermission?.granted}
        onRequestPermission={requestCameraPermission}
      />

      {/* Confirm Modal */}
      <ConfirmVoteModal
        visible={showConfirmModal}
        isBlankVote={!selectedCandidate || selectedCandidate.id === blankVote.id}
        presidentName={getPrimaryCandidateName(selectedCandidate)}
        partyName={selectedCandidate?.partyName || ''}
        partyColor={selectedCandidate?.partyColor}
        onConfirm={handleConfirmVote}
        onCancel={handleCancelConfirm}
        isLoading={isLoading}
      />

      {/* Offline Queued Modal */}
      <OfflineQueuedModal
        visible={showOfflineModal}
        onDismiss={handleOfflineDismiss}
        title={offlineModalCopy.title}
        message={offlineModalCopy.message}
      />

      <CustomModal
        visible={errorModal.visible}
        onClose={() => setErrorModal(modal => ({...modal, visible: false}))}
        type="error"
        title={errorModal.title}
        message={errorModal.message}
        buttonText="Reintentar"
        onButtonPress={handleRetryVote}
        secondaryButtonText="Cerrar"
        onSecondaryPress={() => setErrorModal(modal => ({...modal, visible: false}))}
      />
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(16, 20, 24),
    paddingBottom: getResponsiveSize(20, 24, 28),
  },
  title: {
    color: '#1F2937',
    fontSize: getResponsiveSize(20, 24, 28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  candidatesList: {
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 14, 16),
    paddingBottom: getResponsiveSize(20, 24, 28),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  voteButton: {
    minHeight: getHeight(52),
    height: 'auto',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  voteButtonText: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  securityNote: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(11, 12, 13),
    textAlign: 'center',
    lineHeight: getResponsiveSize(16, 18, 20),
  },
});

export default CandidateScreen;
