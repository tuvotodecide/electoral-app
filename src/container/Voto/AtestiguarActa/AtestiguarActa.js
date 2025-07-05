import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {StackNav} from '../../../navigation/NavigationKey';
import CText from '../../../components/common/CText'; // Assuming this path is correct for your project
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Import MaterialIcons
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons for the bell icon
import FontAwesome from 'react-native-vector-icons/FontAwesome'; // Import FontAwesome for location icon
import {moderateScale} from '../../../common/constants'; // Assuming this path is correct for your project

const SearchMesaScreen = () => {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme); // Assuming colors are managed by Redux
  const [searchText, setSearchText] = useState('');

  // Dummy data for mesa list
  const mesas = [
    {
      id: '1',
      numero: '1',
      recinto: 'Colegio 23 de marzo',
      direccion: 'Provincia Murillo - La Paz',
      codigo: '1234',
    },
    {
      id: '2',
      numero: '2',
      recinto: 'Colegio 23 de marzo',
      direccion: 'Provincia Murillo - La Paz',
      codigo: '1234',
    },
    {
      id: '3',
      numero: '3',
      recinto: 'Colegio 23 de marzo',
      direccion: 'Provincia Murillo - La Paz',
      codigo: '1234',
    },
    {
      id: '4',
      numero: '4',
      recinto: 'Colegio 23 de marzo',
      direccion: 'Provincia Murillo - La Paz',
      codigo: '1234',
    },
    {
      id: '5',
      numero: '5',
      recinto: 'Colegio 23 de marzo',
      direccion: 'Provincia Murillo - La Paz',
      codigo: '1234',
    },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMesaPress = mesa => {
    console.log('Navegando a CualEsCorrectaScreen con mesa:', mesa.numero); // Debugging log
    // Navega a CualEsCorrectaScreen, pasando los datos de la mesa y un photoUri de ejemplo.
    // Este es el comportamiento solicitado: SearchMesaScreen -> CualEsCorrectaScreen
    navigation.navigate(StackNav.CualEsCorrectaScreen, {
      mesaData: mesa,
      photoUri: 'https://placehold.co/400x200/cccccc/000000?text=Acta+de+Mesa', // URI de foto de ejemplo
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="keyboard-arrow-left"
            size={moderateScale(36)}
            color={colors.black || '#2F2F2F'}
          />
        </TouchableOpacity>
        <CText style={styles.headerTitle}>Buscar Mesa</CText>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.bellIcon}>
          <Ionicons
            name="notifications-outline"
            size={moderateScale(36)}
            color={colors.text || '#2F2F2F'}
          />
        </TouchableOpacity>
      </View>

      {/* Choose Mesa Text */}
      <View style={styles.chooseMesaContainer}>
        <CText style={styles.chooseMesaText}>Elije una mesa por favor:</CText>
      </View>

      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar mesa"
          placeholderTextColor="#868686"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Location Info Bar */}
      <View style={styles.locationInfoBar}>
        <FontAwesome
          name="map-marker" // Location icon
          size={moderateScale(16)}
          color="#459151"
          style={styles.locationIcon}
        />
        <CText style={styles.locationInfoText}>
          La siguiente lista se basa en su ubicacion
        </CText>
      </View>

      {/* Mesa List */}
      <ScrollView style={styles.mesaList} showsVerticalScrollIndicator={false}>
        {mesas.map(mesa => (
          <TouchableOpacity
            key={mesa.id}
            style={styles.mesaCard}
            onPress={() => handleMesaPress(mesa)} // Llama a la función de navegación
          >
            <CText style={styles.mesaCardTitle}>Mesa {mesa.numero}</CText>
            <CText style={styles.mesaCardDetail}>Recinto: {mesa.recinto}</CText>
            <CText style={styles.mesaCardDetail}>
              Direccion: {mesa.direccion}
            </CText>
            <CText style={styles.mesaCardDetail}>
              Codigo de Mesa: {mesa.codigo}
            </CText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="home-outline"
            size={moderateScale(24)}
            color={colors.primary || '#459151'}
          />
          <CText style={styles.navText}>Inicio</CText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="person-outline"
            size={moderateScale(24)}
            color={colors.text || '#868686'}
          />
          <CText style={styles.navText}>Perfil</CText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Light gray background as per image
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#2F2F2F',
    marginLeft: moderateScale(8),
  },
  headerSpacer: {
    flex: 1,
  },
  bellIcon: {
    padding: moderateScale(8),
  },
  chooseMesaContainer: {
    backgroundColor: '#E9EFF1', // Match container background
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  chooseMesaText: {
    fontSize: moderateScale(14),
    color: '#868686',
    fontWeight: '500',
  },
  searchInputContainer: {
    backgroundColor: '#E9EFF1', // Match container background
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  searchInput: {
    height: moderateScale(40),
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(14),
    color: '#2F2F2F',
    elevation: 1, // Subtle shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  locationInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F7', // Light blue background
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  locationIcon: {
    marginRight: moderateScale(8),
  },
  locationInfoText: {
    fontSize: moderateScale(12),
    color: '#459151', // Green text color
    fontWeight: '500',
  },
  mesaList: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
  },
  mesaCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mesaCardTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#2F2F2F',
    marginBottom: moderateScale(4),
  },
  mesaCardDetail: {
    fontSize: moderateScale(14),
    color: '#868686',
    marginBottom: moderateScale(2),
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    paddingVertical: moderateScale(10),
  },
  navItem: {
    alignItems: 'center',
    padding: moderateScale(8),
  },
  navText: {
    fontSize: moderateScale(12),
    color: '#868686',
    marginTop: moderateScale(4),
  },
});

export default SearchMesaScreen;
