import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CText from './CText';
import UniversalHeader from './UniversalHeader';
import { moderateScale } from '../../common/constants';

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
  onClear, // Nuevo prop
  styles,
}) => (
  <View style={styles.searchInputContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      placeholderTextColor="#868686"
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

// Table Card Component
export const TableCard = ({ table, onPress, styles, locationData, searchQuery }) => {
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

  const locationId = locationData.locationId

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <CText style={{ backgroundColor: 'yellow', color: '#000' }}>
          {text.substring(index, index + query.length)}
        </CText>
        {text.substring(index + query.length)}
      </>
    );
  };



  return (
    <TouchableOpacity style={styles.tableCard} onPress={() => onPress(table)}>
      <CText style={styles.tableCardTitle}>
        {searchQuery ? highlightMatch(`Mesa ${tableNumber}`, searchQuery) : `Mesa ${tableNumber}`}
      </CText>
      <CText style={styles.tableCardDetail}>
        Recinto: {searchQuery ? highlightMatch(recinto, searchQuery) : recinto}
      </CText>
      <CText style={styles.tableCardDetail}>
        Dirección: {searchQuery ? highlightMatch(direccion, searchQuery) : direccion}
      </CText>
      <CText style={styles.tableCardDetail}>
        Código de Mesa: {searchQuery ? highlightMatch(codigo, searchQuery) : codigo}
      </CText>
    </TouchableOpacity>
  );
};

// Export UniversalHeader for use in other components
export { default as UniversalHeader } from './UniversalHeader';
