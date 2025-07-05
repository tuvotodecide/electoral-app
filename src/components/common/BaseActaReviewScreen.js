import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CText from './CText';
import {
  ActaHeader,
  InstructionsContainer,
  PhotoContainer,
  PartyTable,
  VoteSummaryTable,
  ActionButtons,
  BottomNavigation,
} from './ActaReviewComponents';

const BaseActaReviewScreen = ({
  colors,
  headerTitle,
  instructionsText,
  instructionsStyle,
  photoUri,
  partyResults,
  voteSummaryResults,
  isEditing = false,
  onPartyUpdate,
  onVoteSummaryUpdate,
  actionButtons,
  onBack,
  showMesaInfo = false,
  mesaData,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ActaHeader onBack={onBack} title={headerTitle} colors={colors} />

      {/* Instructions */}
      <InstructionsContainer
        text={instructionsText}
        style={instructionsStyle}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mesa Info - solo para PhotoReviewScreen */}
        {showMesaInfo && (
          <View style={styles.mesaInfoContainer}>
            <View style={styles.mesaTitle}>
              <CText style={styles.mesaTitleText}>
                Mesa {mesaData?.numero || 'N/A'}
              </CText>
            </View>
            <View style={styles.mesaSubtitle}>
              <CText style={styles.mesaSubtitleText}>
                {mesaData?.escuela || 'Escuela N/A'}
              </CText>
            </View>
          </View>
        )}

        {/* Photo */}
        <PhotoContainer photoUri={photoUri} />

        {/* Party Results Table */}
        <PartyTable
          partyResults={partyResults}
          isEditing={isEditing}
          onUpdate={onPartyUpdate}
        />

        {/* Vote Summary Table */}
        <VoteSummaryTable
          voteSummaryResults={voteSummaryResults}
          isEditing={isEditing}
          onUpdate={onVoteSummaryUpdate}
        />

        {/* Action Buttons */}
        {actionButtons && <ActionButtons buttons={actionButtons} />}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation colors={colors} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mesaInfoContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginVertical: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  mesaTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 4,
  },
  mesaSubtitleText: {
    fontSize: 14,
    color: '#868686',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
});

export default BaseActaReviewScreen;
