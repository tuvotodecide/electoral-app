import React from 'react';
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';
import {getMockMesasConteo} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';

const BuscarMesaConteo = () => {
  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleMesaPress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchMesaLogic(StackNav.DetalleMesaConteo);

  const styles = createSearchMesaStyles();
  const mesas = getMockMesasConteo();

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
      searchPlaceholder="Código de mesa"
      searchValue={searchText}
      onSearchChange={setSearchText}
      // Location info props
      locationText="La siguiente lista se basa en su ubicación"
      locationIconColor="#0C5460"
      // Mesa list props
      mesas={mesas}
      onMesaPress={handleMesaPress}
      // Navigation props
      onHomePress={handleHomePress}
      onProfilePress={handleProfilePress}
      // Layout props
      showLocationFirst={true} // Location bar aparece antes del search input
      // Styles
      styles={styles}
    />
  );
};

export default BuscarMesaConteo;
