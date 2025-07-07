import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View} from 'react-native';
import BaseSearchMesaScreen from '../../../components/common/BaseSearchMesaScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchMesaLogic} from '../../../hooks/useSearchMesaLogic';
import {createSearchMesaStyles} from '../../../styles/searchMesaStyles';
import {fetchMesasConteo} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';

const BuscarMesaConteo = () => {
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
    handleMesaPress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchMesaLogic(StackNav.DetalleMesaConteo);

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
      console.log('BuscarMesaConteo: Loading mesas de conteo...');
      const response = await fetchMesasConteo();

      if (response.success) {
        console.log(
          'BuscarMesaConteo: Mesas de conteo loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('BuscarMesaConteo: Failed to load mesas de conteo');
        showModal(
          'error',
          'Error',
          'No se pudieron cargar las mesas de conteo',
        );
      }
    } catch (error) {
      console.error('BuscarMesaConteo: Error loading mesas de conteo:', error);
      showModal('error', 'Error', 'Error al cargar las mesas de conteo');
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
        title="Buscar Mesa para Conteo"
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

export default BuscarMesaConteo;
