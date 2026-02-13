import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Dimensions,
  Linking,
  TextInput,
  Animated,
  Easing,
  AppState,
} from 'react-native';
import { useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import i18nString from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import CustomModal from '../../../components/common/CustomModal';
import UniversalHeader from '../../../components/common/UniversalHeader';
import NetInfo from '@react-native-community/netinfo';
import { BACKEND_RESULT } from '@env';
import { isStateEffectivelyOnline, NET_POLICIES } from '../../../utils/networkQuality';

import { getVotePlace } from '../../../utils/offlineQueue';

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
  const userData = useSelector(state => state.wallet.payload);
  const dni = userData?.vc?.credentialSubject?.governmentIdentifier;
  const [offline, setOffline] = useState(false);
  const [cachedVotePlace, setCachedVotePlace] = useState(null);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
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
    buttonText: i18nString.accept,
    onCloseAction: null,
  });
  const [electionStatus, setElectionStatus] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState([]);
  const pendingPermissionFromSettings = useRef(false);

  // Get navigation target from route params
  const { targetScreen, electionId, electionType } = route.params || {};
  const filterLocations = text => {
    setSearchTerm(text);

    if (!text) {
      setFilteredLocations(locations);
      return;
    }

    const lowerText = text.toLowerCase();

    const results = locations.filter(location => {
      return (
        location.name?.toLowerCase().includes(lowerText) ||
        location.code?.toLowerCase().includes(lowerText) ||
        location.address?.toLowerCase().includes(lowerText) ||
        location.zone?.toLowerCase().includes(lowerText) ||
        location.district?.toLowerCase().includes(lowerText) ||
        location.electoralSeat?.name?.toLowerCase().includes(lowerText) ||
        location.electoralSeat?.municipality?.name
          ?.toLowerCase()
          .includes(lowerText) ||
        location.electoralSeat?.municipality?.province?.name
          ?.toLowerCase()
          .includes(lowerText) ||
        location.electoralSeat?.municipality?.province?.department?.name
          ?.toLowerCase()
          .includes(lowerText)
      );
    });

    setFilteredLocations(results);
  };

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Nombre del recinto"
        placeholderTextColor="#888"
        value={searchTerm}
        onChangeText={filterLocations}
      />
      {searchTerm ? (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setSearchTerm('');
            setFilteredLocations(locations);
          }}>
          <Ionicons name="close-circle" size={20} color="#888" />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
      )}
    </View>
  );

  const highlightText = (text, highlight) => {
    if (!highlight || !text) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <CText key={index} style={styles.highlightedText}>
          {part}
        </CText>
      ) : (
        part
      ),
    );
  };

  const fetchNearbyLocations = useCallback(async (latitude, longitude) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_RESULT}/api/v1/geographic/electoral-locations/nearby?lat=${latitude}&lng=${longitude}&maxDistance=500`,
        //`${BACKEND_RESULT}/api/v1/geographic/electoral-locations/nearby?lat=-16.4940642&lng=-68.1598532&maxDistance=10000`,
        { timeout: 15000 }, // 10 segundos timeout
      );
      if (response.data && response.data.data) {
        setLocations(response.data.data);
      } else {
        showModal('info', i18nString.info, i18nString.noNearbyLocations);
      }
    } catch (error) {
      let errorMessage = i18nString.errorFetchingLocations;
      if (error.code === 'ECONNABORTED') {
        errorMessage = i18nString.connectionTimeout;
      } else if (error.response) {
        errorMessage = `${i18nString.serverError} (${error.response.status})`;
      }
      showModal('error', i18nString.error, errorMessage);
    } finally {
      setLoading(false);
      setLoadingLocation(false);
    }
  }, []);

  const formatIsoNoT = iso => {
    if (!iso) return '';
    return `${iso}`.replace('T', ' ').replace(/\.\d+Z?$/, ''); // "2025-08-10 18:36:00"
  };

  const formatDate = isoDate => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const formatTime = isoDate => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openLocationSettings = () => {
    setModalVisible(false);
    pendingPermissionFromSettings.current = true;
    if (Platform.OS === 'android') {
      // Intenta abrir configuración de ubicación del sistema
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(
        () => {
          // Fallback si falla
          Linking.openSettings();
        },
      );
    } else {
      // Para iOS
      Linking.openURL('App-Prefs:Privacy&path=LOCATION').catch(() =>
        Linking.openSettings(),
      );
    }
  };

  const getCurrentLocation = useCallback(
    async (retryCount = 0, useHighAccuracy = true) => {
      try {
        setLoadingLocation(true);
        setLocationRetries(retryCount);

        // Mostrar mensaje de reintento si corresponde
        if (retryCount > 0) {
        }

        // Pedir permisos en Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title:
                i18nString.locationPermissionTitle || 'Permiso de ubicación',
              message:
                i18nString.locationPermissionMessage ||
                'La aplicación necesita acceso a tu ubicación para mostrar recintos cercanos',
              buttonNeutral: i18nString.askMeLater || 'Preguntar después',
              buttonNegative: i18nString.cancel || 'Cancelar',
              buttonPositive: i18nString.ok || 'OK',
            },
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            showModal(
              'settings',
              i18nString.locationPermissionRequired,
              i18nString.locationPermissionDeniedMessage,
              i18nString.openSettings,
              openLocationSettings,
              i18nString.cancel,
              closeModal,
            );
            setLoadingLocation(false);
            return;
          }
        } else {
          // iOS
          const status = await Geolocation.requestAuthorization('whenInUse');
          if (status !== 'granted') {
            showModal(
              'settings',
              i18nString.locationPermissionRequired,
              i18nString.locationPermissionDeniedMessage,
              i18nString.openSettings,
              () => {
                pendingPermissionFromSettings.current = true;
                openLocationSettings();
              },
              i18nString.cancel,
              closeModal,
            );
            setLoadingLocation(false);
            return;
          }
        }

        // Obtener ubicación
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;

            setUserLocation({ latitude, longitude });
            fetchNearbyLocations(latitude, longitude);
          },
          error => {
            // Fallback: si falla con highAccuracy, intentamos de nuevo con lowAccuracy
            if (useHighAccuracy && (error.code === 2 || error.code === 3)) {
              getCurrentLocation(retryCount + 1, false);
              return;
            }

            // Manejo de errores final
            let errorMessage = i18nString.locationError;
            let modalTitle = i18nString.error;
            let action = null;

            if (error.code === 1) {
              // PERMISSION_DENIED
              errorMessage = i18nString.locationPermissionDeniedMessage;
              modalTitle = i18nString.locationPermissionRequired;
              action = openLocationSettings;
            } else if (error.code === 2 || error.code === 3) {
              // POSITION_UNAVAILABLE o TIMEOUT
              errorMessage = i18nString.locationDisabledMessage;
              modalTitle = i18nString.locationRequired;
              action = openLocationSettings;
            }

            showModal(
              'settings',
              modalTitle,
              errorMessage,
              i18nString.openSettings,
              action,
              i18nString.cancel,
              closeModal,
            );

            setLoadingLocation(false);
            setLoading(false);
          },
          {
            enableHighAccuracy: useHighAccuracy,
            timeout: useHighAccuracy ? 15000 : 30000, // menos estricto en fallback
            maximumAge: useHighAccuracy ? 10000 : 60000, // permite cache más viejo
          },
        );
      } catch (error) {
        showModal(
          'error',
          i18nString.error,
          i18nString.locationPermissionError,
        );
        setLoadingLocation(false);
        setLoading(false);
      }
    },
    [fetchNearbyLocations],
  );
  useEffect(() => {
    const init = async () => {
      const net = await NetInfo.fetch();
      const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
      setOffline(!online);
      if (!online) {
        setConfigLoading(false);
        if (dni) {
          const cached = await getVotePlace(dni);
          setCachedVotePlace(cached);
          if (
            route?.params?.targetScreen === 'UnifiedParticipation' &&
            cached?.location?._id
          ) {
            navigation.replace(StackNav.UnifiedParticipationScreen, {
              locationId: cached.location._id,
              locationData: cached.location,
              fromCache: true,
              offline: true,
            });
            return;
          }
        }
      }
    };
    init();
  }, [dni]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active' && pendingPermissionFromSettings.current) {
        pendingPermissionFromSettings.current = false;
        try {
          if (Platform.OS === 'android') {
            const ok = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            if (ok) {
              setModalVisible(false);
              getCurrentLocation(0, true);
            } else {
              showModal(
                'settings',
                i18nString.locationPermissionRequired,
                i18nString.locationPermissionDeniedMessage,
                i18nString.openSettings,
                openLocationSettings,
                i18nString.cancel,
                closeModal,
              );
            }
          } else {
            const status = await Geolocation.requestAuthorization('whenInUse');
            if (status === 'granted') {
              setModalVisible(false);
              getCurrentLocation(0, true);
            } else {
              showModal(
                'settings',
                i18nString.locationPermissionRequired,
                i18nString.locationPermissionDeniedMessage,
                i18nString.openSettings,
                openLocationSettings,
                i18nString.cancel,
                closeModal,
              );
            }
          }
        } catch (e) { }
      }
    });
    return () => sub.remove();
  }, [getCurrentLocation]);

  const fetchElectionStatus = useCallback(async () => {
    try {
      setConfigLoading(true);
      setConfigError(false);

      const response = await axios.get(
        `${BACKEND_RESULT}/api/v1/elections/config/status`,
        { timeout: 15000 },
      );

      const raw = response.data;

      // 1) elegir la elección correcta
      const elections = raw?.elections || [];
      const selected =
        (electionId && elections.find(e => e.id === electionId)) ||
        (electionType && elections.find(e => e.type === electionType)) ||
        elections[0] ||
        null;

      // 2) normalizar a lo que tu UI espera
      const normalized = {
        hasActiveConfig: !!selected,                 // <- tu UI usa singular
        currentTimeBolivia: raw?.currentTimeBolivia, // <- ya lo tienes
        config: selected,                            // <- tu UI espera config
        isVotingPeriod: !!selected?.isVotingPeriod,  // <- tu UI lo usa en root
        isResultsPeriod: !!selected?.isResultsPeriod,
        elections,                                   // opcional, por si lo necesitas
      };

      setElectionStatus(normalized);
    } catch (error) {
      const net = await NetInfo.fetch();
      const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
      setConfigError(true);

      let errorMessage = i18nString.electionConfigError;
      if (error.code === 'ECONNABORTED') errorMessage = i18nString.connectionTimeout;
      else if (error.response) errorMessage = `${i18nString.serverError} (${error.response.status})`;

      if (online) {
        showModal(
          'error',
          i18nString.error,
          errorMessage,
          i18nString.accept,
          () => navigation.goBack(),
        );
      } else {
        setConfigLoading(false);
      }
    } finally {
      setConfigLoading(false);
    }
  }, [navigation, electionId, electionType]);

  useEffect(() => {
    if (!offline) {
      fetchElectionStatus();
    } else {
      setConfigLoading(false);
    }
  }, [offline, fetchElectionStatus]);

  useEffect(() => {
    if (
      electionStatus &&
      electionStatus.hasActiveConfig &&
      electionStatus.config.isActive &&
      electionStatus.isVotingPeriod &&
      !offline
    ) {
      getCurrentLocation();
    }
  }, [electionStatus, getCurrentLocation, offline]);
  useEffect(() => {
    setFilteredLocations(locations);
  }, [locations]);

  const showModal = (
    type,
    title,
    message,
    primaryButtonText = i18nString.accept,
    onPrimaryAction = null,
    secondaryButtonText = null,
    onSecondaryAction = null,
  ) => {
    setModalConfig({
      type,
      title,
      message,
      primaryButtonText,
      onPrimaryAction,
      secondaryButtonText,
      onSecondaryAction,
    });
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
    getCurrentLocation(0, true);
  };

  const handleLocationPress = location => {
    // Solo permitir navegar si estamos en periodo de votación activo
    if (
      electionStatus &&
      electionStatus.hasActiveConfig &&
      electionStatus.config.isActive &&
      electionStatus.isVotingPeriod
    ) {
      if (targetScreen === 'AnnounceCount') {
        navigation.navigate(StackNav.SearchCountTable, {
          locationId: location._id,
          locationData: location,

          electionId,
          electionType,
        });
      } else if (targetScreen === 'UnifiedParticipation') {
        navigation.navigate(StackNav.UnifiedParticipationScreen, {
          locationId: location._id,
          locationData: location, electionId,
          electionType,
        });
      } else {
        navigation.navigate(StackNav.UnifiedTableScreen, {
          locationId: location._id,
          locationData: location,
          targetScreen: targetScreen,
          electionId,
          electionType,
        });
      }
    } else {
      showModal(
        'error',
        i18nString.error,
        i18nString.votingNotActive,
        i18nString.accept,
      );
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
            {highlightText(item.name, searchTerm)}
          </CText>
        </View>
        <View style={styles.locationDetails}>
          <View style={styles.tablesContainer}>
            <Ionicons name="grid-outline" size={16} color="#4F9858" />
            <CText style={styles.tablesCount}>
              {item.tableCount} {i18nString.tables}
            </CText>
          </View>
        </View>
      </View>

      <CText style={styles.locationAddress} numberOfLines={2}>
        {highlightText(item.address, searchTerm)}
      </CText>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color="#ccc" />
      <CText style={styles.emptyTitle}>{i18nString.noLocationsFound}</CText>
      <CText style={styles.emptySubtitle}>
        {i18nString.noLocationsFoundSubtitle}
      </CText>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetryLocation}>
        <CText style={styles.retryButtonText}>{i18nString.retry}</CText>
      </TouchableOpacity>
    </View>
  );

  const renderVotingPeriodInfo = () => {
    if (!electionStatus || !electionStatus.config) return null;

    const currentTime = new Date(electionStatus.currentTimeBolivia);
    const startDate = new Date(electionStatus.config.votingStartDateBolivia);
    const endDate = new Date(electionStatus.config.votingEndDateBolivia);

    let title, subtitle, statusText;
    if (currentTime < startDate) {
      // La votación aún no ha comenzado
      title = i18nString.votingUpcoming;
      subtitle = i18nString.votingUpcomingSubtitle;
      statusText = i18nString.votingWillTakePlace;
    } else if (currentTime > endDate) {
      // La votación ya finalizó
      title = i18nString.votingFinished;
      subtitle = i18nString.votingFinishedSubtitle;
      statusText = i18nString.votingTookPlace;
    } else {
      // Estamos en periodo de votación
      return null;
    }

    return (
      <View style={styles.votingPeriodInfo}>
        <CText style={styles.votingStatusText}>{statusText}</CText>

        <View style={styles.votingDetailRow}>
          <CText style={styles.votingDetailLabel}>{i18nString.date}:</CText>
          <CText style={styles.votingDetailValue}>
            {formatDate(electionStatus.config.votingStartDateBolivia)}
          </CText>
        </View>

        <View style={styles.votingDetailRow}>
          <CText style={styles.votingDetailLabel}>{i18nString.from}:</CText>
          <CText style={styles.votingDetailValue}>
            {formatTime(electionStatus.config.votingStartDateBolivia)}
          </CText>
        </View>

        <View style={styles.votingDetailRow}>
          <CText style={styles.votingDetailLabel}>{i18nString.to}:</CText>
          <CText style={styles.votingDetailValue}>
            {formatTime(electionStatus.config.votingEndDateBolivia)}
          </CText>
        </View>

        <CText style={styles.votingPeriodSubtitle}>{subtitle}</CText>
      </View>
    );
  };

  useEffect(() => {
    if (configLoading) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotateAnim.stopAnimation(() => rotateAnim.setValue(0));
    }
  }, [configLoading]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinNeg = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  if (offline && !cachedVotePlace) {
    return (
      <View style={styles.inactiveContainer}>
        <Ionicons name="cloud-offline" size={64} color="#ccc" />
        <CText style={styles.inactiveTitle}>
          {i18nString.offlineNoCacheTitle}
        </CText>
        <CText style={styles.inactiveSubtitle}>
          {i18nString.offlineNoCacheSubtitle}
        </CText>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetryLocation}>
          <CText style={styles.retryButtonText}>{i18nString.retry}</CText>
        </TouchableOpacity>
      </View>
    );
  }

  const renderContent = () => {
    if (configLoading) {
      const ringSize = getResponsiveSize(84, 96, 110);
      const iconSize = getResponsiveSize(40, 50, 60);
      const half = ringSize / 2;

      return (
        <View style={styles.loadingContainer}>
          <View
            style={{
              position: 'relative',
              width: ringSize,
              height: ringSize,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Animated.View
              style={{
                position: 'absolute',
                width: ringSize,
                height: ringSize,
                transform: [{ rotate: spin }],
              }}>
              <Animated.View
                style={{
                  position: 'absolute',
                  right: -iconSize / 2,
                  top: half - iconSize / 2,
                  transform: [{ rotate: spinNeg }],
                }}>
                <Ionicons name="search" size={iconSize} color="#4F9858" />
              </Animated.View>
            </Animated.View>
          </View>

          <CText style={styles.loadingText}>
            {i18nString.findingEstablishment}
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
          <CText style={styles.inactiveTitle}>
            {i18nString.noActiveElection}
          </CText>
          <CText style={styles.inactiveSubtitle}>
            {i18nString.noActiveElectionSubtitle}
          </CText>
        </View>
      );
    }

    // Caso 2: Configuración inactiva
    if (!electionStatus.config.isActive) {
      return (
        <View style={styles.inactiveContainer}>
          <Ionicons name="warning-outline" size={64} color="#ccc" />
          <CText style={styles.inactiveTitle}>
            {i18nString.electionInactive}
          </CText>
          <CText style={styles.inactiveSubtitle}>
            {i18nString.electionInactiveSubtitle}
          </CText>
        </View>
      );
    }

    // Caso 3: Fuera del periodo de votación
    if (!electionStatus.isVotingPeriod) {
      return (
        <View style={styles.inactiveContainer}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <CText style={styles.inactiveTitle}>
            {i18nString.outOfVotingPeriod}
          </CText>

          <View style={styles.timeContainer}>
            <Ionicons name="time" size={24} color="#666" />
            <CText style={styles.timeText}>
              {i18nString.currentTime}:{' '}
              {formatIsoNoT(electionStatus.currentTimeBolivia)}
            </CText>
          </View>

          {renderVotingPeriodInfo()}

          <CText style={styles.inactiveSubtitle}>
            {i18nString.outOfVotingPeriodSubtitle}
          </CText>
        </View>
      );
    }

    // Caso 4: Periodo de votación activo
    return (
      <View style={{ flex: 1 }}>
        {renderSearchBar()}
        {loadingLocation && (
          <View style={styles.loadingLocationContainer}>
            <ActivityIndicator size="small" color="#4F9858" />
            <CText style={styles.loadingLocationText}>
              {locationRetries > 0
                ? `${i18nString.retryingLocation} (${locationRetries}/2)`
                : i18nString.gettingLocation}
            </CText>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F9858" />
            <CText style={styles.loadingText}>
              {i18nString.loadingNearbyLocations}
            </CText>
          </View>
        ) : (
          <>
            {userLocation && (
              <View style={styles.locationInfoContainer}>
                <Ionicons name="location-sharp" size={20} color="#4F9858" />
                <CText style={styles.locationInfoText}>
                  {i18nString.showingNearbyLocations}
                </CText>
              </View>
            )}

            <FlatList
              style={{ flex: 1 }}
              data={filteredLocations}
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
      </View>
    );
  };

  return (
    <CSafeAreaView style={styles.container}>
      {/* <CHeader
        title={String.electoralLocations}
        onBack={() => navigation.goBack()}
        // color={colors.white}
      /> */}
      {!configLoading && (
        <UniversalHeader
          title={i18nString.electoralLocations}
          onBack={() => navigation.goBack()}
        />
      )}

      {renderContent()}

      <CustomModal
        visible={modalVisible}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        buttonText={modalConfig.primaryButtonText}
        onButtonPress={modalConfig.onPrimaryAction}
        secondaryButtonText={modalConfig.secondaryButtonText}
        onSecondaryPress={modalConfig.onSecondaryAction}
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
    marginTop: getResponsiveSize(24, 28, 32),
    fontSize: getResponsiveSize(16, 18, 20),
    color: '#666',
    textAlign: 'center',
    fontWeight: '800',
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
  votingPeriodInfo: {
    backgroundColor: '#f0f8ff',
    padding: getResponsiveSize(12, 16, 20),
    borderRadius: getResponsiveSize(8, 10, 12),
    marginVertical: getResponsiveSize(10, 14, 18),
    width: '100%',
    maxWidth: 500,
  },
  votingStatusText: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: 'bold',
    color: '#193b5e',
    textAlign: 'center',
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  votingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  votingDetailLabel: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#333',
  },
  votingDetailValue: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4F9858',
    fontWeight: 'bold',
  },
  votingPeriodSubtitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    marginTop: getResponsiveSize(10, 12, 14),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: getResponsiveSize(16, 20, 24),
    marginVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    height: getResponsiveSize(40, 45, 50),
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#333',
    paddingVertical: 0,
  },
  searchIcon: {
    marginLeft: getResponsiveSize(8, 10, 12),
  },
  clearButton: {
    padding: getResponsiveSize(5, 8, 10),
  },
  highlightedText: {
    backgroundColor: 'yellow',
    color: '#000',
    fontWeight: 'bold',
  },
};

export default ElectoralLocations;
