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

const {width: screenWidth} = Dimensions.get('window');
const isTablet = screenWidth >= 768;

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
    if (showLocationFirst) {
      return (
        <>
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
        </>
      );
    } else {
      return (
        <>
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
        </>
      );
    }
  };

  const renderTablesList = () => {
    if (!finalTables || finalTables.length === 0) {
      return null;
    }

    if (isTablet) {
      // Two-column layout for tablets
      const pairs = [];
      for (let i = 0; i < finalTables.length; i += 2) {
        pairs.push(finalTables.slice(i, i + 2));
      }

      return (
        <ScrollView
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}>
          {pairs.map((pair, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                marginBottom: 8,
              }}>
              {pair.map(table => (
                <TableCard
                  key={table.id}
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
              ))}
              {pair.length === 1 && <View style={{flex: 0.48}} />}
            </View>
          ))}
        </ScrollView>
      );
    } else {
      // Single column layout for phones
      return (
        <ScrollView
          style={styles.tableList || styles.mesaList}
          showsVerticalScrollIndicator={false}>
          {finalTables.map(table => (
            <View key={table.id} style={{paddingHorizontal: 16}}>
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

      <ChooseTableText text={finalChooseText} styles={styles} />

      {renderSearchAndLocation()}

      {renderTablesList()}
    </CSafeAreaView>
  );
};

// Legacy export for backward compatibility
export const BaseSearchMesaScreen = BaseSearchTableScreen;
export default BaseSearchTableScreen;
