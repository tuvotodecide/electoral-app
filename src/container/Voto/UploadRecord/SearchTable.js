import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';
import {
  fetchMesas,
  fetchNearbyMesas,
  getMockMesas,
  mapMesasToLegacyFormat,
} from '../../../data/mockMesas';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const getNumColumns = () => {
  if (isTablet) return 2;
  return 1;
};

export default function SearchTable({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState(String.ascending);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingMesas, setIsLoadingMesas] = useState(true);
  const [mesas, setMesas] = useState([]);

  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });

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
      setIsLoadingMesas(true);
      console.log('SearchTable: Loading mesas...');
      const response = await fetchMesas();

      if (response.success) {
        console.log(
          'SearchTable: Mesas loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('SearchTable: Failed to load mesas');
        showModal('error', String.error, String.couldNotLoadTables);
      }
    } catch (error) {
      console.error('SearchTable: Error loading mesas:', error);
      showModal('error', String.error, String.errorLoadingTables);
    } finally {
      setIsLoadingMesas(false);
    }
  };

  const filteredMesas = mesas.filter(
    mesa =>
      mesa.numero.toLowerCase().includes(searchText.toLowerCase()) ||
      mesa.codigo.includes(searchText) ||
      mesa.colegio.toLowerCase().includes(searchText.toLowerCase()),
  );

  const sortedMesas = [...filteredMesas].sort((a, b) => {
    if (sortOrder === String.ascending) {
      return a.numero.localeCompare(b.numero);
    } else {
      return b.numero.localeCompare(a.numero);
    }
  });

  const handleSelectMesa = mesa => {
    navigation.navigate(StackNav.TableDetail, {mesa});
  };

  const toggleSort = () => {
    setSortOrder(
      sortOrder === String.ascending ? String.descending : String.ascending,
    );
  };

  const handleNearbyMesas = async () => {
    try {
      setIsLoadingLocation(true);
      console.log('SearchTable: Loading nearby mesas...');

      // Simulate getting location (in production would use real geolocation)
      const mockLocation = {latitude: -16.5, longitude: -68.15}; // La Paz, Bolivia

      const response = await fetchNearbyMesas(
        mockLocation.latitude,
        mockLocation.longitude,
      );

      if (response.success) {
        console.log('SearchTable: Nearby mesas loaded:', response.data.length);
        setMesas(response.data);
        showModal(
          'success',
          String.success,
          String.foundNearbyTables.replace('{count}', response.data.length),
        );
      } else {
        console.error('SearchTable: Failed to load nearby mesas');
        showModal('error', String.error, String.couldNotLoadNearbyTables);
      }
    } catch (error) {
      console.error('SearchTable: Error loading nearby mesas:', error);
      showModal('error', String.error, String.errorSearchingNearbyTables);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const renderMesaItem = ({item}) => (
    <TouchableOpacity
      style={[localStyle.mesaCard, isTablet && localStyle.mesaCardTablet]}
      onPress={() => handleSelectMesa(item)}>
      <View style={localStyle.mesaHeader}>
        <CText style={localStyle.mesaTitle} color={colors.textColor}>
          {item.numero}
        </CText>
        <CText style={localStyle.codigoMesaText}>
          {String.tableCode} {item.codigo}
        </CText>
      </View>
      <CText style={localStyle.colegioText} color={colors.textColor}>
        {item.colegio}
      </CText>
      <CText style={localStyle.provinciaText}>{item.provincia}</CText>
    </TouchableOpacity>
  );

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
                size={moderateScale(20)}
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
                size={moderateScale(16)}
                color="#979797"
              />
              <CText style={localStyle.sortText}>{sortOrder}</CText>
              <Ionicons
                name="chevron-down-outline"
                size={moderateScale(16)}
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
                  style={{marginRight: 5}}
                />
              ) : (
                <Ionicons
                  name="location-outline"
                  size={moderateScale(16)}
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
            keyExtractor={item => item.id.toString()}
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
    flex: isTablet ? 0.48 : 1, // For tablet two-column layout
  },
  mesaCardTablet: {
    marginHorizontal: getResponsiveSize(4, 8, 12),
    maxWidth: isTablet ? (screenWidth - 80) / 2 : '100%',
  },
  mesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(3, 4, 6),
    flexWrap: 'wrap',
  },
  mesaTitle: {
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  codigoMesaText: {
    color: '#979797',
    fontSize: getResponsiveSize(12, 14, 16),
    fontWeight: '400',
    flexShrink: 1,
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
