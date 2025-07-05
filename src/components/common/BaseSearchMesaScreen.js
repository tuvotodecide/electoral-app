import React from 'react';
import {ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  SearchMesaHeader,
  ChooseMesaText,
  LocationInfoBar,
  SearchInput,
  MesaCard,
  BottomNavigation,
} from './SearchMesaComponents';

const BaseSearchMesaScreen = ({
  // Header props
  colors,
  onBack,
  title,
  showNotification = true,
  onNotificationPress,

  // Choose mesa text props
  chooseMesaText,

  // Search input props
  searchPlaceholder,
  searchValue,
  onSearchChange,

  // Location info props
  locationText,
  locationIconColor,

  // Mesa list props
  mesas,
  onMesaPress,

  // Navigation props
  onHomePress,
  onProfilePress,

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
    <SafeAreaView style={styles.container}>
      <SearchMesaHeader
        colors={colors}
        onBack={onBack}
        title={title}
        showNotification={showNotification}
        onNotificationPress={onNotificationPress}
        styles={styles}
      />

      <ChooseMesaText text={chooseMesaText} styles={styles} />

      {renderSearchAndLocation()}

      <ScrollView style={styles.mesaList} showsVerticalScrollIndicator={false}>
        {mesas.map(mesa => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            onPress={onMesaPress}
            styles={styles}
          />
        ))}
      </ScrollView>

      <BottomNavigation
        colors={colors}
        onHomePress={onHomePress}
        onProfilePress={onProfilePress}
        styles={styles}
      />
    </SafeAreaView>
  );
};

export default BaseSearchMesaScreen;
