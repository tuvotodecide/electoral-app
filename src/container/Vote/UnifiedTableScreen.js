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
import Strings from '../../i18n/String';
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

const fetchTablesByLocationId = async locationId => {
  const normalizedLocationId = String(locationId || '').trim();
  if (!normalizedLocationId) return [];

  const encodedLocationId = encodeURIComponent(normalizedLocationId);
  const tablesEndpoint = `${BACKEND_RESULT}/api/v1/geographic/electoral-tables?electoralLocationId=${encodedLocationId}&limit=500`;

  try {
    const { data } = await axios.get(tablesEndpoint, { timeout: 15000 });
    const list = data?.data || data?.tables || data?.data?.tables || [];
    if (Array.isArray(list)) {
      return list;
    }
  } catch {
    // fallback de compatibilidad
  }

  try {
    const { data } = await axios.get(
      `${BACKEND_RESULT}/api/v1/geographic/electoral-locations/${encodedLocationId}/tables`,
      { timeout: 15000 },
    );
    const list = data?.tables || data?.data?.tables || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const UnifiedTableScreen = ({ navigation, route }) => {
  const { locationId, locationData: locFromParams, electionId, electionType } = route?.params || {};
  const [mesas, setMesas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: Strings.accept,
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
  async function loadTablesFromApi(locationId) {
    try {
      setIsLoading(true);
      const list = await fetchTablesByLocationId(locationId);
      setMesas(list);
    } catch (e) {
      // si estás offline o falla, simplemente deja la lista como está (vacía)
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    if (route?.params) {
      setIsLoading(true);
      const loc = route.params.locationData || {};
      setLocationData({
        locationId: route.params.locationId,
        name: loc.name,
        address: loc.address,
        code: loc.code,
        zone: loc.zone,
        district: loc.district,
      });

      const initial = Array.isArray(loc.tables) ? loc.tables : [];
      setMesas(initial);

      if (initial.length === 0) {
        loadTablesFromApi(route.params.locationId);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [route?.params?.locationId]);

  const showModal = (type, title, message, buttonText = Strings.accept) => {
    setModalConfig({ type, title, message, buttonText });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Check if table has actas and navigate to appropriate screen
  const handleTablePress = async mesa => {
    // Process the table data to include location information
    const processedMesa = {
      id: mesa.id || mesa._id || 'N/A',
      numero:
        mesa.tableNumber ||
        mesa.numero ||
        mesa.number ||
        mesa.name ||
        mesa.id ||
        'N/A',
      codigo: mesa.tableCode || mesa.codigo || mesa.code || mesa.id || 'N/A',
      recinto:
        locationData?.name ||
        mesa.recinto ||
        mesa.venue ||
        mesa.precinctName ||
        'N/A',
      colegio:
        locationData?.name ||
        mesa.colegio ||
        mesa.venue ||
        mesa.precinctName ||
        'N/A',
      provincia:
        locationData?.address ||
        mesa.direccion ||
        mesa.address ||
        mesa.provincia ||
        'N/A',
      zona: locationData?.zone || mesa.zona || mesa.zone || 'N/A',
      distrito:
        locationData?.district || mesa.distrito || mesa.district || 'N/A',
      originalTableData: mesa,
      locationData: locationData,
    };

    try {
      const mesaId = processedMesa.id || processedMesa.numero;

      const hasActas = await checkTableHasActas(mesaId);

      if (hasActas) {
        navigation.navigate(StackNav.WhichIsCorrectScreen, {
          tableData: processedMesa,
          mesa: processedMesa,
          originalTable: mesa,
          locationData: locationData,
          photoUri:
            'https://boliviaverifica.bo/wp-content/uploads/2021/03/Captura-1.jpg',
          isFromUnifiedFlow: true,
          electionId,
          electionType,
        });
      } else {
        navigation.navigate(StackNav.TableDetail, {
          tableData: processedMesa,
          mesa: processedMesa,
          originalTable: mesa,
          locationData: locationData,
          isFromUnifiedFlow: true,
          electionId,
          electionType,
        });
      }
    } catch (error) {
      // Default to upload flow if there's an error checking actas
      navigation.navigate(StackNav.TableDetail, {
        tableData: processedMesa,
        mesa: processedMesa,
        originalTable: mesa,
        locationData: locationData,
        isFromUnifiedFlow: true,
        electionId,
        electionType,
      });
    }
  };

  // Function to check if a table has actas
  const checkTableHasActas = async mesaId => {
    try {
      // For string IDs (like "Mesa 1"), try to extract numeric ID
      let numericId = mesaId;
      if (typeof mesaId === 'string' && mesaId.includes('Mesa')) {
        const match = mesaId.match(/\d+/);
        if (match) {
          numericId = parseInt(match[0], 10);
        }
      }

      // Try to fetch actas for this mesa
      const { fetchActasByMesa } = require('../../data/mockMesas');
      const response = await fetchActasByMesa(numericId);

      if (
        response.success &&
        response.data.images &&
        response.data.images.length > 0
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // If there's an error, assume no actas (default to upload flow)
      return false;
    }
  };

  // Show loading indicator while tables are being loaded
  if (isLoading) {
    return (
      <View
        testID="unifiedTableScreenLoadingContainer"
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAFAFA',
        }}>
        <ActivityIndicator
          testID="unifiedTableScreenLoadingIndicator"
          size={isTablet ? 'large' : 'large'}
          color={colors.primary || '#4F9858'}
        />
        <CText
          testID="unifiedTableScreenLoadingText"
          style={{
            marginTop: getResponsiveSize(12, 15, 18),
            fontSize: getResponsiveSize(14, 16, 18),
            color: '#666',
            textAlign: 'center',
            paddingHorizontal: getResponsiveSize(20, 30, 40),
          }}>
          {Strings.loadingTables}
        </CText>
      </View>
    );
  }

  return (
    <>
      <BaseSearchTableScreen
        testID="unifiedTableScreenBaseScreen"
        // Header props
        colors={colors}
        onBack={handleBack}
        title={locationData?.name || Strings.searchTable}
        showNotification={true}
        onNotificationPress={handleNotificationPress}
        // Choose table text props
        chooseTableText={Strings.chooseTablePlease}
        // Search input props
        searchPlaceholder={Strings.searchTablePlaceholder}
        searchValue={searchText}
        onSearchChange={setSearchText}
        // Location info props
        locationText={Strings.listBasedOnLocation}
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
        electionId ={electionId}
      />

      {/* Custom Modal */}
      <CustomModal
        testID="unifiedTableScreenModal"
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
