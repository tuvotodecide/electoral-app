import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import UniversalHeader from '../../../components/common/UniversalHeader';
import CustomModal from '../../../components/common/CustomModal';
import {moderateScale} from '../../../common/constants';
import {StackNav} from '../../../navigation/NavigationKey';
import {fetchMesas, fetchNearbyMesas} from '../../../data/mockMesas';

export default function BuscarMesa({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState('Ascendente');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingMesas, setIsLoadingMesas] = useState(true);
  const [mesas, setMesas] = useState([]);

  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: 'Aceptar',
  });

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
      setIsLoadingMesas(true);
      console.log('BuscarMesa: Loading mesas...');
      const response = await fetchMesas();

      if (response.success) {
        console.log(
          'BuscarMesa: Mesas loaded successfully:',
          response.data.length,
        );
        setMesas(response.data);
      } else {
        console.error('BuscarMesa: Failed to load mesas');
        showModal('error', 'Error', 'No se pudieron cargar las mesas');
      }
    } catch (error) {
      console.error('BuscarMesa: Error loading mesas:', error);
      showModal('error', 'Error', 'Error al cargar las mesas');
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
    if (sortOrder === 'Ascendente') {
      return a.numero.localeCompare(b.numero);
    } else {
      return b.numero.localeCompare(a.numero);
    }
  });

  const handleSelectMesa = mesa => {
    navigation.navigate(StackNav.DetalleMesa, {mesa});
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'Ascendente' ? 'Descendente' : 'Ascendente');
  };

  const handleNearbyMesas = async () => {
    try {
      setIsLoadingLocation(true);
      console.log('BuscarMesa: Loading nearby mesas...');

      // Simular obtener ubicación (en producción sería con geolocalización real)
      const mockLocation = {latitude: -16.5, longitude: -68.15}; // La Paz, Bolivia

      const response = await fetchNearbyMesas(
        mockLocation.latitude,
        mockLocation.longitude,
      );

      if (response.success) {
        console.log('BuscarMesa: Nearby mesas loaded:', response.data.length);
        setMesas(response.data);
        showModal(
          'success',
          'Éxito',
          `Se encontraron ${response.data.length} mesas cercanas`,
        );
      } else {
        console.error('BuscarMesa: Failed to load nearby mesas');
        showModal('error', 'Error', 'No se pudieron cargar las mesas cercanas');
      }
    } catch (error) {
      console.error('BuscarMesa: Error loading nearby mesas:', error);
      showModal('error', 'Error', 'Error al buscar mesas cercanas');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const renderMesaItem = ({item}) => (
    <TouchableOpacity
      style={localStyle.mesaCard}
      onPress={() => handleSelectMesa(item)}>
      <View style={localStyle.mesaHeader}>
        <CText style={localStyle.mesaTitle} color={colors.textColor}>
          {item.numero}
        </CText>
        <CText style={localStyle.codigoMesaText}>
          Código de mesa: {item.codigo}
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
        title="Buscar mesa"
        showNotification={false}
      />

      {/* Loading indicator for initial data load */}
      {isLoadingMesas ? (
        <View style={localStyle.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
          <CText style={localStyle.loadingText}>Cargando mesas...</CText>
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
                placeholder="Código de mesa"
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
                {isLoadingLocation ? 'Buscando...' : 'Cerca de ti'}
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
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  sortText: {
    color: '#979797',
    fontSize: 15,
    marginHorizontal: 5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1ECF166',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  cercaDeTiText: {
    color: '#0C5460',
    fontSize: 15,
    marginLeft: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mesaCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  mesaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mesaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  codigoMesaText: {
    color: '#979797',
    fontSize: 14,
    fontWeight: '400',
  },
  colegioText: {
    marginTop: 7,
    fontSize: 16,
    color: '#222',
  },
  provinciaText: {
    fontSize: 13,
    color: '#979797',
    fontWeight: '400',
    marginTop: 1,
  },
});
