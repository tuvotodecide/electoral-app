import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View, Dimensions} from 'react-native';
import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import CustomModal from '../../../components/common/CustomModal';
import CText from '../../../components/common/CText';
import {useSearchTableLogic} from '../../../hooks/useSearchTableLogic';
import {createSearchTableStyles} from '../../../styles/searchTableStyles';
import {fetchMesasConteo} from '../../../data/mockMesas';
import {StackNav} from '../../../navigation/NavigationKey';
import String from '../../../i18n/String';
import axios from 'axios';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const SearchCountTable = ({navigation, route}) => {
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState(null);
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
    handleTablePress: originalHandleTablePress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  } = useSearchTableLogic(StackNav.CountTableDetail);

  // Custom handleTablePress that processes table data with location info
  const handleTablePress = (table) => {
    console.log('SearchCountTable: Processing table press for:', table);
    
    // Process the table data to include location information
    const processedMesa = {
      // Table identification
      numero: table.tableNumber || table.numero || table.number || table.name || table.id || 'N/A',
      codigo: table.tableCode || table.codigo || table.code || table.id || 'N/A',
      
      // Location information from locationData or table itself
      recinto: locationData?.name || table.recinto || table.venue || table.precinctName || 'N/A',
      colegio: locationData?.name || table.colegio || table.venue || table.precinctName || 'N/A',
      provincia: locationData?.address || table.direccion || table.address || table.provincia || 'N/A',
      
      // Additional location details if available
      zona: locationData?.zone || table.zona || table.zone || 'N/A',
      distrito: locationData?.district || table.distrito || table.district || 'N/A',
      
      // Original table data for reference
      originalTableData: table,
      locationData: locationData,
    };

    console.log('SearchCountTable: Processed mesa data:', processedMesa);
    
    // Navigate with both processed mesa and original table
    originalHandleTablePress({
      table: processedMesa,
      mesa: processedMesa,
      originalTable: table,
      locationData: locationData,
    });
  };

  const styles = createSearchTableStyles();

  // Load tables when component mounts
  useEffect(() => {
    const locationId = route?.params?.locationId;
    console.log('SearchCountTable: useEffect triggered with locationId:', locationId);
    
    if (locationId) {
      console.log('SearchCountTable: Loading from API with locationId:', locationId);
      loadTablesFromApi(locationId);
    } else {
      console.log('SearchCountTable: No locationId, loading from mock data');
      loadTables();
    }
  }, [route?.params?.locationId]);

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

  const loadTablesFromApi = async locationId => {
    try {
      setIsLoading(true);
      console.log(
        'SearchCountTable: Loading tables from API for location:',
        locationId,
      );
      // const response = await axios.get(
      //   `https://yo-custodio-backend.onrender.com/api/v1/geographic/electoral-locations/${locationId}/tables`,
      // );
      const response = await axios.get(
        `http://192.168.1.16:3000/api/v1/geographic/electoral-locations/686e0624eb2961c4b31bdb7d/tables`,
      );
      console.log('SearchCountTable - API Response structure:', response.data);

      if (response.data && response.data.tables && response.data.tables.length > 0) {
        console.log('SearchCountTable - Tables found:', response.data.tables.length);
        console.log(
          'SearchCountTable - First table structure:',
          response.data.tables[0],
        );
        console.log(
          'SearchCountTable - Complete first table JSON:',
          JSON.stringify(response.data.tables[0], null, 2),
        );
        console.log('SearchCountTable - Location data (name, address):', {
          name: response.data.name,
          address: response.data.address,
        });

        // Store location data for TableCard components
        setLocationData({
          name: response.data.name,
          address: response.data.address,
          code: response.data.code,
          zone: response.data.zone,
          district: response.data.district,
        });

        setMesas(response.data.tables);
      } else if (
        response.data &&
        response.data.data &&
        response.data.data.tables &&
        response.data.data.tables.length > 0
      ) {
        console.log(
          'SearchCountTable - Tables found in data.data:',
          response.data.data.tables.length,
        );
        console.log(
          'SearchCountTable - First table in data.data structure:',
          response.data.data.tables[0],
        );
        console.log(
          'SearchCountTable - Complete first table JSON in data.data:',
          JSON.stringify(response.data.data.tables[0], null, 2),
        );

        // Store location data for TableCard components
        setLocationData({
          name: response.data.data.name,
          address: response.data.data.address,
          code: response.data.data.code,
          zone: response.data.data.zone,
          district: response.data.data.district,
        });

        setMesas(response.data.data.tables);
      } else {
        console.log('SearchCountTable: No tables found in API response, falling back to mock data');
        // Fallback to mock data when API has no tables
        const mockResponse = await fetchMesasConteo(locationId);
        if (mockResponse.success && mockResponse.data.length > 0) {
          console.log('SearchCountTable: Mock data fallback successful:', mockResponse.data.length);
          setMesas(mockResponse.data);
          // Set location data from route params if available
          const locationInfo = route?.params?.locationData;
          if (locationInfo) {
            setLocationData(locationInfo);
          }
        } else {
          console.log('SearchCountTable: No tables found in API or mock data');
          showModal('info', String.info, String.couldNotLoadCountTables);
        }
      }
    } catch (error) {
      console.error('SearchCountTable: Error loading tables from API:', error);
      console.log('SearchCountTable: API failed, trying mock data fallback');
      
      // Fallback to mock data when API fails
      try {
        const mockResponse = await fetchMesasConteo(locationId);
        if (mockResponse.success && mockResponse.data.length > 0) {
          console.log('SearchCountTable: Mock data fallback after API error successful:', mockResponse.data.length);
          setMesas(mockResponse.data);
          // Set location data from route params if available
          const locationInfo = route?.params?.locationData;
          if (locationInfo) {
            setLocationData(locationInfo);
          }
        } else {
          showModal('error', String.errorTitle, String.errorLoadingCountTables);
        }
      } catch (mockError) {
        console.error('SearchCountTable: Mock data fallback also failed:', mockError);
        showModal('error', String.errorTitle, String.errorLoadingCountTables);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      setIsLoading(true);
      console.log('SearchCountTable: Loading count tables...');

      // Obtener locationId del route.params si existe
      const locationId = route?.params?.locationId;
      const locationInfo = route?.params?.locationData;

      // Si tenemos datos de ubicación, guardarlos
      if (locationInfo) {
        console.log('SearchCountTable: Setting location data:', locationInfo);
        setLocationData(locationInfo);
      }

      const response = await fetchMesasConteo(locationId);

      if (response.success) {
        console.log(
          'SearchCountTable: Count tables loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('SearchCountTable: Failed to load count tables');
        showModal('error', String.errorTitle, String.couldNotLoadCountTables);
      }
    } catch (error) {
      console.error('SearchCountTable: Error loading count tables:', error);
      showModal('error', String.errorTitle, String.errorLoadingCountTables);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while tables are loading
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator
          size={isTablet ? 'large' : 'large'}
          color={colors.primary || '#4F9858'}
        />
        <CText
          style={{
            marginTop: getResponsiveSize(12, 15, 18),
            fontSize: getResponsiveSize(14, 16, 18),
            color: '#666',
            textAlign: 'center',
            paddingHorizontal: getResponsiveSize(20, 30, 40),
          }}>
          {String.loadingCountTables}
        </CText>
      </View>
    );
  }

  return (
    <>
      <BaseSearchTableScreen
        // Header props
        colors={colors}
        onBack={handleBack}
        title={String.searchTableForCount}
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
        showLocationFirst={true} // Location bar appears before search input
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
