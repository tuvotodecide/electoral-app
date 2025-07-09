import React from 'react';
import {ScrollView} from 'react-native';
import CSafeAreaView from './CSafeAreaView';
import {
  SearchTableHeader,
  ChooseTableText,
  LocationInfoBar,
  SearchInput,
  TableCard,
} from './SearchTableComponents';

const BaseSearchTableScreen = ({
  // Header props
  colors,
  onBack,
  title,
  showNotification = true,
  onNotificationPress,

  // Choose table text props
  chooseTableText,

  // Search input props
  searchPlaceholder,
  searchValue,
  onSearchChange,

  // Location info props
  locationText,
  locationIconColor,

  // Table list props
  tables,
  onTablePress,

  // Layout props
  showLocationFirst = false, // Control order of location bar and search input

  // Styles
  styles,
}) => {
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

      <ChooseTableText text={chooseTableText} styles={styles} />

      {renderSearchAndLocation()}

      <ScrollView style={styles.tableList} showsVerticalScrollIndicator={false}>
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            onPress={onTablePress}
            styles={styles}
          />
        ))}
      </ScrollView>
    </CSafeAreaView>
  );
};

export default BaseSearchTableScreen;
