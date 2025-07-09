import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CSafeAreaView from './CSafeAreaView';
import CText from './CText';
import {moderateScale} from '../../common/constants';
import {
  RecordHeader,
  InstructionsContainer,
  PhotoContainer,
  PartyTable,
  VoteSummaryTable,
  ActionButtons,
} from './RecordReviewComponents';

const BaseRecordReviewScreen = ({
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
  showTableInfo = false,
  tableData,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <CSafeAreaView style={styles.container}>
      {/* Header */}
      <RecordHeader onBack={onBack} title={headerTitle} colors={colors} />

      {/* Instructions */}
      <InstructionsContainer
        text={instructionsText}
        style={instructionsStyle}
      />

      {/* Table Info - only for PhotoReviewScreen */}
      {showTableInfo && (
        <View style={styles.tableInfoContainer}>
          <View style={styles.tableTitle}>
            <CText style={styles.tableTitleText}>
              Table {tableData?.numero || 'N/A'}
            </CText>
          </View>
          <View style={styles.tableSubtitle}>
            <CText style={styles.tableSubtitleText}>
              {tableData?.recinto || tableData?.escuela || 'Precinct N/A'}
            </CText>
          </View>
        </View>
      )}

      {/* Photo - Static (doesn't move with scroll) */}
      <View style={styles.photoSection}>
        <PhotoContainer photoUri={photoUri} enableZoom={true} />
      </View>

      {/* Scrollable content below photo */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: moderateScale(100) + insets.bottom}, // Space for TabNavigation
        ]}
        showsVerticalScrollIndicator={false}>
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
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  photoSection: {
    paddingHorizontal: 16,
    // Image stays static here
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: moderateScale(8), // Small space between photo and content
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableInfoContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginVertical: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    paddingHorizontal: 16,
    marginBottom: moderateScale(8),
  },
  tableTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: 4,
  },
  tableSubtitleText: {
    fontSize: 14,
    color: '#868686',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
});

export default BaseRecordReviewScreen;
