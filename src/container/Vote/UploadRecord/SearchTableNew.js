import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {useSelector} from 'react-redux';
import {StyleSheet} from 'react-native';

import BaseSearchTableScreen from '../../../components/common/BaseSearchTableScreen';
import String from '../../../i18n/String';
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
        setMesas([]);
      }
    } catch (error) {
      setMesas([]);
    } finally {
      setIsLoadingMesas(false);
    }
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
        setMesas([]);
      }
    } catch (error) {
      setMesas([]);
    } finally {
      setIsLoadingMesas(false);
    }
  };

  // Filter mesas based on search text
  const filteredMesas = mesas.filter(mesa => {
    if (!mesa || !searchText) return true;

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

  if (isLoadingMesas) {
    return (
      <BaseSearchTableScreen
        colors={colors}
        onBack={() => navigation.goBack()}
        title={String.searchTable}
        chooseTableText={String.chooseTableText}
        searchPlaceholder={String.tableCodePlaceholder}
        searchValue={searchText}
        onSearchChange={setSearchText}
        tables={[]}
        enableAutoVerification={true}
        apiEndpoint="http://192.168.1.16:3000/api/v1/mesa"
        locationData={locationData}
        styles={localStyle}
      />
    );
  }

  return (
    <BaseSearchTableScreen
      colors={colors}
      onBack={() => navigation.goBack()}
      title={String.searchTable}
      chooseTableText={String.chooseTableText}
      searchPlaceholder={String.tableCodePlaceholder}
      searchValue={searchText}
      onSearchChange={setSearchText}
      tables={filteredMesas}
      enableAutoVerification={true}
      apiEndpoint="http://192.168.1.16:3000/api/v1/mesa"
      locationData={locationData}
      styles={localStyle}
    />
  );
}

const localStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
});
