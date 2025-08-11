import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import CustomModal from '../../../components/common/CustomModal';
import UniversalHeader from '../../../components/common/UniversalHeader';

import { BACKEND } from '@env';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) {
    return small;
  }
  if (isTablet) {
    return large;
  }
  return medium;
};

const ElectoralLocations = ({ navigation, route }) => {
  const colors = useSelector(state => state.theme.theme);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationRetries, setLocationRetries] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
    buttonText: String.accept,
    onCloseAction: null,
  });
  const [electionStatus, setElectionStatus] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  // Get navigation target from route params
  const { targetScreen } = route.params || {};

  const fetchNearbyLocations = useCallback(async (latitude, longitude) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND}/api/v1/geographic/electoral-locations/nearby?lat=${latitude}&lng=${longitude}&maxDistance=300`,
      );
      // const response = await axios.get(
      //   `http://192.168.1.16:3000/api/v1/geographic/electoral-locations?latitude=-16.5204163&longitude=-68.1260124&maxDistance=300&unit=meters`,
      // );

      if (response.data && response.data.data) {
        setLocations(response.data.data);
      } else {
        showModal('info', String.info, String.noNearbyLocations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      showModal('error', String.error, String.errorFetchingLocations);
    } finally {
      setLoading(false);
      setLoadingLocation(false);
    }
  }, []);

  const formatIsoNoT = (iso) => {
    if (!iso) return '';
    return `${iso}`.replace('T', ' ').replace(/\.\d+Z?$/, ''); // "2025-08-10 18:36:00"
  };

  const getCurrentLocation = useCallback(async (retryCount = 0) => {
    try {
      setLoadingLocation(true);

      // Show retry message if this is a retry attempt
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} for location`);
      }

      // Request location permission on Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: String.locationPermissionTitle || 'Permiso de ubicación',
            message:
              String.locationPermissionMessage ||
              'La aplicación necesita acceso a tu ubicación para mostrar recintos cercanos',
            buttonNeutral: String.askMeLater || 'Preguntar después',
            buttonNegative: String.cancel || 'Cancelar',
            buttonPositive: String.ok || 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          showModal(
            'error',
            String.error || 'Error',
            String.locationPermissionDenied || 'Permiso de ubicación denegado',
          );
          setLoadingLocation(false);
          setLoading(false);
          return;
        }
      }
      //fetchNearbyLocations(-17.3746706, -66.1316081);

      // Get current position
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          console.log('Location obtained:', latitude, longitude);
          setUserLocation({ latitude, longitude });
          fetchNearbyLocations(latitude, longitude);
        },
        error => {
          console.error('Location error:', error);
          showModal(
            'error',
            String.error || 'Error',
            String.locationError || 'Error al obtener la ubicación',
          );
          setLoadingLocation(false);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      console.error('Permission error:', error);
      showModal(
        'error',
        String.error || 'Error',
        String.locationPermissionError ||
        'Error al solicitar permisos de ubicación',
      );
      setLoadingLocation(false);
      setLoading(false);
    }
  }, [fetchNearbyLocations]);

  const fetchElectionStatus = useCallback(async () => {
    try {
      setConfigLoading(true);
      setConfigError(false);
      const response = await axios.get(
        `${BACKEND}/api/v1/elections/config/status`
      );
      if (response.data) {
        setElectionStatus(response.data);
      } else {
        setConfigError(true);
        showModal(
          'error',
          String.error,
          String.electionConfigError,
          String.accept,
          () => navigation.goBack()
        )
      }
    } catch (error) {
      console.error('Error fetching election config:', error);
      setConfigError(true);
      showModal(
        'error',
        String.error,
        String.electionConfigError,
        String.accept,
        () => navigation.goBack()
      )
    } finally {
      setConfigLoading(false);
    }
  }, [navigation])

  useEffect(() => {
    fetchElectionStatus();
  }, [fetchElectionStatus]);


  useEffect(() => {
    if (electionStatus &&
      electionStatus.hasActiveConfig &&
      electionStatus.config.isActive &&
      electionStatus.isVotingPeriod) {
      getCurrentLocation();
    }
  }, [electionStatus, getCurrentLocation]);

  const showModal = (type, title, message, buttonText = String.accept, onCloseAction = null) => {
    setModalConfig({ type, title, message, buttonText, onCloseAction });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (modalConfig.onCloseAction) {
      modalConfig.onCloseAction();
    }
    setModalVisible(false);
  };

  const handleRetryLocation = () => {
    setLocationRetries(0);
    getCurrentLocation();
  };

  const handleLocationPress = location => {
    // Special handling for AnnounceCount - it should go to its own screen
    if (targetScreen === 'AnnounceCount') {
      navigation.navigate(StackNav.SearchCountTable, {
        locationId: location._id,
        locationData: location,
      });
    } else if (targetScreen === 'UnifiedParticipation') {
      // Navigate to unified participation screen
      navigation.navigate(StackNav.UnifiedParticipationScreen, {
        locationId: location._id,
        locationData: location,
      });
    } else {
      // Use unified table screen for upload and witness flows
      navigation.navigate(StackNav.UnifiedTableScreen, {
        locationId: location._id,
        locationData: location,
        targetScreen: targetScreen, // Pass the target screen for reference
      });
    }
  };

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.locationCard, isTablet && styles.locationCardTablet]}
      onPress={() => handleLocationPress(item)}
      activeOpacity={0.8}>
      <View style={styles.locationHeader}>
        <View style={styles.locationTitleContainer}>
          <CText style={styles.locationName} numberOfLines={2}>
            {item.name}
          </CText>
          <CText style={styles.locationCode}>
            {String.code}: {item.code}
          </CText>
        </View>
        <View style={styles.distanceContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <CText style={styles.distanceText}>{item.distance}m</CText>
        </View>
      </View>

      <CText style={styles.locationAddress} numberOfLines={2}>
        {item.address}
      </CText>

      <View style={styles.locationDetails}>
        <CText style={styles.locationZone}>
          {item.zone} - {item.district}
        </CText>
        <View style={styles.tablesContainer}>
          <Ionicons name="grid-outline" size={16} color="#4F9858" />
          <CText style={styles.tablesCount}>
            {item.tableCount} {String.tables}
          </CText>
        </View>
      </View>

      <View style={styles.hierarchyContainer}>
        <CText style={styles.hierarchyText}>
          {item.electoralSeat?.municipality?.province?.department?.name} →{' '}
          {item.electoralSeat?.municipality?.province?.name} →{' '}
          {item.electoralSeat?.municipality?.name} → {item.electoralSeat?.name}
        </CText>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color="#ccc" />
      <CText style={styles.emptyTitle}>{String.noLocationsFound}</CText>
      <CText style={styles.emptySubtitle}>
        {String.noLocationsFoundSubtitle}
      </CText>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetryLocation}>
        <CText style={styles.retryButtonText}>{String.retry}</CText>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (configLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F9858" />
          <CText style={styles.loadingText}>
            {String.loadingElectionConfig}
          </CText>
        </View>
      );
    }

    if (configError) {
      return null;
    }

    // Caso 1: Sin configuración electoral activa
    if (!electionStatus || !electionStatus.hasActiveConfig) {
      return (
        <View style={styles.inactiveContainer}>
          <Ionicons name="warning-outline" size={64} color="#ccc" />
          <CText style={styles.inactiveTitle}>{String.noActiveElection}</CText>
          <CText style={styles.inactiveSubtitle}>
            {String.noActiveElectionSubtitle}
          </CText>
        </View>
      );
    }

    // Caso 2: Configuración inactiva
    if (!electionStatus.config.isActive) {
      return (
        <View style={styles.inactiveContainer}>
          <Ionicons name="warning-outline" size={64} color="#ccc" />
          <CText style={styles.inactiveTitle}>{String.electionInactive}</CText>
          <CText style={styles.inactiveSubtitle}>
            {String.electionInactiveSubtitle}
          </CText>
        </View>
      );
    }

    // Caso 3: Fuera del periodo de votación
    if (!electionStatus.isVotingPeriod) {
      return (
        <View style={styles.inactiveContainer}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <CText style={styles.inactiveTitle}>{String.outOfVotingPeriod}</CText>

          <View style={styles.timeContainer}>
            <Ionicons name="time" size={24} color="#666" />
            <CText style={styles.timeText}>
              {String.currentTime}: {formatIsoNoT(electionStatus.currentTimeBolivia)}
            </CText>
          </View>

          <CText style={styles.inactiveSubtitle}>
            {String.outOfVotingPeriodSubtitle}
          </CText>

          <CText style={styles.votingPeriodText}>
            {String.votingPeriod}: {formatIsoNoT(electionStatus.config.votingStartDateBolivia)} - {formatIsoNoT(electionStatus.config.votingEndDateBolivia)}
          </CText>
        </View>
      );
    }

    // Caso 4: Periodo de votación activo
    return (
      <>
        {loadingLocation && (
          <View style={styles.loadingLocationContainer}>
            <ActivityIndicator size="small" color="#4F9858" />
            <CText style={styles.loadingLocationText}>
              {locationRetries > 0
                ? `${String.retryingLocation} (${locationRetries}/2)`
                : String.gettingLocation}
            </CText>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F9858" />
            <CText style={styles.loadingText}>
              {String.loadingNearbyLocations}
            </CText>
          </View>
        ) : (
          <>
            {userLocation && (
              <View style={styles.locationInfoContainer}>
                <Ionicons name="location-sharp" size={20} color="#4F9858" />
                <CText style={styles.locationInfoText}>
                  {String.showingNearbyLocations}
                </CText>
              </View>
            )}

            <FlatList
              data={locations}
              renderItem={renderLocationItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              numColumns={isTablet ? 2 : 1}
              columnWrapperStyle={isTablet ? styles.row : null}
            />
          </>
        )}
      </>
    );
  };

  return (
    <CSafeAreaView style={styles.container}>
      {/* <CHeader
        title={String.electoralLocations}
        onBack={() => navigation.goBack()}
        // color={colors.white}
      /> */}
      <UniversalHeader
        title={String.electoralLocations}
        onBack={() => navigation.goBack()}
      />

      {renderContent()}

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
    backgroundColor: '#FAFAFA',
  },
  loadingLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(8, 10, 12),
    backgroundColor: '#E8F5E9',
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
  loadingLocationText: {
    marginLeft: getResponsiveSize(8, 10, 12),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4F9858',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(40, 50, 60),
  },
  loadingText: {
    marginTop: getResponsiveSize(16, 20, 24),
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#666',
    textAlign: 'center',
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12, 15, 18),
    backgroundColor: '#F0F8FF',
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginTop: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
  locationInfoText: {
    marginLeft: getResponsiveSize(8, 10, 12),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#0C5460',
  },
  listContainer: {
    padding: getResponsiveSize(16, 20, 24),
  },
  row: {
    justifyContent: 'space-between',
  },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  locationCardTablet: {
    flex: 0.48,
    marginHorizontal: getResponsiveSize(4, 6, 8),
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  locationTitleContainer: {
    flex: 1,
    paddingRight: getResponsiveSize(8, 10, 12),
  },
  locationName: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(4, 5, 6),
  },
  locationCode: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 5, 6),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  distanceText: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
    marginLeft: getResponsiveSize(4, 5, 6),
  },
  locationAddress: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#444',
    marginBottom: getResponsiveSize(8, 10, 12),
    lineHeight: getResponsiveSize(18, 20, 22),
  },
  locationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  locationZone: {
    fontSize: getResponsiveSize(13, 15, 17),
    color: '#666',
    flex: 1,
  },
  tablesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 5, 6),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  tablesCount: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#4F9858',
    marginLeft: getResponsiveSize(4, 5, 6),
    fontWeight: '600',
  },
  hierarchyContainer: {
    paddingTop: getResponsiveSize(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  hierarchyText: {
    fontSize: getResponsiveSize(11, 13, 15),
    color: '#888',
    lineHeight: getResponsiveSize(16, 18, 20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 30, 40),
  },
  emptyTitle: {
    fontSize: getResponsiveSize(18, 20, 22),
    fontWeight: 'bold',
    color: '#333',
    marginTop: getResponsiveSize(16, 20, 24),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 22, 24),
  },
  retryButton: {
    backgroundColor: '#4F9858',
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderRadius: getResponsiveSize(8, 10, 12),
    marginTop: getResponsiveSize(16, 20, 24),
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
  },

  inactiveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 30, 40),
  },
  inactiveTitle: {
    fontSize: getResponsiveSize(18, 20, 22),
    fontWeight: 'bold',
    color: '#333',
    marginTop: getResponsiveSize(16, 20, 24),
    textAlign: 'center',
  },
  inactiveSubtitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 22, 24),
    paddingHorizontal: getResponsiveSize(20, 30, 40),
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: getResponsiveSize(12, 16, 20),
    backgroundColor: '#f5f5f5',
    padding: getResponsiveSize(10, 12, 14),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
  timeText: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#444',
    marginLeft: getResponsiveSize(8, 10, 12),
  },
  votingPeriodText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#4F9858',
    marginTop: getResponsiveSize(12, 16, 20),
    textAlign: 'center',
  },

};

export default ElectoralLocations;
