import React from 'react';
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';
import {getMockMesas} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';

const SearchMesaScreen = () => {
  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleMesaPress: baseMesaPress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchMesaLogic(StackNav.CualEsCorrectaScreen);

  const styles = createSearchMesaStyles();
  const mesas = getMockMesas();

  // Override handleMesaPress for AtestiguarActa specific behavior
  const handleMesaPress = mesa => {
    console.log('Navegando a CualEsCorrectaScreen con mesa:', mesa.numero);
    baseMesaPress({
      ...mesa,
      photoUri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+de+Mesa',
    });
  };

  return (
    <BaseSearchMesaScreen
      // Header props
      colors={colors}
      onBack={handleBack}
      title="Buscar Mesa"
      showNotification={true}
      onNotificationPress={handleNotificationPress}
      // Choose mesa text props
      chooseMesaText="Elije una mesa por favor:"
      // Search input props
      searchPlaceholder="Buscar mesa"
      searchValue={searchText}
      onSearchChange={setSearchText}
      // Location info props
      locationText="La siguiente lista se basa en su ubicacion"
      locationIconColor="#0C5460"
      // Mesa list props
      mesas={mesas}
      onMesaPress={handleMesaPress}
      // Navigation props
      onHomePress={handleHomePress}
      onProfilePress={handleProfilePress}
      // Layout props
      showLocationFirst={false} // Search input aparece antes de location bar
      // Styles
      styles={styles}
    />
  );
};

export default SearchMesaScreen;
