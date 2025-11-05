import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
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
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  testID = 'baseRecordReviewScreen',
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
  showMesaInfo = false,
  mesaData,
  emptyDisplayWhenReadOnly = '0',
  showDeputy = false,
  twoColumns = false,
  PhotoComponent,
}) => {
  const insets = useSafeAreaInsets();
  const [isPhotoCollapsed, setIsPhotoCollapsed] = useState(true);
  const togglePhoto = () => setIsPhotoCollapsed(prev => !prev);

  // Use tableData or mesaData for compatibility
  const tableInfo = showTableInfo ? tableData : showMesaInfo ? mesaData : null;

  // Tablet layout: optimized layout based on orientation
  if (isTablet) {
    return (
      <CSafeAreaView
        testID={`${testID}Container`}
        style={styles.container}
        addTabPadding={false}>
        {/* Header */}
        <RecordHeader
          testID={`${testID}Header`}
          onBack={onBack}
          title={headerTitle}
          colors={colors}
        />

        {/* Instructions - Compact for tablet */}
        <View
          testID={`${testID}TabletInstructionsContainer`}
          style={styles.tabletInstructionsContainer}>
          <View style={styles.instructionsRow}>
            <View style={styles.instructionsTextWrap}>
              <InstructionsContainer
                testID={`${testID}Instructions`}
                text={instructionsText}
                style={[instructionsStyle, styles.tabletInstructionsText]}
              />
            </View>
            <TouchableOpacity
              style={styles.instructionsToggleBtn}
              onPress={togglePhoto}
              accessibilityRole="button"
              accessibilityLabel={
                isPhotoCollapsed ? 'Mostrar foto' : 'Ocultar foto'
              }>
              <Ionicons
                name={isPhotoCollapsed ? 'chevron-down' : 'chevron-up'}
                size={getResponsiveSize(14, 18, 20)}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Table Info inline with instructions */}
          {tableInfo && (
            <View
              testID={`${testID}TabletTableInfoInline`}
              style={styles.tabletTableInfoInline}>
              <CText
                testID={`${testID}TabletTableTitle`}
                style={styles.tabletTableTitleText}>
                Mesa{' '}
                {tableInfo?.tableNumber ||
                  tableInfo?.numero ||
                  tableInfo?.number ||
                  'N/A'}
              </CText>
              <CText
                testID={`${testID}TabletTableSubtitle`}
                style={styles.tabletTableSubtitleText}>
                {tableInfo?.recinto || tableInfo?.escuela || 'Recinto'}
              </CText>
            </View>
          )}
        </View>

        {/* Main Content: Horizontal layout for landscape, vertical for portrait */}
        <View
          testID={`${testID}TabletMainContent`}
          style={
            isLandscape
              ? styles.tabletMainContentHorizontal
              : styles.tabletMainContentVertical
          }>
          {/* Photo Section */}
          {!isPhotoCollapsed && (
            <View
              testID={`${testID}TabletPhotoSection`}
              style={
                isLandscape
                  ? styles.tabletPhotoSectionHorizontal
                  : styles.tabletPhotoSectionVertical
              }>
              {PhotoComponent ? (
                <PhotoComponent
                  testID={`${testID}PhotoContainer`}
                  photoUri={photoUri}
                />
              ) : (
                <PhotoContainer
                  testID={`${testID}PhotoContainer`}
                  photoUri={photoUri}
                  enableZoom={true}
                  useAspectRatio={true}
                />
              )}
            </View>
          )}

          {/* Tables and Actions Section */}
          <View
            testID={`${testID}TabletTablesSection`}
            style={[
              isLandscape
                ? styles.tabletTablesSectionHorizontal
                : styles.tabletTablesSectionVertical,
              isPhotoCollapsed && {flex: 1, minWidth: undefined},
            ]}>
            <ScrollView
              testID={`${testID}TabletTablesScrollView`}
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
                testID={`${testID}TabletTablesStacked`}
                style={
                  isLandscape
                    ? styles.tabletTablesStackedHorizontal
                    : styles.tabletTablesStackedVertical
                }>
                {/* Party Results Table */}
                <View
                  testID={`${testID}TabletPartyTableColumn`}
                  style={
                    isLandscape
                      ? styles.tabletTableColumnHorizontal
                      : styles.tabletTableColumnVertical
                  }>
                  <PartyTable
                    testID={`${testID}PartyTable`}
                    partyResults={
                      Array.isArray(partyResults) ? partyResults : []
                    }
                    isEditing={isEditing}
                    onUpdate={onPartyUpdate}
                    emptyDisplayWhenReadOnly={emptyDisplayWhenReadOnly}
                    showDeputy={showDeputy}
                  />
                </View>

                {/* Vote Summary Table */}
                <View
                  testID={`${testID}TabletVoteSummaryTableColumn`}
                  style={
                    isLandscape
                      ? styles.tabletTableColumnHorizontal
                      : styles.tabletTableColumnVertical
                  }>
                  <VoteSummaryTable
                    testID={`${testID}VoteSummaryTable`}
                    voteSummaryResults={
                      Array.isArray(voteSummaryResults)
                        ? voteSummaryResults
                        : []
                    }
                    isEditing={isEditing}
                    onUpdate={onVoteSummaryUpdate}
                    emptyDisplayWhenReadOnly={emptyDisplayWhenReadOnly}
                    twoColumns={twoColumns}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              {actionButtons && (
                <View
                  testID={`${testID}TabletActionButtonsWrapper`}
                  style={styles.tabletActionButtonsWrapper}>
                  <ActionButtons
                    testID={`${testID}ActionButtons`}
                    buttons={actionButtons}
                  />
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
    <CSafeAreaView
      testID={`${testID}Container`}
      style={styles.container}
      addTabPadding={false}>
      {/* Header */}
      <RecordHeader
        testID={`${testID}Header`}
        onBack={onBack}
        title={headerTitle}
        colors={colors}
      />

      {/* Instructions */}
      <View style={styles.instructionsRow}>
        <View style={styles.instructionsTextWrap}>
          <InstructionsContainer
            testID={`${testID}Instructions`}
            text={instructionsText}
            style={instructionsStyle}
          />
        </View>
        <TouchableOpacity
          style={styles.instructionsToggleBtn}
          onPress={togglePhoto}
          accessibilityRole="button"
          accessibilityLabel={
            isPhotoCollapsed ? 'Mostrar foto' : 'Ocultar foto'
          }>
          <Ionicons
            name={isPhotoCollapsed ? 'chevron-down' : 'chevron-up'}
            size={getResponsiveSize(14, 18, 20)}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Table Info - only for PhotoReviewScreen */}
      {tableInfo && (
        <View
          testID={`${testID}TableInfoContainer`}
          style={styles.tableInfoContainer}>
          <View testID={`${testID}TableTitle`} style={styles.tableTitle}>
            <CText
              testID={`${testID}TableTitleText`}
              style={styles.tableTitleText}>
              Mesa{' '}
              {tableInfo?.tableNumber ||
                tableInfo?.numero ||
                tableInfo?.number ||
                'N/A'}
            </CText>
          </View>
          <View testID={`${testID}TableSubtitle`} style={styles.tableSubtitle}>
            <CText
              testID={`${testID}TableSubtitleText`}
              style={styles.tableSubtitleText}>
              {tableInfo?.recinto || tableInfo?.escuela || 'Precinct N/A'}
            </CText>
          </View>
        </View>
      )}
      {/* Photo - Static (doesn't move with scroll) */}
      {!isPhotoCollapsed && (
        <View testID={`${testID}PhotoSection`} style={styles.photoSection}>
          {PhotoComponent ? (
            <PhotoComponent
              testID={`${testID}PhotoContainer`}
              photoUri={photoUri}
            />
          ) : (
            <PhotoContainer
              testID={`${testID}PhotoContainer`}
              photoUri={photoUri}
              enableZoom={true}
              useAspectRatio={true}
            />
          )}
        </View>
      )}

      {/* Scrollable content below photo */}
      <ScrollView
        testID={`${testID}ContentScrollView`}
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
          testID={`${testID}PartyTable`}
          partyResults={partyResults}
          isEditing={isEditing}
          onUpdate={onPartyUpdate}
          emptyDisplayWhenReadOnly={emptyDisplayWhenReadOnly}
          showDeputy={showDeputy}
        />

        {/* Vote Summary Table */}
        <VoteSummaryTable
          testID={`${testID}VoteSummaryTable`}
          voteSummaryResults={voteSummaryResults}
          isEditing={isEditing}
          onUpdate={onVoteSummaryUpdate}
          emptyDisplayWhenReadOnly={emptyDisplayWhenReadOnly}
          twoColumns={twoColumns}
        />

        {/* Action Buttons */}
        {actionButtons && (
          <ActionButtons
            testID={`${testID}ActionButtons`}
            buttons={actionButtons}
          />
        )}
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
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: getResponsiveSize(8, 12, 16),
  },
  instructionsTextWrap: {
    flex: 1,
  },
  instructionsToggleBtn: {
    width: getResponsiveSize(32, 38, 44),
    height: getResponsiveSize(32, 38, 44),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    marginLeft: getResponsiveSize(8, 10, 12),
    marginBottom: getResponsiveSize(8, 10, 12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tabletInstructionsLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default BaseRecordReviewScreen;
