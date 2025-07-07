import React from 'react';
import {View, TouchableOpacity, TextInput} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CText from './CText';
import UniversalHeader from './UniversalHeader';
import {moderateScale} from '../../common/constants';

// Header Component - Ahora usa UniversalHeader
export const SearchMesaHeader = ({
  colors,
  onBack,
  title = 'Buscar Mesa',
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

// Choose Mesa Text Component
export const ChooseMesaText = ({
  text = 'Elije una mesa por favor:',
  styles,
}) => (
  <View style={styles.chooseMesaContainer}>
    <CText style={styles.chooseMesaText}>{text}</CText>
  </View>
);

// Location Info Bar Component
export const LocationInfoBar = ({
  text = 'La siguiente lista se basa en su ubicación',
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
  placeholder = 'Buscar mesa',
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

// Mesa Card Component
export const MesaCard = ({mesa, onPress, styles}) => (
  <TouchableOpacity
    key={mesa.id}
    style={styles.mesaCard}
    onPress={() => onPress(mesa)}>
    <CText style={styles.mesaCardTitle}>Mesa {mesa.numero}</CText>
    <CText style={styles.mesaCardDetail}>Recinto: {mesa.recinto}</CText>
    <CText style={styles.mesaCardDetail}>Direccion: {mesa.direccion}</CText>
    <CText style={styles.mesaCardDetail}>Codigo de Mesa: {mesa.codigo}</CText>
  </TouchableOpacity>
);

// Bottom Navigation Component
export const BottomNavigation = ({
  colors,
  onHomePress,
  onProfilePress,
  styles,
}) => (
  <View style={styles.bottomNavigation}>
    <TouchableOpacity style={styles.navItem} onPress={onHomePress}>
      <Ionicons
        name="home-outline"
        size={moderateScale(24)}
        color={colors.primary || '#459151'}
      />
      <CText style={styles.navText}>Inicioooo</CText>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={onProfilePress}>
      <Ionicons
        name="person-outline"
        size={moderateScale(24)}
        color={colors.text || '#868686'}
      />
      <CText style={styles.navText}>Perfil</CText>
    </TouchableOpacity>
  </View>
);

// Export UniversalHeader for use in other components
export {default as UniversalHeader} from './UniversalHeader';
