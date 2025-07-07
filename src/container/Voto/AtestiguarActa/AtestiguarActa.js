import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';
import {fetchMesas} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';

const SearchMesaScreen = () => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: 'Aceptar',
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
  } = useSearchMesaLogic(StackNav.CualEsCorrectaScreen);

  const styles = createSearchMesaStyles();

  // Cargar mesas al montar el componente
  useEffect(() => {
    loadMesas();
  }, []);

  const showModal = (type, title, message, buttonText = 'Aceptar') => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadMesas = async () => {
    try {
      setIsLoading(true);
      console.log('AtestiguarActa: Loading mesas...');
      const response = await fetchMesas();

      if (response.success) {
        console.log(
          'AtestiguarActa: Mesas loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('AtestiguarActa: Failed to load mesas');
        showModal('error', 'Error', 'No se pudieron cargar las mesas');
      }
    } catch (error) {
      console.error('AtestiguarActa: Error loading mesas:', error);
      showModal('error', 'Error', 'Error al cargar las mesas');
    } finally {
      setIsLoading(false);
    }
  };

  // Override handleMesaPress for AtestiguarActa specific behavior
  const handleMesaPress = mesa => {
    console.log('AtestiguarActa - handleMesaPress called with mesa:', mesa);
    console.log(
      'AtestiguarActa - StackNav.CualEsCorrectaScreen:',
      StackNav.CualEsCorrectaScreen,
    );

    try {
      // Usar baseMesaPress del hook pero con los parámetros correctos para AtestiguarActa
      const mesaWithPhoto = {
        mesaData: mesa,
        photoUri:
          'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      };
      console.log(
        'AtestiguarActa - Calling baseMesaPress with:',
        mesaWithPhoto,
      );
      baseMesaPress(mesaWithPhoto);
      console.log('AtestiguarActa - baseMesaPress call successful');
    } catch (error) {
      console.error('AtestiguarActa - Navigation error:', error);
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
          Cargando mesas...
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
