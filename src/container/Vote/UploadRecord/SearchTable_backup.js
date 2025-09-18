import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {useSelector} from 'react-redux';

import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import String from '../../../i18n/String';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';
import {
  fetchMesas,
  fetchNearbyMesas,
  getMockMesas,
  mapMesasToLegacyFormat,
} from '../../../data/mockMesas';

export default function SearchTable({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [isLoadingMesas, setIsLoadingMesas] = useState(true);
  const [mesas, setMesas] = useState([]);
  const [locationData, setLocationData] = useState(null);

  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('SearchTable_backup', true);
  // Cargar mesas al montar el componente

  useEffect(() => {
    if (route?.params?.locationId) {
      loadMesasFromApi(route.params.locationId);
    } else {
      loadMesas();
    }
  }, [route?.params?.locationId]);

  const loadMesasFromApi = async locationId => {
    try {
      setIsLoadingMesas(true);

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
          zone: response.data.zone,
          district: response.data.district,
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
          zone: response.data.data.zone,
          district: response.data.data.district,
        });

        setMesas(response.data.data.tables);
      } else {
        showModal('info', String.info, String.couldNotLoadTables);
      }
    } catch (error) {
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoadingMesas(false);
    }
  };

  const showModal = (type, title, message, buttonText = String.accept) => {
    setModalConfig({type, title, message, buttonText});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const loadMesas = async () => {
    try {
      setIsLoadingMesas(true);

      // Obtener locationId si existe en route.params
      const locationId = route?.params?.locationId;
      const response = await fetchMesas(locationId);

      if (response.success) {
        setMesas(response.data);
      } else {
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoadingMesas(false);
    }
  };

  const filteredMesas = mesas.filter(mesa => {
    if (!mesa) return false;

    const searchLower = searchText.toLowerCase();

    // Buscar en número/tableNumber
    const tableNumber = mesa.numero || mesa.tableNumber || mesa.number || '';
    if (tableNumber.toString().toLowerCase().includes(searchLower)) {
      return true;
    }

    // Buscar en código
    const codigo = mesa.codigo || mesa.code || '';
    if (codigo.toString().includes(searchText)) {
      return true;
    }

    // Buscar en colegio/escuela/location
    const location =
      mesa.colegio || mesa.escuela || mesa.location?.name || mesa.school || '';
    if (location.toString().toLowerCase().includes(searchLower)) {
      return true;
    }

    return false;
  });

  const sortedMesas = [...filteredMesas].sort((a, b) => {
    const getTableNumber = mesa => {
      return mesa.numero || mesa.tableNumber || mesa.number || '';
    };

    const aNumber = getTableNumber(a).toString();
    const bNumber = getTableNumber(b).toString();

    if (sortOrder === String.ascending) {
      return aNumber.localeCompare(bNumber);
    } else {
      return bNumber.localeCompare(aNumber);
    }
  });

  const handleSelectMesa = async mesa => {
    // Enrich mesa data with location information
    const enrichedMesa = {
      ...mesa,
      // Add location data for proper display
      recinto: locationData?.name || mesa.recinto || 'N/A',
      direccion: locationData?.address || mesa.direccion || 'N/A',
      codigo: mesa.tableCode || mesa.codigo || mesa.code || 'N/A',
      // Ensure tableNumber is present
      tableNumber: mesa.tableNumber || mesa.numero || mesa.number || 'N/A',
      // Keep original fields for backwards compatibility
      numero: mesa.tableNumber || mesa.numero || mesa.number || 'N/A',
      // Add zone from location data
      zone: locationData?.zone || mesa.zone || 'N/A',
      // Add other location-specific data
      name: locationData?.name || mesa.name || 'N/A',
      address: locationData?.address || mesa.address || 'N/A',
      district: locationData?.district || mesa.district || 'N/A',
    };

    // Get table code for API call
    const tableCode = mesa.tableCode || mesa.codigo || mesa.code;

    if (!tableCode) {
      showModal(
        'error',
        String.error,
        'No se pudo encontrar el código de la mesa',
      );
      return;
    }

    try {
      // Show loading
      setModalVisible(true);
      setModalConfig({
        type: 'info',
        title: 'Verificando...',
        message: 'Consultando actas atestiguadas para esta mesa...',
        buttonText: String.accept,
      });

      // Check if mesa has existing attestations
      const response = await axios.get(
        `http://192.168.1.16:3000/api/v1/mesa/${tableCode}/results`,
      );

      // Close loading modal
      closeModal();

      if (
        response.data &&
        response.data.registros &&
        response.data.registros.length > 0
      ) {
        // Mesa has existing attestations - go directly to WhichIsCorrectScreen

        // Convert API data to format expected by WhichIsCorrectScreen
        const actaImages = response.data.registros.map((record, index) => ({
          id: record.recordId || `record-${index}`,
          uri: record.actaImage,
          recordId: record.recordId,
          tableCode: record.tableCode,
          tableNumber: record.tableNumber,
          partyResults: record.partyResults,
          voteSummaryResults: record.voteSummaryResults,
        }));

        navigation.navigate(StackNav.WhichIsCorrectScreen, {
          tableData: enrichedMesa,
          actaImages: actaImages,
          existingRecords: response.data.registros,
          mesaInfo: response.data.mesa,
          totalRecords: response.data.totalRecords,
          isFromAPI: true,
        });
      } else {
        // No attestations found, go to photo capture

        // Navigate to photo capture screen
        navigation.navigate(StackNav.CameraScreen, {mesa: enrichedMesa});
      }
    } catch (error) {
      // Close loading modal
      closeModal();

      // Check if it's a 404 or mesa not found error
      if (error.response && error.response.status === 404) {
        // Mesa not found, go to photo capture to create new attestation
        navigation.navigate(StackNav.CameraCapture, {mesa: enrichedMesa});
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Handle specific error messages from API
        const errorData = error.response.data;

        if (errorData.message.includes('no encontrada')) {
          // Mesa not found, go to photo capture
          navigation.navigate(StackNav.CameraScreen, {mesa: enrichedMesa});
        } else {
          // Other API error
          showModal(
            'error',
            String.error,
            errorData.message || 'Error al verificar la mesa',
          );
        }
      } else {
        // Network or other error
        showModal(
          'error',
          String.error,
          'Error de conexión al verificar la mesa',
        );
      }
    }
  };

  const toggleSort = () => {
    setSortOrder(
      sortOrder === String.ascending ? String.descending : String.ascending,
    );
  };

  const handleNearbyMesas = async () => {
    try {
      setIsLoadingLocation(true);

      // Simulate getting location (in production would use real geolocation)
      const mockLocation = {latitude: -16.5, longitude: -68.15}; // La Paz, Bolivia

      const response = await fetchNearbyMesas(
        mockLocation.latitude,
        mockLocation.longitude,
      );

      if (response.success) {
        setMesas(response.data);
        showModal(
          'success',
          String.success,
          String.foundNearbyTables.replace('{count}', response.data.length),
        );
      } else {
        showModal('error', String.error, String.couldNotLoadNearbyTables);
      }
    } catch (error) {
      showModal('error', String.error, String.errorSearchingNearbyTables);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const renderMesaItem = ({item}) => {
    const tableNumber = item.tableNumber || item.numero || item.number || 'N/A';
    const codigo = item.tableCode || item.codigo || item.code || 'N/A';

    // Use location data from API response
    const colegio =
      locationData?.name ||
      item.colegio ||
      item.escuela ||
      item.location?.name ||
      item.school ||
      'N/A';
    const provincia =
      locationData?.address ||
      item.provincia ||
      item.province ||
      item.location?.province ||
      'N/A';

    return (
      <TouchableOpacity
        style={[localStyle.mesaCard, isTablet && localStyle.mesaCardTablet]}
        onPress={() => handleSelectMesa(item)}>
        <View style={localStyle.mesaHeader}>
          <CText style={localStyle.mesaTitle} color={colors.textColor}>
            {String.table}{':'} {tableNumber}
          </CText>
          <CText style={localStyle.codigoMesaText}>
            {String.tableCode}{':'} {codigo}
          </CText>
        </View>
        <CText style={localStyle.colegioText} color={colors.textColor}>
          {colegio}
        </CText>
        <CText style={localStyle.provinciaText}>{provincia}</CText>
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView style={localStyle.container}>
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title={String.searchTable}
        showNotification={false}
      />

      {/* Loading indicator for initial data load */}
      {isLoadingMesas ? (
        <View style={localStyle.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
          <CText style={localStyle.loadingText}>{String.loadingTables}</CText>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={localStyle.searchContainer}>
            <View style={localStyle.searchInputContainer}>
              <Ionicons
                name="search-outline"
                size={getResponsiveSize(18, 20, 24)}
                color="#979797"
                style={localStyle.searchIcon}
              />
              <TextInput
                style={localStyle.searchInput}
                placeholder={String.tableCodePlaceholder}
                placeholderTextColor="#979797"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          {/* Filtros */}
          <View style={localStyle.filterContainer}>
            <TouchableOpacity
              style={localStyle.sortButton}
              onPress={toggleSort}>
              <Ionicons
                name="swap-vertical-outline"
                size={getResponsiveSize(14, 16, 18)}
                color="#979797"
              />
              <CText style={localStyle.sortText}>{sortOrder}</CText>
              <Ionicons
                name="chevron-down-outline"
                size={getResponsiveSize(14, 16, 18)}
                color="#979797"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyle.locationButton}
              onPress={handleNearbyMesas}
              disabled={isLoadingLocation}>
              {isLoadingLocation ? (
                <ActivityIndicator
                  size="small"
                  color="#2596be"
                  style={{marginRight: getResponsiveSize(4, 5, 6)}}
                />
              ) : (
                <Ionicons
                  name="location-outline"
                  size={getResponsiveSize(14, 16, 18)}
                  color="#0C5460"
                />
              )}
              <CText style={localStyle.cercaDeTiText}>
                {isLoadingLocation ? String.searching : String.nearYou}
              </CText>
            </TouchableOpacity>
          </View>

          {/* Listado */}
          <FlatList
            data={sortedMesas}
            renderItem={renderMesaItem}
            keyExtractor={(item, index) => {
              return (
                item.id?.toString() ||
                item._id?.toString() ||
                item.codigo?.toString() ||
                item.code?.toString() ||
                index.toString()
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={localStyle.listContainer}
            numColumns={getNumColumns()}
            key={getNumColumns()} // Force re-render when columns change
            columnWrapperStyle={isTablet ? localStyle.row : null}
          />
        </>
      )}

      {/* Custom Modal */}
      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.buttonText}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Gris muy claro
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(30, 50, 70),
  },
  loadingText: {
    marginTop: getResponsiveSize(10, 15, 20),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: getResponsiveSize(16, 20, 32),
    marginBottom: getResponsiveSize(12, 15, 20),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: getResponsiveSize(16, 18, 22),
    paddingHorizontal: getResponsiveSize(10, 12, 16),
    paddingVertical: getResponsiveSize(6, 8, 12),
    backgroundColor: '#FFF',
  },
  searchIcon: {
    marginRight: getResponsiveSize(6, 8, 10),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#222',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  filterContainer: {
    flexDirection: isTablet ? 'row' : isSmallPhone ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(16, 20, 32),
    marginBottom: getResponsiveSize(12, 15, 20),
    gap: isSmallPhone ? 8 : 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: getResponsiveSize(10, 13, 16),
    paddingVertical: getResponsiveSize(6, 7, 10),
    minHeight: getResponsiveSize(36, 40, 48),
  },
  sortText: {
    color: '#979797',
    fontSize: getResponsiveSize(13, 15, 17),
    marginHorizontal: getResponsiveSize(4, 5, 6),
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1ECF166',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(14, 18, 22),
    paddingVertical: getResponsiveSize(6, 7, 10),
    minHeight: getResponsiveSize(36, 40, 48),
  },
  cercaDeTiText: {
    color: '#0C5460',
    fontSize: getResponsiveSize(13, 15, 17),
    marginLeft: getResponsiveSize(4, 5, 6),
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(8, 12, 16),
  },
  listContainer: {
    paddingHorizontal: getResponsiveSize(16, 20, 32),
    paddingBottom: getResponsiveSize(16, 20, 24),
  },
  mesaCard: {
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(12, 18, 24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    flex: isTablet ? (isLandscape ? 0.31 : 0.48) : 1, // For tablet columns
  },
  mesaCardTablet: {
    marginHorizontal: getResponsiveSize(4, 8, 12),
    maxWidth: isTablet
      ? isLandscape
        ? (screenWidth - 120) / 3
        : (screenWidth - 80) / 2
      : '100%',
  },
  mesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(3, 4, 6),
    flexWrap: 'nowrap',
  },
  mesaTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: 'bold',
    color: '#222',
    flexShrink: 0,
    minWidth: getResponsiveSize(80, 100, 120),
  },
  codigoMesaText: {
    color: '#979797',
    fontSize: getResponsiveSize(12, 14, 16),
    fontWeight: '400',
    flexShrink: 1,
    textAlign: 'right',
  },
  colegioText: {
    marginTop: getResponsiveSize(5, 7, 9),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#222',
    lineHeight: getResponsiveSize(18, 20, 24),
  },
  provinciaText: {
    fontSize: getResponsiveSize(11, 13, 15),
    color: '#979797',
    fontWeight: '400',
    marginTop: getResponsiveSize(1, 1, 2),
    lineHeight: getResponsiveSize(14, 16, 18),
  },
});
