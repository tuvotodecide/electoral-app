import React from 'react';
import {ScrollView, View, Dimensions} from 'react-native';
import CSafeAreaView from './CSafeAreaView';
import {
  SearchTableHeader,
  ChooseTableText,
  LocationInfoBar,
  SearchInput,
  TableCard,
  // Legacy support
  SearchMesaHeader,
  ChooseMesaText,
  MesaCard,
} from './SearchTableComponents';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const getCardLayout = () => {
  if (isTablet) {
    // Tablets: Different layouts for landscape vs portrait
    if (isLandscape) {
      // Landscape: 3 cards per row for better space usage
      return {
        cardsPerRow: 3,
        cardFlex: 0.31,
        paddingHorizontal: getResponsiveSize(16, 20, 24),
        marginBottom: getResponsiveSize(8, 12, 16),
      };
    } else {
      // Portrait: 2 cards per row
      return {
        cardsPerRow: 2,
        cardFlex: 0.48,
        paddingHorizontal: getResponsiveSize(12, 16, 20),
        marginBottom: getResponsiveSize(8, 10, 12),
      };
    }
  } else {
    // Phones: Single column
    return {
      cardsPerRow: 1,
      cardFlex: 1,
      paddingHorizontal: getResponsiveSize(12, 16, 20),
      marginBottom: getResponsiveSize(6, 8, 10),
    };
  }
};

const BaseSearchTableScreen = ({
  // Header props
  colors,
  onBack,
  title,
  showNotification = true,
  onNotificationPress,

  // Choose table text props
  chooseTableText,
  chooseMesaText, // Legacy support

  // Search input props
  searchPlaceholder,
  searchValue,
  onSearchChange,

  // Location info props
  locationText,
  locationIconColor,

  // Table list props
  tables,
  mesas, // Legacy support
  onTablePress,
  onMesaPress, // Legacy support

  // Layout props
  showLocationFirst = false, // Control order of location bar and search input

  // Styles
  styles,
}) => {
  // Support legacy props
  const finalTables = tables || mesas || [];
  const finalOnPress = onTablePress || onMesaPress;
  const finalChooseText = chooseTableText || chooseMesaText;
  const renderSearchAndLocation = () => {
    const containerStyle = {
      paddingHorizontal: getResponsiveSize(12, 16, 20),
      marginVertical: getResponsiveSize(8, 12, 16),
    };

    if (showLocationFirst) {
      return (
        <View style={containerStyle}>
          <LocationInfoBar
            text={locationText}
            iconColor={locationIconColor}
            styles={styles}
          />
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearchChange}
            styles={styles}
          />
        </View>
      );
    } else {
      return (
        <View style={containerStyle}>
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onChangeText={onSearchChange}
            styles={styles}
          />
          <LocationInfoBar
            text={locationText}
            iconColor={locationIconColor}
            styles={styles}
          />
        </View>
      );
    }
  };

  const renderTablesList = () => {
    if (!finalTables || finalTables.length === 0) {
      return null;
    }

    const layout = getCardLayout();

    if (layout.cardsPerRow === 1) {
      // Single column layout for phones
      return (
        <ScrollView
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getResponsiveSize(20, 30, 40),
          }}>
          {finalTables.map(table => (
            <View
              key={table.id}
              style={{
                paddingHorizontal: layout.paddingHorizontal,
                marginBottom: layout.marginBottom,
              }}>
              <TableCard
                table={table}
                onPress={finalOnPress}
                styles={{
                  tableCard: styles.tableCard || styles.mesaCard,
                  tableCardTitle: styles.tableCardTitle || styles.mesaCardTitle,
                  tableCardDetail:
                    styles.tableCardDetail || styles.mesaCardDetail,
                }}
              />
            </View>
          ))}
        </ScrollView>
      );
    } else {
      // Multi-column layout for tablets
      const groups = [];
      for (let i = 0; i < finalTables.length; i += layout.cardsPerRow) {
        groups.push(finalTables.slice(i, i + layout.cardsPerRow));
      }

      return (
        <ScrollView
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: getResponsiveSize(20, 30, 40),
          }}>
          {groups.map((group, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: layout.paddingHorizontal,
                marginBottom: layout.marginBottom,
                gap: getResponsiveSize(8, 12, 16),
              }}>
              {group.map(table => (
                <View
                  key={table.id}
                  style={{
                    flex: layout.cardFlex,
                  }}>
                  <TableCard
                    table={table}
                    onPress={finalOnPress}
                    styles={{
                      tableCard: styles.tableCard || styles.mesaCard,
                      tableCardTitle:
                        styles.tableCardTitle || styles.mesaCardTitle,
                      tableCardDetail:
                        styles.tableCardDetail || styles.mesaCardDetail,
                    }}
                  />
                </View>
              ))}
              {/* Fill empty spaces for incomplete rows */}
              {Array.from({length: layout.cardsPerRow - group.length}).map(
                (_, emptyIndex) => (
                  <View
                    key={`empty-${emptyIndex}`}
                    style={{flex: layout.cardFlex}}
                  />
                ),
              )}
            </View>
          ))}
        </ScrollView>
      );
    }
  };

  return (
    <CSafeAreaView style={styles.container}>
      <SearchTableHeader
        colors={colors}
        onBack={onBack}
        title={title}
        showNotification={showNotification}
        onNotificationPress={onNotificationPress}
        styles={styles}
      />

      <View
        style={{
          paddingHorizontal: getResponsiveSize(12, 16, 20),
          marginVertical: getResponsiveSize(8, 12, 16),
        }}>
        <ChooseTableText text={finalChooseText} styles={styles} />
      </View>

      {renderSearchAndLocation()}

      {renderTablesList()}
    </CSafeAreaView>
  );
};

// Legacy export for backward compatibility
export const BaseSearchMesaScreen = BaseSearchTableScreen;
export default BaseSearchTableScreen;
