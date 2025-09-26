import React from 'react';
import {View, TouchableOpacity, TextInput, Dimensions} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CText from './CText';
import UniversalHeader from './UniversalHeader';
import { moderateScale } from '../../common/constants';

export const getTableNumber = table => {
  const raw =
    table.tableNumber ??
    table.numero ??
    table.number ??
    table.name ??
    table.id ??
    '0';
  const n = parseInt(String(raw).replace(/\D+/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};
// Header Component - Now uses UniversalHeader
export const SearchTableHeader = ({
  colors,
  onBack,
  title = 'Search Table',
  showNotification = true,
  onNotificationPress,
  styles,
}) => (
  <UniversalHeader
    colors={colors}
    onBack={onBack}
    title={title}
    showNotification={showNotification}
    onNotificationPress={onNotificationPress}
    customStyles={{
      header: styles?.header,
      backButton: styles?.backButton,
      headerTitle: styles?.headerTitle,
      bellIcon: styles?.bellIcon,
    }}
  />
);


export const sortTables = (tables, order = 'desc') => {
  const copy = [...(tables || [])];
  copy.sort((a, b) => {
    const an = getTableNumber(a);
    const bn = getTableNumber(b);
    return order === 'asc' ? an - bn : bn - an;
  });
  return copy;
};

// Choose Table Text Component
export const ChooseTableText = ({ text = 'Please choose a table:', styles }) => (
  <View style={styles.chooseTableContainer}>
    <CText style={styles.chooseTableText}>{text}</CText>
  </View>
);

// Location Info Bar Component
export const LocationInfoBar = ({
  text = 'The following list is based on your location',
  iconColor = '#0C5460',
  styles,
}) => (
  <View style={styles.locationInfoBar}>
    <FontAwesome
      name="map-marker"
      size={moderateScale(16)}
      color={iconColor}
      style={styles.locationIcon}
    />
    <CText style={styles.locationInfoText}>{text}</CText>
  </View>
);

// Search Input Component
export const SearchInput = ({
  placeholder = 'Search table',
  value,
  onChangeText,
  onClear, // sigue siendo opcional
  styles,
}) => {
  return (
    <View style={styles1.searchInputContainer}>
      <TextInput
        style={styles1.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#868686"
        value={value}
        onChangeText={onChangeText}
      />

      {value ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            if (onClear) onClear();
            else if (onChangeText) onChangeText('');
          }}
          activeOpacity={0.7}>
          <Ionicons name="close-circle" size={20} color="#888" />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
      )}
    </View>
  );
};

// Table Card Component
export const TableCard = ({
  table,
  onPress,
  styles,
  locationData,
  searchQuery,
}) => {
  // Debug: log complete table structure to analyze available fields

  // Extract table information with API structure
  const tableNumber =
    table.tableNumber ||
    table.numero ||
    table.number ||
    table.name ||
    table.id ||
    'N/A';

  // Use location data from parent response for recinto and direccion
  const recinto =
    locationData?.name ||
    table.recinto ||
    table.venue ||
    table.precinctName ||
    'N/A';
  const direccion =
    locationData?.address ||
    table.direccion ||
    table.address ||
    table.provincia ||
    'N/A';
  const codigo =
    table.tableCode || table.codigo || table.code || table.id || 'N/A';

  const locationId = locationData.locationId;

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <CText style={{backgroundColor: 'yellow', color: '#000'}}>
          {text.substring(index, index + query.length)}
        </CText>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.tableCard, {flexDirection: 'row', alignItems: 'center'}]}
      onPress={() => onPress(table)}>
      <Ionicons
        name="file-tray-full-sharp"
        size={24}
        color="#4F9858"
        style={{marginRight: 12}}
      />
      <View style={{flex: 1}}>
        <CText style={styles.tableCardTitle}>
          {searchQuery
            ? highlightMatch(`Mesa ${tableNumber}`, searchQuery)
            : `Mesa ${tableNumber}`}
        </CText>

        <CText style={styles.tableCardDetail}>
          Código de Mesa:{' '}
          {searchQuery ? highlightMatch(codigo, searchQuery) : codigo}
        </CText>
      </View>
    </TouchableOpacity>
  );
};
const styles1 = {
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(4, 6, 8),
    marginBottom: getResponsiveSize(12, 16, 20),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  searchInput: {
    flex: 1,
    height: getResponsiveSize(40, 45, 50),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#333',
    paddingVertical: 0,
  },

  searchIcon: {
    marginLeft: getResponsiveSize(8, 10, 12),
  },

  clearButton: {
    padding: getResponsiveSize(5, 8, 10),
  },
};

// Export UniversalHeader for use in other components
export { default as UniversalHeader } from './UniversalHeader';
