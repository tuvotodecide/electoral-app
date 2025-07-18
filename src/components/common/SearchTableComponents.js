import React from 'react';
import {View, TouchableOpacity, TextInput} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CText from './CText';
import UniversalHeader from './UniversalHeader';
import {moderateScale} from '../../common/constants';

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
export const ChooseTableText = ({text = 'Please choose a table:', styles}) => (
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
export const TableCard = ({table, onPress, styles}) => (
  <TouchableOpacity style={styles.tableCard} onPress={() => onPress(table)}>
    <CText style={styles.tableCardTitle}>
      {table.numero || table.tableNumber || table.number || 'N/A'}
    </CText>
    {/* <CText style={styles.tableCardDetail}>Precinct: {table.recinto}</CText>
    <CText style={styles.tableCardDetail}>Address: {table.direccion}</CText>
    <CText style={styles.tableCardDetail}>Table Code: {table.codigo}</CText> */}
    <CText style={styles.tableCardDetail}> {table.recinto}</CText>
    <CText style={styles.tableCardDetail}> {table.direccion}</CText>
    <CText style={styles.tableCardDetail}> {table.codigo}</CText>
  </TouchableOpacity>
);

// Export UniversalHeader for use in other components
export {default as UniversalHeader} from './UniversalHeader';
