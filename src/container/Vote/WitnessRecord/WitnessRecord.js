import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {ActivityIndicator, View, Dimensions} from 'react-native';
import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchTableLogic} from '../../../hooks/useSearchTableLogic';
import {createSearchTableStyles} from '../../../styles/searchTableStyles';
import {fetchMesas} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const WitnessRecordScreen = ({navigation, route}) => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState(null);
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
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchTableLogic(StackNav.WhichIsCorrectScreen);

  const styles = createSearchTableStyles();

  // Load tables when component mounts

  useEffect(() => {
    if (route?.params?.locationId) {
      loadTablesFromApi(route.params.locationId);
    } else {
      loadTables();
    }
  }, [route?.params?.locationId]);

  const loadTablesFromApi = async locationId => {
    try {
      setIsLoading(true);

      // const response = await axios.get(
      //   `https://yo-custodio-backend.onrender.com/api/v1/geographic/electoral-locations/${locationId}/tables`,
      // );
      const response = await axios.get(
        `http://192.168.1.16:3000/api/v1/geographic/electoral-locations/686e0624eb2961c4b31bdb7d/tables`,
      );
    
      if (response.data && response.data.tables) {


        // Store location data for TableCard components
        setLocationData({
          name: response.data.name,
          address: response.data.address,
          code: response.data.code,
        });

        setMesas(response.data.tables);
      } else if (
        response.data &&
        response.data.data &&
        response.data.data.tables
      ) {
 
        // Store location data for TableCard components
        setLocationData({
          name: response.data.data.name,
          address: response.data.data.address,
          code: response.data.data.code,
        });

        setMesas(response.data.data.tables);
      } else {
  
        showModal('info', String.info, String.couldNotLoadTables);
      }
    } catch (error) {

      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadTables = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetchMesas();

      if (response.success) {

        setMesas(response.data);
      } else {
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoading(false);
    }
  };

  // Override handleTablePress for WitnessRecord specific behavior
  const handleTablePress = mesa => {


    // Process the table data to include location information
    const processedMesa = {
      // Table identification
      numero: mesa.tableNumber || mesa.numero || mesa.number || mesa.name || mesa.id || 'N/A',
      codigo: mesa.tableCode || mesa.codigo || mesa.code || mesa.id || 'N/A',
      
      // Location information from locationData or mesa itself
      recinto: locationData?.name || mesa.recinto || mesa.venue || mesa.precinctName || 'N/A',
      colegio: locationData?.name || mesa.colegio || mesa.venue || mesa.precinctName || 'N/A',
      provincia: locationData?.address || mesa.direccion || mesa.address || mesa.provincia || 'N/A',
      
      // Additional location details if available
      zona: locationData?.zone || mesa.zona || mesa.zone || 'N/A',
      distrito: locationData?.district || mesa.distrito || mesa.district || 'N/A',
      
      // Original table data for reference
      originalTableData: mesa,
      locationData: locationData,
    };

    

    try {
      // Navigate directly to WhichIsCorrectScreen with proper parameters
      navigation.navigate(StackNav.WhichIsCorrectScreen, {
        tableData: processedMesa,
        mesa: processedMesa,
        originalTable: mesa,
        locationData: locationData,
        photoUri:
          'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
      });
 
    } catch (error) {

    }
  };

  // Show loading indicator while tables are being loaded
  if (isLoading) {
    return (
      <View
        testID="witnessRecordLoadingContainer"
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator
          testID="witnessRecordLoadingIndicator"
          size={isTablet ? 'large' : 'large'}
          color={colors.primary || '#4F9858'}
        />
        <CText
          testID="witnessRecordLoadingText"
          style={{
            marginTop: getResponsiveSize(12, 15, 18),
            fontSize: getResponsiveSize(14, 16, 18),
            color: '#666',
            textAlign: 'center',
            paddingHorizontal: getResponsiveSize(20, 30, 40),
          }}>
          {String.loadingTables}
        </CText>
      </View>
    );
  }

  return (
    <>
      <BaseSearchTableScreen
        testID="witnessRecordBaseScreen"
        // Header props
        colors={colors}
        onBack={handleBack}
        title={String.searchTable}
        showNotification={true}
        onNotificationPress={handleNotificationPress}
        // Choose table text props
        chooseTableText={String.chooseTablePlease}
        // Search input props
        searchPlaceholder={String.searchTablePlaceholder}
        searchValue={searchText}
        onSearchChange={setSearchText}
        // Location info props
        locationText={String.listBasedOnLocation}
        locationIconColor="#0C5460"
        locationData={locationData}
        // Table list props
        tables={mesas}
        onTablePress={handleTablePress}
        // Navigation props
        onHomePress={handleHomePress}
        onProfilePress={handleProfilePress}
        // Layout props
        showLocationFirst={false} // Search input appears before location bar
        // Styles
        styles={styles}
      />

      {/* Custom Modal */}
      <CustomModal
        testID="witnessRecordModal"
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

export default WitnessRecordScreen;
