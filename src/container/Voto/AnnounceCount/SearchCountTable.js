import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';
import {fetchMesasConteo} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const SearchCountTable = () => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.acceptButton,
  });

  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleMesaPress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchMesaLogic(StackNav.CountTableDetail);

  const styles = createSearchMesaStyles();

  // Cargar mesas al montar el componente
  useEffect(() => {
    loadMesas();
  }, []);

  const showModal = (
    type,
    title,
    message,
    buttonText = String.acceptButton,
  ) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadMesas = async () => {
    try {
      setIsLoading(true);
      console.log('SearchCountTable: Loading mesas de conteo...');
      const response = await fetchMesasConteo();

      if (response.success) {
        console.log(
          'SearchCountTable: Mesas de conteo loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('SearchCountTable: Failed to load mesas de conteo');
        showModal('error', String.errorTitle, String.couldNotLoadCountTables);
      }
    } catch (error) {
      console.error('SearchCountTable: Error loading mesas de conteo:', error);
      showModal('error', String.errorTitle, String.errorLoadingCountTables);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar indicador de carga mientras se cargan las mesas
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
        <CText
          style={{
            marginTop: 15,
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
          }}>
          Cargando mesas de conteo...
        </CText>
      </View>
    );
  }

  return (
    <>
      <BaseSearchMesaScreen
        // Header props
        colors={colors}
        onBack={handleBack}
        title={String.searchTableForCount}
        showNotification={true}
        onNotificationPress={handleNotificationPress}
        // Choose mesa text props
        chooseMesaText={String.chooseTablePlease}
        // Search input props
        searchPlaceholder={String.tableCodePlaceholder}
        searchValue={searchText}
        onSearchChange={setSearchText}
        // Location info props
        locationText={String.listBasedOnLocation}
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

      {/* Custom Modal */}
      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
      />
    </>
  );
};

export default SearchCountTable;
