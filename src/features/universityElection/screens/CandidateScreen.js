/**
 * Candidate Screen
 *
 * Pantalla para seleccionar candidato y votar.
 * Usa los componentes existentes del repo.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

// Components
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';

// Feature components
import CandidateCard from '../components/CandidateCard';
import ConfirmVoteModal from '../components/ConfirmVoteModal';
import OfflineQueuedModal from '../components/OfflineQueuedModal';

// Feature logic
import { useUniversityElectionState } from '../state/useUniversityElectionState';
import { useElectionRepository } from '../data/useElectionRepository';
import { enqueueVote } from '../offline/queueAdapter';
import { MOCK_ELECTION, MOCK_CANDIDATES, UI_STRINGS } from '../data/mockData';
import { DEV_FLAGS } from '../../../config/featureFlags';

// Utils
import { checkInternetConnection } from '../../../utils/networkUtils';
import { moderateScale, getHeight } from '../../../common/constants';
import { StackNav } from '../../../navigation/NavigationKey';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helpers
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const CandidateScreen = ({ route }) => {
  const navigation = useNavigation();
  const colors = useSelector((state) => state.theme.theme);
  const repository = useElectionRepository();

  // Get election data from route params or use mock
  const electionId = route?.params?.electionId || MOCK_ELECTION.id;

  // State
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Election state hook
  const { recordVote } = useUniversityElectionState(electionId);

  // Load candidates
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const data = await repository.getCandidates(electionId);
        setCandidates(data);
      } catch (error) {
        console.error('[CandidateScreen] Error loading candidates:', error);
        // Fallback to mock data
        setCandidates(MOCK_CANDIDATES);
      }
    };
    loadCandidates();
  }, [electionId, repository]);

  // Handle candidate selection
  const handleSelectCandidate = useCallback((candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  // Handle vote button press
  const handleVotePress = useCallback(() => {
    if (!selectedCandidate) return;
    setShowConfirmModal(true);
  }, [selectedCandidate]);

  // Handle confirm vote
  const handleConfirmVote = useCallback(async () => {
    if (!selectedCandidate) return;

    setIsLoading(true);

    try {
      // Check connectivity (allow DEV_FLAGS override for testing)
      const isOnline = DEV_FLAGS.FORCE_OFFLINE_UNIVERSITY_ELECTION
        ? false
        : await checkInternetConnection();

      if (isOnline) {
        // Online: Submit vote directly
        const result = await repository.submitVote(electionId, selectedCandidate.id);

        if (result.success) {
          // Record vote locally as synced
          await recordVote(selectedCandidate.id, true);

          // Mint NFT
          try {
            await repository.mintNFT(electionId, selectedCandidate.id);
          } catch (nftError) {
            console.warn('[CandidateScreen] NFT mint error:', nftError);
          }

          setShowConfirmModal(false);

          // Navigate to receipt/comprobante screen
          navigation.navigate(StackNav.UniversityElectionReceiptScreen, {
            participationId: 'participation_1', // Mock ID for demo
          });
        } else {
          throw new Error(result.error || 'Vote failed');
        }
      } else {
        // Offline: Queue vote for later
        await enqueueVote({
          electionId,
          candidateId: selectedCandidate.id,
          presidentName: selectedCandidate.presidentName,
        });

        // Record vote locally as NOT synced
        await recordVote(selectedCandidate.id, false);

        setShowConfirmModal(false);
        setShowOfflineModal(true);
      }
    } catch (error) {
      console.error('[CandidateScreen] Vote error:', error);
      // TODO: Show error modal
      setShowConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCandidate, electionId, repository, recordVote, navigation]);

  // Handle cancel confirm
  const handleCancelConfirm = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  // Handle offline modal dismiss
  const handleOfflineDismiss = useCallback(() => {
    setShowOfflineModal(false);
    // Navigate back to home
    navigation.navigate(StackNav.TabNavigation);
  }, [navigation]);

  // Get button text
  const getButtonText = () => {
    if (!selectedCandidate) {
      return UI_STRINGS.selectCandidate;
    }
    return `${UI_STRINGS.voteFor} ${selectedCandidate.presidentName.split(' ')[0].toUpperCase()} ${selectedCandidate.presidentName.split(' ')[1]?.toUpperCase() || ''}`.trim();
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
          disabled={!selectedCandidate}
          onPress={handleVotePress}
          containerStyle={styles.voteButton}
          sinMargen
          testID="voteButton"
        />

        <CText type="R12" style={styles.securityNote}>
          {UI_STRINGS.voteSecureNote}
        </CText>
      </View>

      {/* Confirm Modal */}
      <ConfirmVoteModal
        visible={showConfirmModal}
        presidentName={selectedCandidate?.presidentName || ''}
        partyName={selectedCandidate?.partyName || ''}
        partyColor={selectedCandidate?.partyColor || '#2563EB'}
        onConfirm={handleConfirmVote}
        onCancel={handleCancelConfirm}
        isLoading={isLoading}
      />

      {/* Offline Queued Modal */}
      <OfflineQueuedModal
        visible={showOfflineModal}
        onDismiss={handleOfflineDismiss}
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
    height: getHeight(52),
    borderRadius: moderateScale(12),
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  securityNote: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(11, 12, 13),
    textAlign: 'center',
    lineHeight: getResponsiveSize(16, 18, 20),
  },
});

export default CandidateScreen;
