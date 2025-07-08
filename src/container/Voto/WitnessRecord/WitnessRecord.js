import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';
import {fetchMesas} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const SearchMesaScreen = () => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });

  const {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleMesaPress: baseMesaPress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchMesaLogic(StackNav.WhichIsCorrectScreen);

  const styles = createSearchMesaStyles();

  // Cargar mesas al montar el componente
  useEffect(() => {
    loadMesas();
  }, []);

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadMesas = async () => {
    try {
      setIsLoading(true);
      console.log('WitnessRecord: Loading mesas...');
      const response = await fetchMesas();

      if (response.success) {
        console.log(
          'WitnessRecord: Mesas loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('WitnessRecord: Failed to load mesas');
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      console.error('WitnessRecord: Error loading mesas:', error);
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoading(false);
    }
  };

  // Override handleMesaPress for WitnessRecord specific behavior
  const handleMesaPress = mesa => {
    console.log('WitnessRecord - handleMesaPress called with mesa:', mesa);
    console.log(
      'WitnessRecord - StackNav.WhichIsCorrectScreen:',
      StackNav.WhichIsCorrectScreen,
    );

    try {
      // Usar baseMesaPress del hook pero con los parámetros correctos para WitnessRecord
      const mesaWithPhoto = {
        mesaData: mesa,
        photoUri:
          'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      };
      console.log('WitnessRecord - Calling baseMesaPress with:', mesaWithPhoto);
      baseMesaPress(mesaWithPhoto);
      console.log('WitnessRecord - baseMesaPress call successful');
    } catch (error) {
      console.error('WitnessRecord - Navigation error:', error);
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
          {String.loadingTables}
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
        title={String.searchTable}
        showNotification={true}
        onNotificationPress={handleNotificationPress}
        // Choose mesa text props
        chooseMesaText={String.chooseTablePlease}
        // Search input props
        searchPlaceholder={String.searchTablePlaceholder}
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
        showLocationFirst={false} // Search input aparece antes de location bar
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

export default SearchMesaScreen;
