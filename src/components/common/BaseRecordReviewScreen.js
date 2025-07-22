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

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375; // Increased from 350 to catch more small devices
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) {
    return small;
  }
  if (isTablet) {
    return large;
  }
  return medium;
};

// Calculate TabNavigation height consistently (shared with CSafeAreaView)
const getTabNavigationHeight = insets => {
  const baseTabHeight = getResponsiveSize(66, 72, 78); // Matches TabNavigation.js
  return baseTabHeight + insets.bottom;
};

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

  // Tablet layout: optimized layout based on orientation
  if (isTablet) {
    return (
      <CSafeAreaView style={styles.container}>
        {/* Header */}
        <RecordHeader onBack={onBack} title={headerTitle} colors={colors} />

        {/* Instructions - Compact for tablet */}
        <View style={styles.tabletInstructionsContainer}>
          <InstructionsContainer
            text={instructionsText}
            style={[instructionsStyle, styles.tabletInstructionsText]}
          />

          {/* Table Info inline with instructions */}
          {showTableInfo && (
            <View style={styles.tabletTableInfoInline}>
              <CText style={styles.tabletTableTitleText}>
                Table{' '}
                {tableData?.tableNumber ||
                  tableData?.numero ||
                  tableData?.number ||
                  'N/A'}
              </CText>
              <CText style={styles.tabletTableSubtitleText}>
                {tableData?.recinto || tableData?.escuela || 'Precinct N/A'}
              </CText>
            </View>
          )}
        </View>

        {/* Main Content: Horizontal layout for landscape, vertical for portrait */}
        <View
          style={
            isLandscape
              ? styles.tabletMainContentHorizontal
              : styles.tabletMainContentVertical
          }>
          {/* Photo Section */}
          <View
            style={
              isLandscape
                ? styles.tabletPhotoSectionHorizontal
                : styles.tabletPhotoSectionVertical
            }>
            <PhotoContainer
              photoUri={photoUri}
              enableZoom={true}
              useAspectRatio={true}
            />
          </View>

          {/* Tables and Actions Section */}
          <View
            style={
              isLandscape
                ? styles.tabletTablesSectionHorizontal
                : styles.tabletTablesSectionVertical
            }>
            <ScrollView
              style={styles.tabletTablesScrollView}
              contentContainerStyle={[
                styles.tabletTablesScrollContent,
                {
                  paddingBottom:
                    getTabNavigationHeight(insets) +
                    getResponsiveSize(8, 12, 16),
                },
              ]}
              showsVerticalScrollIndicator={false}>
              {/* Tables Container - Side by side in landscape, stacked in portrait */}
              <View
                style={
                  isLandscape
                    ? styles.tabletTablesStackedHorizontal
                    : styles.tabletTablesStackedVertical
                }>
                {/* Party Results Table */}
                <View
                  style={
                    isLandscape
                      ? styles.tabletTableColumnHorizontal
                      : styles.tabletTableColumnVertical
                  }>
                  <PartyTable
                    partyResults={partyResults}
                    isEditing={isEditing}
                    onUpdate={onPartyUpdate}
                  />
                </View>

                {/* Vote Summary Table */}
                <View
                  style={
                    isLandscape
                      ? styles.tabletTableColumnHorizontal
                      : styles.tabletTableColumnVertical
                  }>
                  <VoteSummaryTable
                    voteSummaryResults={voteSummaryResults}
                    isEditing={isEditing}
                    onUpdate={onVoteSummaryUpdate}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              {actionButtons && (
                <View style={styles.tabletActionButtonsWrapper}>
                  <ActionButtons buttons={actionButtons} />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </CSafeAreaView>
    );
  }

  // Phone layout: vertical stack
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
              Table{' '}
              {tableData?.tableNumber ||
                tableData?.numero ||
                tableData?.number ||
                'N/A'}
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
        <PhotoContainer
          photoUri={photoUri}
          enableZoom={true}
          useAspectRatio={true}
        />
      </View>

      {/* Scrollable content below photo */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              getTabNavigationHeight(insets) + getResponsiveSize(8, 12, 16),
          }, // Space for TabNavigation
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
  // Phone layout styles
  photoSection: {
    paddingHorizontal: getResponsiveSize(6, 16, 20),
    // Image stays static here
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(6, 16, 20),
    marginTop: getResponsiveSize(2, 8, 10), // Small space between photo and content
  },
  scrollContent: {
    flexGrow: 1,
  },

  // NEW Tablet layout styles - Optimized for both orientations
  tabletInstructionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 24, 32),
    paddingVertical: getResponsiveSize(8, 12, 16),
    backgroundColor: '#F8F9FA',
    marginHorizontal: getResponsiveSize(12, 16, 20),
    marginVertical: getResponsiveSize(4, 8, 12),
    borderRadius: 12,
  },
  tabletInstructionsText: {
    flex: 1,
    marginRight: getResponsiveSize(12, 16, 20),
    fontSize: getResponsiveSize(14, 16, 18),
    lineHeight: getResponsiveSize(18, 22, 26),
  },
  tabletTableInfoInline: {
    alignItems: 'flex-end',
  },
  tabletTableTitleText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#2F2F2F',
    textAlign: 'right',
  },
  tabletTableSubtitleText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#868686',
    textAlign: 'right',
    marginTop: 2,
  },

  // Horizontal Layout (Landscape)
  tabletMainContentHorizontal: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingTop: getResponsiveSize(8, 12, 16),
  },
  tabletPhotoSectionHorizontal: {
    flex: 0.45, // 45% for photo in landscape
    marginRight: getResponsiveSize(12, 16, 20),
    minWidth: 320,
    maxWidth: 500,
  },
  tabletTablesSectionHorizontal: {
    flex: 0.55, // 55% for tables in landscape
    minWidth: 400,
  },
  tabletTablesStackedHorizontal: {
    flexDirection: 'column', // Stack tables vertically even in landscape
  },
  tabletTableColumnHorizontal: {
    marginBottom: getResponsiveSize(12, 16, 20),
  },

  // Vertical Layout (Portrait)
  tabletMainContentVertical: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingTop: getResponsiveSize(8, 12, 16),
  },
  tabletPhotoSectionVertical: {
    flex: 0.4, // 40% for photo in portrait
    marginBottom: getResponsiveSize(12, 16, 20),
    minHeight: 250,
    maxHeight: 400,
  },
  tabletTablesSectionVertical: {
    flex: 0.6, // 60% for tables in portrait
  },
  tabletTablesStackedVertical: {
    flexDirection: 'row', // Side by side tables in portrait
    justifyContent: 'space-between',
  },
  tabletTableColumnVertical: {
    flex: 0.48, // Each table takes ~48% width in portrait
    marginBottom: getResponsiveSize(12, 16, 20),
  },

  // Common tablet styles
  tabletTablesScrollView: {
    flex: 1,
  },
  tabletTablesScrollContent: {
    flexGrow: 1,
    paddingRight: getResponsiveSize(8, 12, 16),
  },
  tabletActionButtonsWrapper: {
    marginTop: getResponsiveSize(8, 12, 16),
    marginBottom: getResponsiveSize(16, 20, 24),
  },

  // OLD Tablet layout styles (keeping for fallback)
  tabletMainScrollView: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(12, 20, 24),
  },
  tabletMainScrollContent: {
    flexGrow: 1,
    paddingTop: getResponsiveSize(4, 12, 16),
  },
  tabletPhotoContainer: {
    marginBottom: getResponsiveSize(8, 20, 24),
    paddingHorizontal: getResponsiveSize(4, 12, 16),
  },
  tabletTablesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(8, 20, 24),
  },
  tabletTableColumn: {
    flex: 0.48, // Cada tabla ocupa ~48% del ancho
  },
  tabletActionButtonsContainer: {
    paddingHorizontal: getResponsiveSize(4, 12, 16),
  },

  // Legacy tablet styles (mantener por compatibilidad)
  tabletContentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(8, 12, 16),
  },

  // Common styles
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
    paddingHorizontal: getResponsiveSize(6, 16, 24),
    marginBottom: getResponsiveSize(2, 8, 12),
  },
  tableTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: getResponsiveSize(0, 4, 6),
  },
  tableSubtitleText: {
    fontSize: 12,
    color: '#868686',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(12, 32, 40),
  },
});

export default BaseRecordReviewScreen;
