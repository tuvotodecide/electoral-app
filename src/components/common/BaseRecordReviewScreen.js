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
  if (isSmallPhone) return small;
  if (isTablet) return large;
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

  // Tablet layout: side-by-side photo and tables
  if (isTablet) {
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

        {/* Tablet Layout: Enhanced vertical layout with better proportions */}
        <ScrollView
          style={styles.tabletMainScrollView}
          contentContainerStyle={[
            styles.tabletMainScrollContent,
            {
              paddingBottom:
                getTabNavigationHeight(insets) + getResponsiveSize(8, 12, 16),
            },
          ]}
          showsVerticalScrollIndicator={false}>
          {/* Photo Section - Optimized for tablet */}
          <View style={styles.tabletPhotoContainer}>
            <PhotoContainer photoUri={photoUri} enableZoom={true} />
          </View>

          {/* Tables Section - Side by side for better space usage */}
          <View style={styles.tabletTablesContainer}>
            {/* Left Column - Party Results */}
            <View style={styles.tabletTableColumn}>
              <PartyTable
                partyResults={partyResults}
                isEditing={isEditing}
                onUpdate={onPartyUpdate}
              />
            </View>

            {/* Right Column - Vote Summary */}
            <View style={styles.tabletTableColumn}>
              <VoteSummaryTable
                voteSummaryResults={voteSummaryResults}
                isEditing={isEditing}
                onUpdate={onVoteSummaryUpdate}
              />
            </View>
          </View>

          {/* Action Buttons - Full width */}
          {actionButtons && (
            <View style={styles.tabletActionButtonsContainer}>
              <ActionButtons buttons={actionButtons} />
            </View>
          )}
        </ScrollView>
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
  // Tablet layout styles
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
  tabletPhotoSection: {
    flex: 0.5, // 50% of width for photo (reducido del 60%)
    paddingRight: getResponsiveSize(8, 12, 16),
    minWidth: 300, // Ancho mínimo para la foto
  },
  tabletTablesSection: {
    flex: 0.5, // 50% of width for tables (aumentado del 40%)
    paddingLeft: getResponsiveSize(8, 12, 16),
    minWidth: 350, // Ancho mínimo para las tablas
  },
  tabletScrollContent: {
    flexGrow: 1,
    paddingRight: getResponsiveSize(4, 8, 12), // Padding adicional para scroll
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
