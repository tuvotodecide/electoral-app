import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import axios from 'axios';
// import Geolocation from '@react-native-community/geolocation';
import CSafeAreaView from '../../components/common/CSafeAreaView';
import UniversalHeader from '../../components/common/UniversalHeader';
import CText from '../../components/common/CText';
import CustomModal from '../../components/common/CustomModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {StackNav} from '../../navigation/NavigationKey';
import String from '../../i18n/String';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const ElectoralLocationsScreen = () => {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);

  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: String.locationPermissionTitle,
            message: String.locationPermissionMessage,
            buttonNeutral: String.askMeLater,
            buttonNegative: String.cancel,
            buttonPositive: String.ok,
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          showModal(
            'info',
            String.locationPermissionDenied,
            String.locationPermissionMessage,
          );
          loadAllLocations();
        }
      } else {
        getCurrentLocation();
      }
    } catch (error) {
      showModal('error', String.error, String.locationPermissionError);
      loadAllLocations();
    }
  };

  const getCurrentLocation = () => {
    // Geolocation.getCurrentPosition(
    //   position => {
    //
    //     setUserLocation(position.coords);
    //     loadNearbyLocations(position.coords);
    //   },
    //   error => {
    //     showModal('error', String.error, String.locationError);
    //     loadAllLocations();
    //   },
    //   {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    // );
  };

  const loadNearbyLocations = async coords => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://yo-custodio-backend.onrender.com/api/v1/geographic/electoral-locations/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=50`,
      );

      if (response.data && response.data.length > 0) {
        setLocations(response.data);
      } else {
        await loadAllLocations();
      }
    } catch (error) {
      showModal('error', String.error, String.errorFetchingLocations);
      await loadAllLocations();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllLocations = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        'https://yo-custodio-backend.onrender.com/api/v1/geographic/electoral-locations',
      );

      if (response.data) {
        setLocations(response.data);
      } else {
        showModal('error', String.error, String.errorFetchingLocations);
      }
    } catch (error) {
      showModal('error', String.error, String.errorFetchingLocations);
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

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLocationPress = location => {
    navigation.navigate(StackNav.UnifiedTableScreen, {
      locationId: location.id,
      locationData: location,
    });
  };

  const renderLocationItem = ({item}) => (
    <TouchableOpacity
      style={styles.locationCard}
      onPress={() => handleLocationPress(item)}
      activeOpacity={0.7}>
      <View style={styles.locationHeader}>
        <View style={styles.locationIconContainer}>
          <MaterialIcons
            name="location-on"
            size={24}
            color={colors.primary || '#4F9858'}
          />
        </View>
        <View style={styles.locationInfo}>
          <CText style={[styles.locationName, {color: colors.text}]}>
            {item.name}
          </CText>
          <CText
            style={[styles.locationAddress, {color: colors.textSecondary}]}>
            {item.address}
          </CText>
          {item.tablesCount && (
            <CText style={[styles.tablesCount, {color: colors.primary}]}>
              {item.tablesCount} {String.tables}
            </CText>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </View>

      {item.code && (
        <View style={styles.locationCode}>
          <CText style={[styles.codeLabel, {color: colors.textSecondary}]}>
            {String.code}: {item.code}
          </CText>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <CSafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <UniversalHeader
          title={String.electoralLocations}
          onBack={handleBack}
          colors={colors}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary || '#4F9858'} />
          <CText style={[styles.loadingText, {color: colors.textSecondary}]}>
            {userLocation
              ? String.loadingNearbyLocations
              : String.gettingLocation}
          </CText>
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <UniversalHeader
        title={String.electoralLocations}
        onBack={handleBack}
        // colors={colors}
      />

      {userLocation && (
        <View
          style={[
            styles.locationBanner,
            {backgroundColor: colors.primaryLight || '#E8F5E8'},
          ]}>
          <MaterialIcons
            name="near-me"
            size={16}
            color={colors.primary || '#4F9858'}
          />
          <CText style={[styles.bannerText, {color: colors.primary}]}>
            {String.showingNearbyLocations}
          </CText>
        </View>
      )}

      {locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="location-off"
            size={64}
            color={colors.textSecondary}
          />
          <CText style={[styles.emptyTitle, {color: colors.text}]}>
            {String.noLocationsFound}
          </CText>
          <CText style={[styles.emptySubtitle, {color: colors.textSecondary}]}>
            {String.noLocationsFoundSubtitle}
          </CText>
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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
};

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  bannerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  tablesCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationCode: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  codeLabel: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
};

export default ElectoralLocationsScreen;
