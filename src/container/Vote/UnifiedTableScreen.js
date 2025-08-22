import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Dimensions } from 'react-native';
import axios from 'axios';
import BaseSearchTableScreen from '../../components/common/BaseSearchTableScreen';
import CustomModal from '../../components/common/CustomModal';
import CText from '../../components/common/CText';
import { useSearchTableLogic } from '../../hooks/useSearchTableLogic';
import { createSearchTableStyles } from '../../styles/searchTableStyles';
import { fetchMesas } from '../../data/mockMesas';
import { StackNav } from '../../navigation/NavigationKey';
import String from '../../i18n/String';
import { BACKEND_RESULT } from '@env';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const UnifiedTableScreen = ({ navigation, route }) => {
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
  } = useSearchTableLogic();

  const styles = createSearchTableStyles();

  useEffect(() => {
    if (route?.params) {
      console.log("PARAMS", route.params)
      setIsLoading(true);
      setLocationData({
        locationId: route?.params?.locationId,
        name: route?.params?.locationData.name,
        address: route?.params?.locationData.address,
        code: route?.params?.locationData.code,
      });
      setMesas(route?.params?.locationData.tables);
      //loadTablesFromApi(route.params.locationId);
      //setLocationData(route.params.locationData);
      setIsLoading(false);
    } else {
      loadTables();
    }
  }, [route?.params?.locationId]);

  //const loadTablesFromApi = async (locationId) => {
  //  try {
  //    setIsLoading(true);
  //    console.log('UnifiedTableScreen: Loading tables from API for location:', locationId);
  //
  //    const response = await axios.get(
  //      `${BACKEND_RESULT}/api/v1/geographic/electoral-locations/${locationId}/tables`
  //    );
  //    //const response = await axios.get(
  //    //  `http://192.168.1.16:3000/api/v1/geographic/electoral-locations/686e0624eb2961c4b31bdb7d/tables`,
  //    //);
  //    console.log('UnifiedTableScreen: API Response:', response.data);
  //
  //    if (response.data && response.data.tables) {
  //      console.log('UnifiedTableScreen: Tables found:', response.data.tables.length);
  //
  //      // Store location data for TableCard components
  //      setLocationData({
  //        name: response.data.name,
  //        address: response.data.address,
  //        code: response.data.code,
  //      });
  //
  //      setMesas(response.data.tables);
  //    } else if (response.data && response.data.data && response.data.data.tables) {
  //      console.log('UnifiedTableScreen: Tables found in data.data:', response.data.data.tables.length);
  //
  //      // Store location data for TableCard components
  //      setLocationData({
  //        name: response.data.data.name,
  //        address: response.data.data.address,
  //        code: response.data.data.code,
  //      });
  //
  //      setMesas(response.data.data.tables);
  //    } else {
  //      console.log('UnifiedTableScreen: No tables found in response');
  //      showModal('info', String.info, String.couldNotLoadTables);
  //    }
  //  } catch (error) {
  //    console.error('UnifiedTableScreen: Error loading tables from API:', error);
  //    showModal('error', String.error, String.errorLoadingTables);
  //  } finally {
  //    setIsLoading(false);
  //  }
  //};

  const loadTables = async () => {
    try {
      setIsLoading(true);
      console.log('UnifiedTableScreen: Loading tables...');
      const response = await fetchMesas();

      if (response.success) {
        console.log('UnifiedTableScreen: Tables loaded successfully:', response.data.length);
        setMesas(response.data);
      } else {
        console.error('UnifiedTableScreen: Failed to load tables');
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      console.error('UnifiedTableScreen: Error loading tables:', error);
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({ type, title, message, buttonText });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Check if table has actas and navigate to appropriate screen
  const handleTablePress = async (mesa) => {
    console.log('UnifiedTableScreen - handleTablePress called with mesa:', mesa);

    // Process the table data to include location information
    const processedMesa = {
      id: mesa.id || mesa._id || 'N/A',
      numero: mesa.tableNumber || mesa.numero || mesa.number || mesa.name || mesa.id || 'N/A',
      codigo: mesa.tableCode || mesa.codigo || mesa.code || mesa.id || 'N/A',
      recinto: locationData?.name || mesa.recinto || mesa.venue || mesa.precinctName || 'N/A',
      colegio: locationData?.name || mesa.colegio || mesa.venue || mesa.precinctName || 'N/A',
      provincia: locationData?.address || mesa.direccion || mesa.address || mesa.provincia || 'N/A',
      zona: locationData?.zone || mesa.zona || mesa.zone || 'N/A',
      distrito: locationData?.district || mesa.distrito || mesa.district || 'N/A',
      originalTableData: mesa,
      locationData: locationData,
    };

    console.log('UnifiedTableScreen - Processed mesa data:', processedMesa);

    try {
      // Check if this table has any actas
      const mesaId = processedMesa.id || processedMesa.numero;
      console.log('UnifiedTableScreen - Checking actas for mesa ID:', mesaId);

      // Try to get actas for this table
      const hasActas = await checkTableHasActas(mesaId);

      if (hasActas) {
        // Table has actas, go to witness/attestation flow
        console.log('UnifiedTableScreen - Table has actas, navigating to WhichIsCorrectScreen');
        navigation.navigate(StackNav.WhichIsCorrectScreen, {
          tableData: processedMesa,
          mesa: processedMesa,
          originalTable: mesa,
          locationData: locationData,
          photoUri: 'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
          isFromUnifiedFlow: true,
        });
      } else {
        // Table has no actas, go to upload flow
        console.log('UnifiedTableScreen - Table has no actas, navigating to TableDetail');
        navigation.navigate(StackNav.TableDetail, {
          tableData: processedMesa,
          mesa: processedMesa,
          originalTable: mesa,
          locationData: locationData,
          isFromUnifiedFlow: true,
        });
      }
    } catch (error) {
      console.error('UnifiedTableScreen - Error in handleTablePress:', error);
      // Default to upload flow if there's an error checking actas
      navigation.navigate(StackNav.TableDetail, {
        tableData: processedMesa,
        mesa: processedMesa,
        originalTable: mesa,
        locationData: locationData,
        isFromUnifiedFlow: true,
      });
    }
  };

  // Function to check if a table has actas
  const checkTableHasActas = async (mesaId) => {
    try {
      // For string IDs (like "Mesa 1"), try to extract numeric ID
      let numericId = mesaId;
      if (typeof mesaId === 'string' && mesaId.includes('Mesa')) {
        const match = mesaId.match(/\d+/);
        if (match) {
          numericId = parseInt(match[0], 10);
        }
      }

      console.log('UnifiedTableScreen - Checking actas for numeric ID:', numericId);

      // Try to fetch actas for this mesa
      const { fetchActasByMesa } = require('../../data/mockMesas');
      const response = await fetchActasByMesa(numericId);

      if (response.success && response.data.images && response.data.images.length > 0) {
        console.log('UnifiedTableScreen - Found actas:', response.data.images.length);
        return true;
      } else {
        console.log('UnifiedTableScreen - No actas found for this mesa');
        return false;
      }
    } catch (error) {
      console.error('UnifiedTableScreen - Error checking actas:', error);
      // If there's an error, assume no actas (default to upload flow)
      return false;
    }
  };

  // Show loading indicator while tables are being loaded
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
          {String.loadingTables}
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
        title={locationData?.name || String.searchTable}
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

export default UnifiedTableScreen;
