import { BACKEND_RESULT } from '@env';
import { Image } from 'expo-image';
import {
  AppState,
  Dimensions,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import messaging from '@react-native-firebase/messaging';

import Geolocation from '@react-native-community/geolocation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { clearWallet } from '../../../redux/action/walletAction';
import { clearAuth } from '../../../redux/slices/authSlice';


import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useSelector } from 'react-redux';
import images from '../../../assets/images';
import {
  LAST_USER_TOPIC_KEY,
  JWT_KEY
} from '../../../common/constants';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import RegisterAlertCard from '../../../components/home/RegisterAlertCard';
import I18nStrings from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import { clearSession } from '../../../utils/Session';

import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import CustomModal from '../../../components/common/CustomModal';
import {
  alertNewBackendNotifications,
  getLocalStoredNotifications,
  mergeAndDedupeNotifications,
} from '../../../notifications';
import {
  isStateEffectivelyOnline,
  NET_POLICIES,
} from '../../../utils/networkQuality';
import {
  getAll as getOfflineQueue,
  clearVotePlace,
  getVotePlace,
  processQueue,
  removeById,
  retryNow,
  saveVotePlace,
} from '../../../utils/offlineQueue';
import {
  getAttestationAvailabilityCache,
  saveAttestationAvailabilityCache,
} from '../../../utils/attestationAvailabilityCache';
import {
  buildSelectedElectionContext,
  saveSelectedElectionContext,
} from '../../../utils/electionContext';
import { getCache, isFresh, setCache } from '../../../utils/lookupCache';
import {
  authenticateWithBackend,
  publishActaHandler,
  publishWorksheetHandler,
  syncActaBackendHandler,
} from '../../../utils/offlineQueueHandler';
import {
  subscribeToPushTopic,
  unsubscribeFromPushTopic,
} from '../../../services/notifications';
import { clearWorksheetLocalStatus } from '../../../utils/worksheetLocalStatus';
import { captureError, captureMessage } from '../../../config/sentry';
import { useBackupCheck } from '../../../hooks/useBackupCheck';
import { backendProbe } from '../../../utils/networkUtils';

import { FEATURE_FLAGS } from '../../../config/featureFlags';
import {
  ElectionCard,
  handleVotingQueueVote,
  markVoteFailed,
  reconcileVoteJournal,
  releaseVoteForElection,
  useVotingState,
  useElectionRepository,
  UI_STRINGS as VotingStrings,
} from '../../../features/voting';
import { checkClaimedCredForVote, claimForVote } from '@/src/data/credentials';
import { FlashList } from '@shopify/flash-list';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;
const isLandscape = screenWidth > screenHeight;


const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const QUEUE_WRITE_TASK_TYPES = new Set([
  'publishActa',
  'publishWorksheet',
  'syncActaBackend',
  'votingFlowVote',
]);

const isQueueWriteTask = taskType => QUEUE_WRITE_TASK_TYPES.has(taskType);
const RETRIABLE_NETWORK_ERROR_TYPES = new Set([
  'NETWORK_TIMEOUT',
  'NETWORK_DOWN',
  'SERVER_5XX',
  'RATE_LIMIT',
]);

const BLOCKCHAIN_ERROR_HINTS = [
  'blockchain',
  'oracle',
  'attest',
  'attestation',
  'createattestation',
  'smart contract',
  'transaction',
  'tx ',
  'evm',
  'revert',
  'nonce',
  'gas',
  'insufficient funds',
  'user rejected',
  'eth_getlogs',
  'invalid block range',
  'viem@',
  'mainnet.base.org',
  'missing or invalid parameters',
];

const shouldShowQueueFailModal = failedItem => {
  const errorType = String(failedItem?.errorType || '')
    .trim()
    .toUpperCase();
  const errorMessage = String(failedItem?.error || '')
    .trim()
    .toLowerCase();

  if (RETRIABLE_NETWORK_ERROR_TYPES.has(errorType)) {
    return false;
  }

  if (errorMessage.includes('status code 404')) {
    return false;
  }

  if (errorType === 'UNKNOWN') {
    const isLikelyBlockchainError = BLOCKCHAIN_ERROR_HINTS.some(hint =>
      errorMessage.includes(hint),
    );
    if (isLikelyBlockchainError) {
      return true;
    }
  }

  return failedItem?.removedFromQueue === true;
};

const deriveQueueFailMessage = failedItems => {
  const list = Array.isArray(failedItems) ? failedItems : [];
  const hasVotingFailure = list.some(item => item?.type === 'votingFlowVote');
  if (hasVotingFailure) {
    const joinedVotingErrors = list
      .filter(item => item?.type === 'votingFlowVote')
      .map(item => String(item?.error || '').trim())
      .filter(Boolean)
      .join('\n\n');

    return joinedVotingErrors ||
      'No se pudo completar el registro del voto. Puedes volver a intentarlo o liberar el voto para votar de nuevo.';
  }

  const joinedErrors = list
    .map(item => String(item?.error || '').toLowerCase())
    .join(' | ');
  const alreadyAttested =
    joinedErrors.includes('already attested') ||
    joinedErrors.includes('616c7265616479206174746573746564') ||
    joinedErrors.includes('acta ya atestiguada');
  const duplicateVotes =
    joinedErrors.includes('mismos votos') ||
    joinedErrors.includes('votos duplicados') ||
    joinedErrors.includes('acta duplicada');

  if (alreadyAttested) {
    return 'Hoja de trabajo ya atestiguada.';
  }
  if (duplicateVotes) {
    return 'Ya existe una hoja de trabajo con los mismos votos para esta mesa.';
  }
  return 'Reintenta o elimina para subir otra hoja de trabajo.';
};

const deriveQueueFailTitle = failedItems => {
  const list = Array.isArray(failedItems) ? failedItems : [];
  if (list.some(item => item?.type === 'votingFlowVote')) {
    return 'No se pudo completar el voto';
  }
  return 'No se pudo completar la subida';
};
const HOME_TRACE_ENABLED = typeof __DEV__ !== 'undefined' ? __DEV__ : true;


// Responsive grid calculations
const getCardLayout = () => {
  if (isTablet) {
    const CARD_MARGIN = getResponsiveSize(12, 16, 20);
    let CARDS_PER_ROW;
    if (isLandscape) {
      CARDS_PER_ROW = screenWidth > 1000 ? 4 : 3;
    } else {
      CARDS_PER_ROW = 2;
    }
    const CARD_WIDTH =
      (screenWidth - (CARDS_PER_ROW + 1) * CARD_MARGIN) / CARDS_PER_ROW;
    return { CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW };
  } else {
    const CARD_MARGIN = getResponsiveSize(8, 10, 12);
    const CARDS_PER_ROW = 2;
    const CARD_WIDTH = (screenWidth - 3 * CARD_MARGIN) / CARDS_PER_ROW;
    return { CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW };
  }
};

const { CARD_MARGIN, CARD_WIDTH, CARDS_PER_ROW } = getCardLayout();

// Carousel Item Component
const CarouselItem = ({ item }) => (
  <View testID={`homeCarouselItem_${item.id}`} style={stylesx.carouselItem}>
    <View testID={`homeCarouselGrid_${item.id}`} style={stylesx.carouselGrid}>
      <View testID={`homeCarouselLeft_${item.id}`} style={stylesx.carouselLeft}>
        <Image
          testID={`homeCarouselImage_${item.id}`}
          source={item.image}
          style={stylesx.bcLogoImage}
          resizeMode="contain"
        />
      </View>

      <View
        testID={`homeCarouselRight_${item.id}`}
        style={stylesx.carouselRight}>
        <View
          testID={`homeCarouselTextContainer_${item.id}`}
          style={stylesx.carouselTextContainer}>
          <CText
            testID={`homeCarouselTitle_${item.id}`}
            style={stylesx.carouselTitle}>
            {item.title}
          </CText>
          <CText
            testID={`homeCarouselSubtitle_${item.id}`}
            style={stylesx.carouselSubtitle}
            numberOfLines={3}>
            {item.subtitle}
          </CText>
        </View>

        <TouchableOpacity
          testID={`homeCarouselButton_${item.id}`}
          style={stylesx.carouselButtonInline}
          onPress={item.onPress}
          activeOpacity={0.8}>
          <CText
            testID={`homeCarouselButtonText_${item.id}`}
            style={stylesx.carouselButtonText}>
            {item.buttonText}
          </CText>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const MiVotoLogo = () => (
  <View testID="homeMiVotoLogo" style={stylesx.logoRow}>
    {/* Bandera */}
    <Image
      testID="MiVotoLogoImage"
      source={images.logoImg}
      style={stylesx.logoImage}
      resizeMode="contain"
    />
    {/* <View style={stylesx.flagBox}>
      <View
        style={[stylesx.flagStripe, { backgroundColor: '#E72F2F', top: 0 }]}
      />
      <View
        style={[
          stylesx.flagStripe,
          { backgroundColor: '#FFD800', top: getResponsiveSize(6, 7, 8) },
        ]}
      />
      <View
        style={[
          stylesx.flagStripe,
          { backgroundColor: '#4FC144', top: getResponsiveSize(12, 14, 16) },
        ]}
      />
      <View style={stylesx.flagCheckOutline} />
    </View> */}
    <View
      testID="homeMiVotoLogoText"
      style={{ marginLeft: getResponsiveSize(6, 8, 10) }}>
      <CText testID="homeMiVotoLogoTitle" style={stylesx.logoTitle}>
        Tu Voto Decide
      </CText>
      <CText testID="homeMiVotoLogoSubtitle" style={stylesx.logoSubtitle}>
        Control ciudadano del voto
      </CText>
    </View>
  </View>
);

// === Banner Blockchain Consultora ===
const BlockchainConsultoraBanner = () => (
  <View testID="homeBlockchainBanner" style={stylesx.bannerBC}>
    <View
      testID="homeBlockchainBannerContent"
      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <View style={stylesx.bcLogoCircle}>
        <CText style={stylesx.bcLogoText}>bc</CText>
      </View>
      <View testID="homeBlockchainBannerText" style={{ marginLeft: 10, flex: 1 }}>
        <CText testID="homeBlockchainBannerTitle" style={stylesx.bannerTitle}>
          {I18nStrings.needBlockchainApp}
        </CText>
        <CText
          testID="homeBlockchainBannerSubtitle"
          style={stylesx.bannerSubtitle}>
          {I18nStrings.blockchainConsultBanner}
        </CText>
      </View>
    </View>
    <TouchableOpacity
      testID="homeBlockchainBannerButton"
      onPress={() => Linking.openURL('https://blockchainconsultora.com/es')}
      style={stylesx.bannerButton}
      activeOpacity={0.8}>
      <CText
        testID="homeBlockchainBannerButtonText"
        style={stylesx.bannerButtonText}>
        {I18nStrings.learnMore}
      </CText>
    </TouchableOpacity>
  </View>
);
const CTA_HEIGHT = getResponsiveSize(44, 48, 56);
const CTA_WIDTH = getResponsiveSize(120, 140, 160);
const CTA_MARGIN = getResponsiveSize(16, 20, 24);
const LEFT_COL_WIDTH = getResponsiveSize(56, 64, 72);

const buildNotificationSeenKey = dniValue => {
  const normalized = String(dniValue || '')
    .trim()
    .toLowerCase();
  return `@notifications:last-seen:${normalized || 'anon'}`;
};

const LOOKUP_CACHE_KEYS = {
  electionStatus: 'home:election-config-status',
  notifications: dniValue =>
    `home:notifications:${String(dniValue || '').trim().toLowerCase() || 'anon'}`,
};

const LOOKUP_CACHE_TTLS = {
  electionStatusMs: 60 * 1000,
  notificationsMs: 10 * 1000,
  tablesByLocationMs: 6 * 60 * 60 * 1000,
};
const VOTING_CAROUSEL_RETENTION_MS = 24 * 60 * 60 * 1000;
const NOTIFICATIONS_AUTH_RETRY_MS = 60 * 1000;
const ATT_AVAILABILITY_SYNC_COOLDOWN_MS = 60 * 1000;
const VOTE_PLACE_SYNC_COOLDOWN_MS = 2 * 60 * 1000;
const VOTE_PLACE_SYNC_COOLDOWN_NO_CACHE_MS = 15 * 1000;

const shouldKeepElectionInCarousel = election => {
  const closesAt = Number(election?.closesAt || 0);
  if (!Number.isFinite(closesAt) || closesAt <= 0) {
    return true;
  }

  return Date.now() - closesAt <= VOTING_CAROUSEL_RETENTION_MS;
};

const extractNotificationTimestamp = notification => {
  const raw =
    notification?.createdAt ||
    notification?.timestamp ||
    notification?.data?.createdAt ||
    notification?.data?.timestamp ||
    0;

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw > 9999999999 ? raw : raw * 1000;
  }

  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTablesByLocationCacheKey = locationId =>
  `tables-by-location:${String(locationId || '').trim()}`;

const warmTablesCacheByLocationId = async ({
  locationId,
  seedTables = [],
  timeoutMs = 10000,
}) => {
  const normalizedLocationId = String(locationId || '').trim();
  if (!normalizedLocationId) return;

  const cacheKey = getTablesByLocationCacheKey(normalizedLocationId);
  const cacheFresh = await isFresh(cacheKey, LOOKUP_CACHE_TTLS.tablesByLocationMs);
  if (cacheFresh) return;

  if (Array.isArray(seedTables) && seedTables.length > 0) {
    await setCache(cacheKey, seedTables, { version: 'tables-v1' });
    return;
  }

  const encodedLocationId = encodeURIComponent(normalizedLocationId);
  const primaryUrl = `${BACKEND_RESULT}/api/v1/geographic/electoral-tables?electoralLocationId=${encodedLocationId}&limit=500`;
  try {
    const { data } = await axios.get(primaryUrl, { timeout: timeoutMs });
    const list = data?.data || data?.tables || data?.data?.tables || [];
    if (Array.isArray(list) && list.length > 0) {
      await setCache(cacheKey, list, { version: 'tables-v1' });
      return;
    }
  } catch {
    // fallback legacy endpoint
  }

  try {
    const legacyUrl = `${BACKEND_RESULT}/api/v1/geographic/electoral-locations/${encodedLocationId}/tables`;
    const { data } = await axios.get(legacyUrl, { timeout: timeoutMs });
    const list = data?.tables || data?.data?.tables || [];
    if (Array.isArray(list) && list.length > 0) {
      await setCache(cacheKey, list, { version: 'tables-v1' });
    }
  } catch {
    // non-blocking warmup
  }
};

const resolveElectionWindowState = status => {
  if (!status || typeof status !== 'object') {
    return { known: false, enabled: true, reason: null };
  }

  const elections = Array.isArray(status?.elections) ? status.elections : [];
  const selectedConfig =
    status?.config ||
    elections.find(e => e?.isActive) ||
    elections[0] ||
    null;

  if (status?.hasActiveConfig === false || !selectedConfig) {
    return {
      known: true,
      enabled: false,
      reason: 'No hay una elección activa en este momento.',
    };
  }

  if (selectedConfig?.isActive === false) {
    return {
      known: true,
      enabled: false,
      reason: 'La elección no está activa en este momento.',
    };
  }

  const isVotingPeriod =
    typeof status?.isVotingPeriod === 'boolean'
      ? status.isVotingPeriod
      : typeof selectedConfig?.isVotingPeriod === 'boolean'
        ? selectedConfig.isVotingPeriod
        : null;

  if (isVotingPeriod === false) {
    return {
      known: true,
      enabled: false,
      reason: 'Fuera del periodo de votación.',
    };
  }

  if (isVotingPeriod === true) {
    return { known: true, enabled: true, reason: null };
  }

  return { known: false, enabled: true, reason: null };
};

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const userTopicRef = useRef(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const [hasPendingActa, setHasPendingActa] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const processingRef = useRef(false);
  const queueRunPromiseRef = useRef(null);
  const runOfflineQueueRef = useRef(() => { });
  const loadVotingElectionRef = useRef(async () => {});
  const refreshVotingStateRef = useRef(() => {});
  const requestLocationAndCheckAvailabilityRef = useRef(async () => {});
  const checkUserVotePlaceRef = useRef(async () => {});
  const refreshNotificationBadgeCountRef = useRef(async () => { });
  const notificationsApiKeyRef = useRef(null);
  const notificationsAuthRetryAtRef = useRef(0);
  const votingElectionLoadRef = useRef({
    inFlight: false,
    lastAttemptAt: 0,
    promise: null,
  });
  const [checkingVotePlace, setCheckingVotePlace] = useState(false);
  const [shouldShowRegisterAlert, setShouldShowRegisterAlert] = useState(false);
  const [electionStatus, setElectionStatus] = useState(null);
  const [contractsAvailability, setContractsAvailability] = useState({
    ALCALDE: {
      enabled: false,
      electionId: null,
      electionName: null,
      reason: null,
      contractId: null,
      contract: null,
      backendElectionType: null,
    },
    GOBERNADOR: {
      enabled: false,
      electionId: null,
      electionName: null,
      reason: null,
      contractId: null,
      contract: null,
      backendElectionType: null,
    },
    nearestLocation: null,
  });
  const contracts = contractsAvailability;
  const [queueFailModal, setQueueFailModal] = useState({
    visible: false,
    failedItems: [],
    message: '',
  });
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isHomeOnline, setIsHomeOnline] = useState(true);
  const [votingElections, setVotingElections] = useState([]);
  const [currentVotingElectionIndex, setCurrentVotingElectionIndex] = useState(0);
  const [loadingVotingElection, setLoadingVotingElection] = useState(
    FEATURE_FLAGS.ENABLE_VOTING_FLOW,
  );
  const votingElection = votingElections[currentVotingElectionIndex] || null;

  const votingRepository = useElectionRepository();
  const persistedVotingState = useVotingState(votingElection?.id);
  const votingState = FEATURE_FLAGS.ENABLE_VOTING_FLOW
    ? persistedVotingState
    : {
        ...persistedVotingState,
        isLoading: false,
        hasVoted: false,
        voteSynced: false,
        refreshState: () => {},
        lastReceipt: null,
      };
  const refreshVotingState = votingState.refreshState;

  const loadVotingElection = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_VOTING_FLOW) {
      setLoadingVotingElection(false);
      return;
    }

    const now = Date.now();
    if (votingElectionLoadRef.current.inFlight) {
      return votingElectionLoadRef.current.promise;
    }
    if (now - votingElectionLoadRef.current.lastAttemptAt < 4000) {
      return votingElection;
    }

    votingElectionLoadRef.current.lastAttemptAt = now;
    votingElectionLoadRef.current.inFlight = true;

    try {
      setLoadingVotingElection(true);
      const request =
        typeof votingRepository.getElections === 'function'
          ? votingRepository.getElections()
          : votingRepository.getElection();
      votingElectionLoadRef.current.promise = request;
      const result = await request;
      const elections = Array.isArray(result)
        ? result
        : result
          ? [result]
          : [];
      const visibleElections = elections.filter(shouldKeepElectionInCarousel);
      setVotingElections(visibleElections);
      setCurrentVotingElectionIndex(currentIndex =>
        visibleElections.length === 0
          ? 0
          : Math.min(currentIndex, visibleElections.length - 1),
      );
      return visibleElections;
    } catch (error) {
      console.warn('[HomeScreen] voting election load failed:', error?.message || error);
      setVotingElections([]);
      setCurrentVotingElectionIndex(0);
      return [];
    } finally {
      votingElectionLoadRef.current.inFlight = false;
      votingElectionLoadRef.current.promise = null;
      setLoadingVotingElection(false);
    }
  }, [votingRepository]);

  // 'unknown' | 'granted' | 'denied'  — rastrea si el usuario ya dio permiso
  const [locationStatus, setLocationStatus] = useState('unknown');


  const pendingPermissionFromSettings = useRef(false);
  const availabilityRef = useRef({ lastCheckAt: 0 }); // evita spam en focus
  const votePlaceSyncRef = useRef({ lastSyncAt: 0, inFlight: false });

  const [permissionModal, setPermissionModal] = useState({
    visible: false,
    type: 'settings', // o 'warning'
    title: '',
    message: '',
    primaryText: 'Abrir ajustes',
    onPrimary: null,
    secondaryText: 'Cancelar',
    onSecondary: null,
  });
  const showPermissionModal = (
    title,
    message,
    onOpenSettings,
    onCancel = () => setPermissionModal(m => ({ ...m, visible: false })),
  ) => {
    setPermissionModal({
      visible: true,
      type: 'settings',
      title,
      message,
      primaryText: 'Abrir ajustes',
      onPrimary: onOpenSettings,
      secondaryText: 'Cancelar',
      onSecondary: onCancel,
    });
  };

  const openLocationSettings = () => {
    setPermissionModal(m => ({ ...m, visible: false }));
    pendingPermissionFromSettings.current = true;

    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
        Linking.openSettings(),
      );
    } else {
      Linking.openURL('App-Prefs:Privacy&path=LOCATION').catch(() =>
        Linking.openSettings(),
      );
    }
  };

  /** Solo VERIFICA el permiso, nunca muestra diálogo del sistema */
  const checkLocationPermissionOnly = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const ok = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return ok;
      }
      // iOS: no hay .check() puro, pero requestAuthorization con 'whenInUse'
      // no vuelve a mostrar el diálogo si ya se contestó
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);


  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de ubicación',
          message:
            'La aplicación necesita acceso a tu ubicación para verificar disponibilidad de envío.',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // iOS
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  }, []);

  const getCurrentPositionAsync = (useHighAccuracy = true) =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        pos => resolve(pos),
        err => reject(err),
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: useHighAccuracy ? 15000 : 30000,
          maximumAge: useHighAccuracy ? 10000 : 60000,
        },
      );
    });

  /**
* Obtiene la ubicación SIN mostrar modales.
* Si el permiso no está concedido, actualiza locationStatus y retorna null.
*/

  const getHomeLocation = useCallback(async (silent = true) => {
    const ok = await checkLocationPermissionOnly();
    if (!ok) {
      setLocationStatus('denied');
      if (!silent) {
        // Solo muestra modal si el usuario pidió explícitamente activar
        showPermissionModal(
          'Ubicación requerida',
          'Necesitas habilitar la ubicación para verificar si tienes contratos activos en esta zona.',
          openLocationSettings,
        );
      }
      return null;
    }
    setLocationStatus('granted');
    try {
      // intento 1: high accuracy
      const pos = await getCurrentPositionAsync(true);
      return pos.coords;
    } catch (err1) {
      // fallback: low accuracy si es TIMEOUT/POSITION_UNAVAILABLE
      try {
        const pos2 = await getCurrentPositionAsync(false);
        return pos2.coords;
      } catch (err2) {
        // GPS desactivado: marcar como 'denied' para mostrar botón "Activar Ubicación"
        setLocationStatus('denied');
        if (!silent) {
          showPermissionModal(
            'No se pudo obtener ubicación',
            'Activa la ubicación (GPS) e intenta nuevamente.',
            openLocationSettings,
          );
        }
        return null;
      }
    }
  }, [checkLocationPermissionOnly]);

  const buildContractsAvailabilityFromElections = useCallback(
    (availableElections, nearestLocation = null) => {
      const elections = Array.isArray(availableElections) ? availableElections : [];

      // ALCALDE -> municipal
      const municipal = elections.find(e => e?.electionType === 'municipal');
      const municipalEnabled = !!municipal?.canAttest;

      // GOBERNADOR -> departamental
      const departamental = elections.find(e => e?.electionType === 'departamental');
      const departamentalEnabled = !!departamental?.canAttest;

      return {
        nearestLocation: nearestLocation || null,
        ALCALDE: {
          enabled: municipalEnabled,
          electionId: municipalEnabled ? municipal?.electionId : null,
          electionName: municipal?.electionName || null,
          reason: municipal?.reason || null,
          contractId: municipal?.contract?.id || null,
          contract: municipal?.contract || null,
          backendElectionType: municipal?.electionType || null,
        },
        GOBERNADOR: {
          enabled: departamentalEnabled,
          electionId: departamentalEnabled ? departamental?.electionId : null,
          electionName: departamental?.electionName || null,
          reason: departamental?.reason || null,
          contractId: departamental?.contract?.id || null,
          contract: departamental?.contract || null,
          backendElectionType: departamental?.electionType || null,
        },
      };
    },
    [],
  );

  const checkAttestationAvailability = useCallback(
    async (latitude, longitude, { showLoader = true } = {}) => {
      const applyCachedAvailability = async () => {
        try {
          const cached = await getAttestationAvailabilityCache(dni);
          if (cached?.availableElections) {

            setContractsAvailability(
              buildContractsAvailabilityFromElections(
                cached.availableElections,
                cached.nearestLocation,
              ),
            );
            return true;
          }

        } catch {
          // noop
        }
        return false;
      };

      try {
        if (showLoader) {
          setLoadingAvailability(true);
        }
        const hasCached = await applyCachedAvailability();

        const probe = await backendProbe({ timeoutMs: 2000 });
        if (!probe?.ok) {

          if (!hasCached) {
            setContractsAvailability({
              nearestLocation: null,
              ALCALDE: { enabled: false, electionId: null, electionName: null, reason: null },
              GOBERNADOR: { enabled: false, electionId: null, electionName: null, reason: null },
            });
          }
          return;
        }

        // Si tu endpoint requiere maxDistance, lo mandamos igual que "nearby"
        const res = await axios.get(
          `${BACKEND_RESULT}/api/v1/contracts/check-attestation-availability`,
          {
            timeout: 12000,
            params: {
              latitude: Number(longitude),
              longitude: Number(latitude),
              maxDistance: 10000,
            },
            // Si tu backend usa x-api-key en algunos endpoints, agrega aquí:
            // headers: { 'x-api-key': BACKEND_SECRET },
          },
        );
        const data = res?.data || {};
        const elections = Array.isArray(data?.availableElections)
          ? data.availableElections
          : [];


        await saveAttestationAvailabilityCache(dni, {
          nearestLocation: data?.nearestLocation || null,
          availableElections: elections,
        });

        setContractsAvailability(
          buildContractsAvailabilityFromElections(elections, data?.nearestLocation),
        );
      } catch (e) {
        const hasCached = await applyCachedAvailability();

        if (!hasCached) {
          setContractsAvailability({
            nearestLocation: null,
            ALCALDE: { enabled: false, electionId: null, electionName: null, reason: null },
            GOBERNADOR: { enabled: false, electionId: null, electionName: null, reason: null },
          });
        }
      } finally {
        if (showLoader) {
          setLoadingAvailability(false);
        }
      }
    },
    [dni, buildContractsAvailabilityFromElections],
  );
  /**
 * Verificación automática (en focus / red) — modo silencioso:
 * solo CHECK, nunca muestra diálogos del sistema ni modales.
 */
  const requestLocationAndCheckAvailability = useCallback(async () => {
    const now = Date.now();
    if (now - (availabilityRef.current.lastCheckAt || 0) < 4000) return;
    availabilityRef.current.lastCheckAt = now;

    // si estás offline, no tiene sentido pedir GPS para endpoint remoto
    const net = await NetInfo.fetch();
    const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
    const cachedAvailability = await getAttestationAvailabilityCache(dni);
    const hasCachedAvailability = Array.isArray(
      cachedAvailability?.availableElections,
    );
    if (hasCachedAvailability) {
      setContractsAvailability(
        buildContractsAvailabilityFromElections(
          cachedAvailability.availableElections,
          cachedAvailability.nearestLocation,
        ),
      );
    }

    let hasPermission = false;
    try {
      hasPermission = await checkLocationPermissionOnly();
      setLocationStatus(hasPermission ? 'granted' : 'denied');
    } catch {
      setLocationStatus('unknown');
    }

    const cachedSavedAt = Number(cachedAvailability?.savedAt || 0);
    const cacheFresh =
      cachedSavedAt > 0 &&
      now - cachedSavedAt < ATT_AVAILABILITY_SYNC_COOLDOWN_MS;


    const probe = await backendProbe({ timeoutMs: 2000 });


    try {
      const coords = await getHomeLocation(true);
      if (!coords?.latitude || !coords?.longitude) {
        return;
      }

      await checkAttestationAvailability(coords.latitude, coords.longitude, {
        showLoader: !hasCachedAvailability,
      });
    } finally {
      // no-op: loader is managed by checkAttestationAvailability
    }
  }, [
    dni,
    getHomeLocation,
    checkAttestationAvailability,
    buildContractsAvailabilityFromElections,
    checkLocationPermissionOnly,
  ]);


  /**
   * Acción EXPLÍCITA del usuario: toca "Activar Ubicación".
   * Aquí SÍ pedimos el permiso al sistema y mostramos modal si falla.
   */
  const handleActivateLocation = useCallback(async () => {
    const ok = await requestLocationPermission();
    if (!ok) {
      setLocationStatus('denied');

      showPermissionModal(
        'Ubicación requerida',
        'Necesitas habilitar la ubicación para verificar si tienes contratos activos en esta zona.',
        openLocationSettings,
      );
      return;
    }


    setLocationStatus('granted');
    setLoadingAvailability(true);
    try {
      let coords = null;
      try {
        const pos = await getCurrentPositionAsync(true);
        coords = pos.coords;
      } catch {
        const pos2 = await getCurrentPositionAsync(false);
        coords = pos2.coords;
      }

      if (coords?.latitude && coords?.longitude) {
        await checkAttestationAvailability(coords.latitude, coords.longitude);
      } else {
        setLocationStatus('denied');
        showPermissionModal(
          'No se pudo obtener ubicación',
          'Activa la ubicación (GPS) e intenta nuevamente.',
          openLocationSettings,
        );
      }
    } catch {
      setLocationStatus('denied');
      showPermissionModal(
        'No se pudo obtener ubicación',
        'Activa la ubicación (GPS) e intenta nuevamente.',
        openLocationSettings,
      );
    } finally {
      setLoadingAvailability(false);
    }
  }, [requestLocationPermission, checkAttestationAvailability]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state !== 'active') return;

      runOfflineQueueRef.current?.();

      if (pendingPermissionFromSettings.current) {
        pendingPermissionFromSettings.current = false;
        try {
          const ok = await checkLocationPermissionOnly();
          if (ok) {
            setLocationStatus('granted');
            setPermissionModal(m => ({ ...m, visible: false }));
            // Forzar re-check ahora que hay permiso
            availabilityRef.current.lastCheckAt = 0;
            requestLocationAndCheckAvailability();
          } else {
            setLocationStatus('denied');
            // No mostramos modal de nuevo, el botón "Activar Ubicación" ya está visible
            setPermissionModal(m => ({ ...m, visible: false }));
          }
        } catch (e) { }
      }
    });

    return () => sub.remove();
  }, [requestLocationAndCheckAvailability, checkLocationPermissionOnly]);


  const fetchElectionStatus = useCallback(async () => {
    const cachedEntry = await getCache(LOOKUP_CACHE_KEYS.electionStatus);
    const cachedData = cachedEntry?.data || null;
    if (cachedData) {
      setElectionStatus(cachedData);
    } else {
    }

    const cacheFresh = await isFresh(
      LOOKUP_CACHE_KEYS.electionStatus,
      LOOKUP_CACHE_TTLS.electionStatusMs,
    );


    const probe = await backendProbe({ timeoutMs: 2000 });


    try {
      const res = await axios.get(
        `${BACKEND_RESULT}/api/v1/elections/config/status`,
        { timeout: 12000 },
      );

      if (!res?.data) return;

      setElectionStatus(res.data);
      await setCache(LOOKUP_CACHE_KEYS.electionStatus, res.data, {
        version: 'elections-config-v1',
      });
    } catch (err) {

      if (!cachedData) {
        console.error('[HOME] fetchElectionStatus error', err);
      }
    }
  }, []);

  const userData = useSelector(state => state.wallet.payload);
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ??
    subject?.documentNumber ??
    subject?.governmentIdentifier ??
    userData?.dni;

  const [infoModal, setInfoModal] = useState({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });
  const [votingSyncBanner, setVotingSyncBanner] = useState({
    visible: false,
    message: '',
  });

  const runOfflineQueueOnce = useCallback(async () => {
    if (queueRunPromiseRef.current) return queueRunPromiseRef.current;
    if (processingRef.current) return;
    if (!auth?.isAuthenticated || !userData?.privKey || !userData?.account || !userData?.did) return;
    queueRunPromiseRef.current = (async () => {
      processingRef.current = true;
      let processedVotingSyncCount = 0;
      try {
        await reconcileVoteJournal();
        const net = await NetInfo.fetch();
        const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
        if (!online) return;
        const probe = await backendProbe({ timeoutMs: 2000 });
        if (!probe?.ok) {
          console.warn('[OFFLINE-QUEUE] backend probe failed; skip queue drain', probe);
          return;
        }

        const result = await processQueue(async item => {
          const taskType = item?.task?.type;
          if (taskType === 'publishWorksheet') {
            await publishWorksheetHandler(item, userData);
            return;
          }
          if (taskType === 'publishActa') {
            await publishActaHandler(item, userData);
            return;
          }
          if (taskType === 'syncActaBackend') {
            await syncActaBackendHandler(item, userData);
            return;
          }
          if (taskType === 'votingFlowVote') {
            await handleVotingQueueVote(item);
            processedVotingSyncCount += 1;
            return;
          }
          const unknownTaskError = new Error(
            `Tipo de tarea offline no soportado: ${String(taskType || 'unknown')}`,
          );
          unknownTaskError.removeFromQueue = true;
          unknownTaskError.errorType = 'BUSINESS_TERMINAL';
          throw unknownTaskError;
        });

        // Actualiza badge/pending
        if (typeof result?.remaining === 'number') {
          setHasPendingActa(result.remaining > 0);
        } else {
          const listAfter = await getOfflineQueue();
          const pendingAfter = (listAfter || []).some(
            i => isQueueWriteTask(i?.task?.type),
          );
          setHasPendingActa(pendingAfter);
        }

        if ((Number(result?.processed) || 0) > 0) {
          try {
            await refreshNotificationBadgeCountRef.current?.();
            await refreshVotingStateRef.current?.();
            await loadVotingElectionRef.current?.();
            if (processedVotingSyncCount > 0) {
              setVotingSyncBanner({
                visible: true,
                message:
                  processedVotingSyncCount === 1
                    ? 'Votacion completada'
                    : `${processedVotingSyncCount} votaciones completadas`,
              });
            }
          } catch {
            // No bloquear flujo principal por error al refrescar badge.
          }
        }

        if (result?.failed > 0) {
          const failedItems = Array.isArray(result.failedItems) ? result.failedItems : [];
          const failedVotingItems = failedItems.filter(
            item => item?.type === 'votingFlowVote' && item?.removedFromQueue === true,
          );
          if (failedVotingItems.length > 0) {
            await Promise.all(
              failedVotingItems.map(item =>
                markVoteFailed({
                  electionId: item?.electionId,
                  reason: item?.error || 'No se pudo completar el registro del voto.',
                }),
              ),
            );
            await refreshVotingStateRef.current?.();
          }
          const modalItems = failedItems.filter(shouldShowQueueFailModal);
          if (modalItems.length > 0) {
            setQueueFailModal({
              visible: true,
              failedItems: modalItems,
              message: deriveQueueFailMessage(modalItems),
            });
          }
        }
      } catch (e) {
        captureError(e, {
          flow: 'offline_queue',
          step: 'run_once_fatal',
          critical: false,
        });
        setQueueFailModal({
          visible: true,
          failedItems: [],
          message: ' Reintenta nuevamente.',
        });
      } finally {
        processingRef.current = false;
        queueRunPromiseRef.current = null;
      }
    })();

    return queueRunPromiseRef.current;
  }, [auth?.isAuthenticated, userData]);

  useEffect(() => {
    runOfflineQueueRef.current = () => {
      runOfflineQueueOnce();
    };
  }, [runOfflineQueueOnce]);

  useEffect(() => {
    loadVotingElectionRef.current = loadVotingElection;
  }, [loadVotingElection]);

  useEffect(() => {
    refreshVotingStateRef.current = refreshVotingState || (() => {});
  }, [refreshVotingState]);

  useEffect(() => {
    if (!votingSyncBanner.visible) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setVotingSyncBanner(current => ({...current, visible: false}));
    }, 3500);

    return () => clearTimeout(timer);
  }, [votingSyncBanner.visible]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const clearUserTopicSubscription = async () => {
        const previousTopic =
          userTopicRef.current || (await AsyncStorage.getItem(LAST_USER_TOPIC_KEY));
        if (!previousTopic) return;

        try {
          await unsubscribeFromPushTopic(previousTopic);
        } catch (error) {
          console.warn('[PushTopic] Failed to unsubscribe previous user topic', error);
        }

        userTopicRef.current = null;
        await AsyncStorage.removeItem(LAST_USER_TOPIC_KEY);
      };

      const syncUserTopicSubscription = async () => {


        if (!auth?.isAuthenticated || !dni || !userData?.did || !userData?.privKey) {

          await clearUserTopicSubscription();
          return;
        }

        try {


          const apiKey = await authenticateWithBackend(userData.did, userData.privKey);


          if (!apiKey) {
            return;
          }

          const requestUrl = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1/users/${encodeURIComponent(
            dni,
          )}`;
          const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          });

          if (!response.ok) {
            const responseText = await response.text().catch(() => '');
            console.warn('[PushTopic] HomeScreen user lookup failed', {
              dni,
              requestUrl,
              status: response.status,
              responseText,
            });
            return;
          }

          const payload = await response.json();
          const backendUserId = String(payload?._id || payload?.id || '').trim();
          if (!backendUserId) {
            console.warn('[PushTopic] HomeScreen user lookup payload missing id', {
              dni,
              requestUrl,
              payload,
            });
            return;
          }

          const nextTopic = `user_${backendUserId}`;
          const previousTopic =
            userTopicRef.current || (await AsyncStorage.getItem(LAST_USER_TOPIC_KEY));

          if (previousTopic && previousTopic !== nextTopic) {
            await unsubscribeFromPushTopic(previousTopic);
          }

          await subscribeToPushTopic(nextTopic);

          if (cancelled) return;

          userTopicRef.current = nextTopic;
          await AsyncStorage.setItem(LAST_USER_TOPIC_KEY, nextTopic);

        } catch (error) {
          console.warn('[PushTopic] HomeScreen sync failed', {
            dni,
            message: error?.message || String(error),
          });
        }
      };

      syncUserTopicSubscription();

      return () => {
        cancelled = true;
      };
    }, [auth?.isAuthenticated, dni, userData?.did, userData?.privKey]),
  );

  useEffect(() => {
    requestLocationAndCheckAvailabilityRef.current = requestLocationAndCheckAvailability;
  }, [requestLocationAndCheckAvailability]);

  const buildWorksheetIdentity = payload => {
    const dni = String(
      payload?.dni ||
      payload?.additionalData?.dni ||
      '',
    ).trim();
    const electionId = String(
      payload?.electionId ||
      payload?.additionalData?.electionId ||
      '',
    ).trim();
    const tableCode = String(
      payload?.tableCode ||
      payload?.additionalData?.tableCode ||
      payload?.tableData?.codigo ||
      payload?.tableData?.tableCode ||
      '',
    ).trim();

    if (!dni || !electionId || !tableCode) return null;
    return { dni, electionId, tableCode };
  };

  const clearWorksheetStatusForFailedItem = async failedItem => {
    if (failedItem?.type !== 'publishWorksheet') return;

    let identity = buildWorksheetIdentity(failedItem);
    if (!identity && failedItem?.id) {
      const queue = await getOfflineQueue();
      const queueItem = (queue || []).find(item => item?.id === failedItem.id);
      const queuePayload = queueItem?.task?.payload || {};
      identity = buildWorksheetIdentity(queuePayload);
    }

    if (identity) {
      await clearWorksheetLocalStatus(identity);
    }
  };

  const clearVotingStatusForFailedItem = async failedItem => {
    if (failedItem?.type !== 'votingFlowVote') return;
    const electionId = String(failedItem?.electionId || '').trim();
    if (!electionId) return;

    await releaseVoteForElection(electionId);
    await refreshVotingStateRef.current?.();
    await loadVotingElectionRef.current?.();
    setInfoModal({
      visible: true,
      type: 'success',
      title: 'Voto liberado',
      message: 'Puedes volver a ingresar y registrar tu voto nuevamente.',
    });
  };

  const handleRemoveFailedItem = async (id) => {
    if (!id) return;
    try {
      const failedItem = (queueFailModal.failedItems || []).find(x => x.id === id);
      await clearWorksheetStatusForFailedItem(failedItem);
      await clearVotingStatusForFailedItem(failedItem);
      await removeById(id);
      setQueueFailModal(m => ({
        ...m,
        failedItems: (m.failedItems || []).filter(x => x.id !== id),
        visible: ((m.failedItems || []).length - 1) > 0,
      }));

      const listAfter = await getOfflineQueue();
      const pendingAfter = (listAfter || []).some(
        i => isQueueWriteTask(i?.task?.type),
      );
      setHasPendingActa(pendingAfter);
    } catch (e) {
      setInfoModal({
        visible: true,
        type: 'error',
        title: 'No se pudo actualizar el estado',
        message: 'No fue posible liberar el voto fallido. Intenta nuevamente.',
      });
    }
  };

  const handleQueueRetry = async () => {
    await retryNow(item => isQueueWriteTask(item?.task?.type));
    setQueueFailModal(m => ({ ...m, visible: false }));
    await runOfflineQueueOnce();
  };


  const handleSentryTest = () => {
    const error = new Error('Error de prueba');
    const userDni = userData?.dni ?? null;
    const effectiveDni = userDni ?? dni ?? null;
    const dniSource = userDni ? 'userData' : (dni ? 'vc' : 'unknown');

    captureMessage('Mensaje de prueba Sentry', 'info', {
      flow: 'sentry_test',
      screen: 'home',
      dni_source: dniSource,
    });

    captureError(error, {
      flow: 'sentry_test',
      step: 'home_button',
      critical: false,
      allowPii: true,
      dni: effectiveDni,
      dni_source: dniSource,
    });

    setInfoModal({
      visible: true,
      type: 'warning',
      title: 'Sentry',
      message: 'Evento de prueba enviado con DNI (solo dev). Revisa Sentry en 1-2 minutos.',
    });
  };

  const handleParticiparPress = async (type) => {
    const electionWindow = resolveElectionWindowState(electionStatus);
    if (electionWindow.known && !electionWindow.enabled) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'No disponible',
        message:
          electionWindow.reason ||
          'La aplicación solo está disponible durante el periodo de votación activo.',
      });
      return;
    }

    const net = await NetInfo.fetch();
    const online = isStateEffectivelyOnline(net, NET_POLICIES.estrict);
    const selected = contractsAvailability?.[type];
    let electionId = selected?.electionId;
    let contractId = selected?.contractId || null;
    let electionName = selected?.electionName || null;
    let backendElectionType = selected?.backendElectionType || null;

    if (!electionId && dni) {
      try {
        const cached = await getAttestationAvailabilityCache(dni);
        const elections = Array.isArray(cached?.availableElections)
          ? cached.availableElections
          : [];
        let wantedElectionType = null;
        if (type === 'ALCALDE') wantedElectionType = 'municipal';
        else if (type === 'GOBERNADOR') wantedElectionType = 'departamental';
        const match = wantedElectionType
          ? elections.find(e => e?.electionType === wantedElectionType && !!e?.canAttest)
          : null;
        electionId = match?.electionId || null;
        contractId = match?.contract?.id || contractId;
        electionName = match?.electionName || electionName;
        backendElectionType = match?.electionType || backendElectionType;
      } catch { }
    }
    if (!electionId) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'No disponible',
        message: selected?.reason || 'No tienes contratos activos para esta elección en tu ubicación.',
      });
      return;
    }

    const selectedElectionContext = buildSelectedElectionContext({
      contractId,
      electionId,
      electionName,
      electionType:
        backendElectionType ||
        (type === 'ALCALDE'
          ? 'municipal'
          : type === 'GOBERNADOR'
          ? 'departamental'
          : type),
      territory: {
        type: 'unknown',
        locationId: contractsAvailability?.nearestLocation?._id || null,
        locationName: contractsAvailability?.nearestLocation?.name || null,
      },
      allowedParties: [],
      source: online ? 'backend' : 'cache',
    });
    if (dni) {
      await saveSelectedElectionContext(dni, selectedElectionContext);
    }

    const params = {
      targetScreen: 'UnifiedParticipation',
      electionType: type,
      electionId,
      selectedElectionContext,
    };
    if (online) {
      if (dni) {
        const cachedVotePlace = await getVotePlace(dni);
        const cachedLocationId =
          cachedVotePlace?.location?._id || cachedVotePlace?.location?.id;
        if (cachedLocationId) {
          const fastProbe = await backendProbe({ timeoutMs: 1500 });
          if (!fastProbe?.ok) {
            navigation.navigate(StackNav.UnifiedParticipationScreen, {
              ...params,
              dni,
              locationId: cachedLocationId,
              locationData: cachedVotePlace.location,
              fromCache: true,
              offline: true,
            });
            return;
          }
        }
      }
      navigation.navigate(StackNav.ElectoralLocations, params);
      return;
    }
    if (!dni) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'Sin conexión',
        message: 'No se pudo detectar tu DNI para cargar tu recinto.',
      });
      return;
    }
    const cached = await getVotePlace(dni);
    if (cached?.location?._id) {
      navigation.navigate(StackNav.UnifiedParticipationScreen, {
        ...params,
        dni,
        locationId: cached.location._id,
        locationData: cached.location,
        fromCache: true,
        offline: true,
      });
    } else {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'Sin conexión',
        message: 'Necesitas conexión para escoger tu recinto por primera vez.',
      });
    }
  };

  const handleRegisterPlacePress = useCallback(async () => {
    if (!dni) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'Sin conexión',
        message: 'No se pudo detectar tu DNI para registrar tu recinto.',
      });
      return;
    }

    const net = await NetInfo.fetch();
    const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
    if (!online) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'Sin conexión',
        message: 'Necesitas conexión a internet para registrar tu recinto por primera vez.',
      });
      return;
    }

    const probe = await backendProbe({ timeoutMs: 2000 });
    if (!probe?.ok) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'Sin conexión',
        message: 'Necesitas conexión a internet para registrar tu recinto por primera vez.',
      });
      return;
    }

    navigation.navigate(StackNav.ElectoralLocationsSave, { dni });
  }, [dni, navigation]);

  const ActionButtonsLoader = () => {
    return (
      <View style={stylesx.availabilityLoaderCard}>
        <View style={stylesx.availabilityLoaderRow}>
          <ActivityIndicator size="small" color="#41A44D" />
          <CText style={stylesx.availabilityLoaderTitle}>
            Buscando eventos electorales...
          </CText>
        </View>

        <CText style={stylesx.availabilityLoaderSubtitle}>
          Verificando acceso según tu ubicación actual.
        </CText>
      </View>
    );
  };

  const ActionButtonsGroup = () => {
    // Si está offline y no tiene recinto registrado, mostrar mensaje claro antes de acciones.
    if (shouldShowRegisterAlert && !isHomeOnline) {
      return (
        <View style={stylesx.warningContractCard}>
          <Ionicons
            name="information-circle-outline"
            size={32}
            color="#F59E0B"
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <CText style={stylesx.warningContractTitle}>
              Registra tu recinto para usar modo sin internet
            </CText>
            <CText style={stylesx.warningContractText}>
              No tienes recinto registrado. Conéctate a internet para registrar tu recinto y
              luego podrás continuar con datos locales.
            </CText>
          </View>
        </View>
      );
    }

    const electionWindow = resolveElectionWindowState(electionStatus);
    if (electionWindow.known && !electionWindow.enabled) {
      // Si no hay elección activa (o está fuera de periodo), no mostrar bloque.
      return null;
    }

    // CASO 0: No se ha concedido ubicación → mostrar botón "Activar Ubicación"
    if (locationStatus !== 'granted') {
      return (
        <TouchableOpacity
          style={stylesx.activateLocationBtn}
          activeOpacity={0.8}
          onPress={handleActivateLocation}>
          <View style={stylesx.activateLocationIconBox}>
            <Ionicons name="location-outline" size={24} color="#F59E0B" />
          </View>
          <View style={stylesx.splitBtnContent}>
            <CText style={stylesx.activateLocationTitle}>Activar Ubicación</CText>
            <CText style={stylesx.activateLocationDescription}>
              Activa tu ubicación para ver las opciones de envío de hojas de trabajo.
            </CText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D97706" />
        </TouchableOpacity>
      );
    }
    const showAlcalde = !!contracts?.ALCALDE?.enabled;
    const showGobernador = !!contracts?.GOBERNADOR?.enabled;

    // CASO 1: Ninguno habilitado -> Mostrar Aviso
    if (!showAlcalde && !showGobernador) {
      return (
        <View style={stylesx.warningContractCard}>
          <Ionicons name="warning-outline" size={32} color="#F59E0B" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <CText style={stylesx.warningContractTitle}>No puedes enviar hojas de trabajo desde aquí</CText>
            <CText style={stylesx.warningContractText}>
              Esta ubicación no está habilitada para el envío de hojas de trabajo. Verifica tu ubicación o muevete a otra zona.
            </CText>
          </View>
        </View>
      );
    }

    // CASO 2 y 3: Mostrar botones según corresponda
    return (
      <View style={{ width: '100%' }}>
        {showAlcalde && (
          <TouchableOpacity
            style={stylesx.splitBtn}
            activeOpacity={0.8}
            onPress={() => handleParticiparPress('ALCALDE')}>

            <View style={stylesx.splitBtnIconBox}>
              {/* Icono Casita / Alcaldía */}
              <Ionicons name="business-outline" size={24} color="#41A44D" />
            </View>

            <View style={stylesx.splitBtnContent}>
              <CText style={stylesx.cardTitle}>Enviar Hoja de Trabajo Alcalde</CText>
              <CText style={stylesx.cardDescription}>Revisa o sube una hoja de trabajo municipal</CText>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        )}

        {showGobernador && (
          <TouchableOpacity
            style={stylesx.splitBtn}
            activeOpacity={0.8}
            onPress={() => handleParticiparPress('GOBERNADOR')}>

            <View style={stylesx.splitBtnIconBox}>
              {/* Icono Mapa / Gobernación */}
              <Ionicons name="map-outline" size={24} color="#41A44D" />
            </View>

            <View style={stylesx.splitBtnContent}>
              <CText style={stylesx.cardTitle}>Enviar Hoja de Trabajo Gobernador</CText>
              <CText style={stylesx.cardDescription}>Revisa o sube una hoja de trabajo departamental</CText>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const checkQueue = async () => {
        try {
          const list = await getOfflineQueue();

          const pending = (list || []).some(
            i => isQueueWriteTask(i?.task?.type),
          );

          if (isActive) setHasPendingActa(pending);
        } catch { }
      };
      checkQueue();
      const t = setInterval(checkQueue, 4000); // refresca cada 4s mientras está enfocada
      return () => {
        isActive = false;
        clearInterval(t);
      };
    }, []),
  );

  useEffect(() => {
    let active = true;

    NetInfo.fetch().then(state => {
      if (!active) return;
      setIsHomeOnline(isStateEffectivelyOnline(state, NET_POLICIES.balanced));
    });

    const unsub = NetInfo.addEventListener(state => {
      if (!active) return;
      setIsHomeOnline(isStateEffectivelyOnline(state, NET_POLICIES.balanced));
    });

    return () => {
      active = false;
      unsub && unsub();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkUserVotePlaceRef.current?.({ forceSync: false });
      fetchElectionStatus();
      requestLocationAndCheckAvailabilityRef.current?.();
      loadVotingElectionRef.current?.();

      if (FEATURE_FLAGS.ENABLE_VOTING_FLOW && refreshVotingState) {
        refreshVotingStateRef.current?.();
      }

      let alive = true;
      // intenta una vez al enfocar
      runOfflineQueueOnce();
      // escucha cambios de red mientras esta pantalla está activa
      const unsubNet = NetInfo.addEventListener(state => {
        const online = isStateEffectivelyOnline(state, NET_POLICIES.balanced);
        if (online && alive) {
          runOfflineQueueOnce();

          // opcional: recheck cuando vuelve el internet
          requestLocationAndCheckAvailabilityRef.current?.();
          loadVotingElectionRef.current?.();

          if (FEATURE_FLAGS.ENABLE_VOTING_FLOW && refreshVotingState) {
            refreshVotingStateRef.current?.();
          }
        }
      });
      return () => {
        alive = false;
        unsubNet && unsubNet();
      };
    }, [
      runOfflineQueueOnce,
      fetchElectionStatus,
    ]),
  );

  // Datos del carrusel
  const carouselData = [
    {
      id: 1,
      title: '¿Necesita una app blockchain?',
      subtitle: 'Blockchain Consultora desarrolló esta aplicación, contáctelos',
      buttonText: 'Más Info',
      backgroundColor: '#e8f5e8',
      image: require('../../../assets/images/block-con.png'),
      onPress: () => Linking.openURL('https://blockchainconsultora.com/es'),
    },
    {
      id: 2,
      title: 'Asoblockchain',
      subtitle: 'Impulsamos el Futuro con Blockchain',
      buttonText: 'Conocer más',
      backgroundColor: '#e8f0ff',
      image: require('../../../assets/images/block-aso.png'),
      onPress: () => Linking.openURL('https://asoblockchainbolivia.org/'),
    },
  ];

  // Auto-scroll del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const nextIndex = (currentCarouselIndex + 1) % carouselData.length;
        carouselRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentCarouselIndex(nextIndex);
      }
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [currentCarouselIndex, carouselData.length]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(JWT_KEY);
      delete axios.defaults.headers.common['Authorization'];
      await clearSession();
      dispatch(clearWallet());
      dispatch(clearAuth());

      navigation.reset({
        index: 0,
        routes: [{ name: StackNav.AuthNavigation }],
      });
    } catch (err) { }
  };

  const ensureNotificationsApiKey = useCallback(async () => {
    const now = Date.now();
    if (now < notificationsAuthRetryAtRef.current) {
      return null;
    }
    if (notificationsApiKeyRef.current) {
      return notificationsApiKeyRef.current;
    }
    if (!userData?.did || !userData?.privKey) return null;
    try {
      const key = await authenticateWithBackend(userData.did, userData.privKey);
      notificationsApiKeyRef.current = key;
      notificationsAuthRetryAtRef.current = 0;
      return key;
    } catch {
      notificationsApiKeyRef.current = null;
      notificationsAuthRetryAtRef.current =
        Date.now() + NOTIFICATIONS_AUTH_RETRY_MS;
      return null;
    }
  }, [userData?.did, userData?.privKey]);

  const refreshNotificationBadgeCount = useCallback(async () => {
    if (!auth?.isAuthenticated || !dni) {
      setNotificationUnreadCount(0);
      return;
    }

    const seenKey = buildNotificationSeenKey(dni);
    const applyUnreadFromList = async list => {
      const localList = await getLocalStoredNotifications(dni);
      const mergedList = mergeAndDedupeNotifications({
        localList,
        remoteList: list,
      });
      const seenRaw = await AsyncStorage.getItem(seenKey);
      const seenAt = Number(seenRaw || 0);
      const timestamps = mergedList
        .map(extractNotificationTimestamp)
        .filter(ts => ts > 0);

      if (!seenAt) {
        const baseline = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
        await AsyncStorage.setItem(seenKey, String(baseline));
        setNotificationUnreadCount(0);
        return;
      }

      const unread = mergedList.reduce((acc, notification) => {
        const timestamp = extractNotificationTimestamp(notification);
        return timestamp > seenAt ? acc + 1 : acc;
      }, 0);

      setNotificationUnreadCount(unread);
    };

    const cacheKey = LOOKUP_CACHE_KEYS.notifications(dni);
    const cachedEntry = await getCache(cacheKey);
    const cachedList = Array.isArray(cachedEntry?.data) ? cachedEntry.data : [];
    await applyUnreadFromList(cachedList);


    const cacheFresh = await isFresh(cacheKey, LOOKUP_CACHE_TTLS.notificationsMs);
    if (cacheFresh) {
      return;
    }

    const state = await NetInfo.fetch();
    if (!isStateEffectivelyOnline(state)) {
      return;
    }

    // No bloquear la consulta real de notificaciones por un health probe
    // transitorio. El endpoint /users/:dni/notifications puede responder bien
    // aunque /health falle o expire.
    await backendProbe({ timeoutMs: 2000 }).catch(() => null);

    try {
      const apiKey = await ensureNotificationsApiKey();
      if (!apiKey) return;

      const response = await axios.get(
        `${BACKEND_RESULT}/api/v1/users/${dni}/notifications`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          timeout: 10000,
        },
      );

      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const seenRaw = await AsyncStorage.getItem(seenKey);
      const seenAt = Number(seenRaw || 0);
      await alertNewBackendNotifications({
        dni,
        notifications: list,
        minTimestampExclusive: seenAt,
      });

      await setCache(cacheKey, list, { version: 'notifications-v1' });
      await applyUnreadFromList(list);
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 401 || status === 403) {
        notificationsApiKeyRef.current = null;
        notificationsAuthRetryAtRef.current =
          Date.now() + NOTIFICATIONS_AUTH_RETRY_MS;
      }
      // No bloquear Home por error de notificaciones.
    }
  }, [auth?.isAuthenticated, dni, ensureNotificationsApiKey]);

  useEffect(() => {
    refreshNotificationBadgeCountRef.current = refreshNotificationBadgeCount;
  }, [refreshNotificationBadgeCount]);

  const handleOpenNotifications = useCallback(async () => {
    try {
      if (dni) {
        const seenKey = buildNotificationSeenKey(dni);
        await AsyncStorage.setItem(seenKey, String(Date.now()));
      }
    } catch {
      // continuar navegación aunque falle el guardado local
    }
    setNotificationUnreadCount(0);
    navigation.navigate(StackNav.Notification);
  }, [dni, navigation]);

  useEffect(() => {
    notificationsApiKeyRef.current = null;
    notificationsAuthRetryAtRef.current = 0;
  }, [userData?.did, userData?.privKey, dni]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refresh = async () => {
        if (!active) return;
        await refreshNotificationBadgeCount();
      };

      refresh();
      const intervalId = setInterval(refresh, 10000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [refreshNotificationBadgeCount]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!auth?.isAuthenticated) return undefined;
      const unsubscribe = messaging().onMessage(() => {
        setNotificationUnreadCount(prev => (prev < 99 ? prev + 1 : 99));
        setTimeout(() => {
          refreshNotificationBadgeCount();
        }, 1200);
      });

      return () => {
        unsubscribe && unsubscribe();
      };
    }, [auth?.isAuthenticated, refreshNotificationBadgeCount]),
  );

  const { hasBackup } = useBackupCheck();

  const normalizeVotePlace = srv => {
    const loc = srv?.location || {};
    const tab = srv?.table || {};
    const hasLocation = !!(loc && Object.keys(loc).length);
    const hasTable = !!(tab && Object.keys(tab).length);
    return {
      location: hasLocation
        ? {
          ...loc,
          _id: loc._id || loc.id,
          id: loc.id || loc._id,
        }
        : undefined,
      table: hasTable
        ? {
          ...tab,
          _id: tab._id || tab.id,
          id: tab.id || tab._id,
          tableId: tab.tableId || tab._id || tab.id,
          tableCode: tab.tableCode || tab.code || tab.codigo,
          tableNumber: String(
            tab.tableNumber || tab.numero || tab.number || '',
          ),
        }
        : undefined,
    };
  };

  const checkUserVotePlace = useCallback(async ({ forceSync = false } = {}) => {
    if (!dni) {
      setShouldShowRegisterAlert(false);
      setCheckingVotePlace(false);
      votePlaceSyncRef.current.lastSyncAt = 0;
      return;
    }

    const cachedBefore = await getVotePlace(dni);
    const hasLocationCached = !!(cachedBefore?.location?._id || cachedBefore?.location?.id);

    setShouldShowRegisterAlert(!hasLocationCached);

    // Si ya hay cache local, no bloqueamos la UI mientras sincroniza backend.
    if (hasLocationCached) {
      setCheckingVotePlace(false);
    }

    const now = Date.now();
    const lastSyncAt = votePlaceSyncRef.current.lastSyncAt || 0;
    const votePlaceCooldownMs = hasLocationCached
      ? VOTE_PLACE_SYNC_COOLDOWN_MS
      : VOTE_PLACE_SYNC_COOLDOWN_NO_CACHE_MS;
    const isRecentSync = now - lastSyncAt < votePlaceCooldownMs;

    if (!forceSync && (votePlaceSyncRef.current.inFlight || isRecentSync)) {
      return;
    }

    if (!hasLocationCached) {
      setCheckingVotePlace(true);
    }

    votePlaceSyncRef.current.inFlight = true;

    try {
      const probe = await backendProbe({ timeoutMs: 2000 });
      votePlaceSyncRef.current.lastSyncAt = Date.now();
      if (!probe?.ok) {
        return;
      }


      const res = await axios.get(
        `${BACKEND_RESULT}/api/v1/users/${dni}/vote-place`,
        {
          timeout: 10000,

        },
      );

      if (res?.data) {
        const normalizedVotePlace = normalizeVotePlace(res.data);
        const hasLocationFromBackend =
          !!(normalizedVotePlace?.location?._id || normalizedVotePlace?.location?.id);

        if (!hasLocationFromBackend) {
          if (hasLocationCached) {
            setShouldShowRegisterAlert(false);
            return;
          }
          await clearVotePlace(dni);
          setShouldShowRegisterAlert(true);
          return;
        }

        const cachedLocationId =
          cachedBefore?.location?._id || cachedBefore?.location?.id;
        const normalizedLocationId =
          normalizedVotePlace?.location?._id || normalizedVotePlace?.location?.id;
        const canMergeCachedLocation =
          !!cachedLocationId &&
          !!normalizedLocationId &&
          String(cachedLocationId) === String(normalizedLocationId);

        const location = normalizedVotePlace.location
          ? {
            ...(canMergeCachedLocation ? cachedBefore?.location || {} : {}),
            ...normalizedVotePlace.location,
            _id: normalizedVotePlace.location._id || normalizedVotePlace.location.id,
            id: normalizedVotePlace.location.id || normalizedVotePlace.location._id,
          }
          : undefined;

        await saveVotePlace(dni, {
          dni,
          userId: res.data.userId,
          location,
          table: undefined,
        });
        warmTablesCacheByLocationId({
          locationId: location?._id || location?.id,
          seedTables: location?.tables || [],
        }).catch(() => { });

        const hasLocation = !!location?._id;

        setShouldShowRegisterAlert(!hasLocation);
      } else {
        if (hasLocationCached) {

          setShouldShowRegisterAlert(false);
          return;
        }
        await clearVotePlace(dni);
        setShouldShowRegisterAlert(true);
      }
    } catch (e) {
      votePlaceSyncRef.current.lastSyncAt = Date.now();
      const status = Number(e?.response?.status || 0);
      if (status === 404) {
        if (hasLocationCached) {
          setShouldShowRegisterAlert(false);
          return;
        }
        await clearVotePlace(dni);
        setShouldShowRegisterAlert(true);
        return;
      }

      setShouldShowRegisterAlert(!hasLocationCached);
    } finally {
      votePlaceSyncRef.current.inFlight = false;
      setCheckingVotePlace(false);
    }
  }, [dni]);

  useEffect(() => {
    if (!dni) return;
    checkUserVotePlace({ forceSync: true });
  }, [dni, checkUserVotePlace]);

  useEffect(() => {
    checkUserVotePlaceRef.current = checkUserVotePlace;
  }, [checkUserVotePlace]);



  const data = {
    name: subject.fullName || '(sin nombre)',
    hash: userData?.account?.slice(0, 10) + '…' || '(sin hash)',
  };
  const userFullName = data.name || '(sin nolombre)';

  const onPressLogout = () => setLogoutModalVisible(true);

  const menuItems = [
    {
      icon: 'people-outline',
      title: I18nStrings.sendAct,
      description: I18nStrings.sendActDescription,
      onPress: handleParticiparPress,
      iconComponent: Ionicons,
    },
    {
      icon: 'megaphone-outline',
      title: I18nStrings.announceCount,
      description: I18nStrings.announceCountDescription,
      onPress: () =>
        navigation.navigate(StackNav.ElectoralLocations, {
          targetScreen: 'AnnounceCount',
        }),
      iconComponent: Ionicons,
    },
    {
      icon: 'bar-chart-outline',
      title: FEATURE_FLAGS.ENABLE_VOTING_FLOW
        ? VotingStrings.myParticipations
        : I18nStrings.myWitnesses,
      description: I18nStrings.myWitnessesDescription,
      onPress: () => navigation.navigate(
        FEATURE_FLAGS.ENABLE_VOTING_FLOW
          ? StackNav.VotingParticipationsScreen
          : StackNav.MyWitnessesListScreen
      ),
      iconComponent: Ionicons,
    },
  ];
  const currentParticipationId =
    (votingState.participations || []).find(
      item => String(item?.electionId || '') === String(votingElection?.id || ''),
    )?.id ||
    (votingState.lastReceipt?.electionId === votingElection?.id
      ? votingState.lastReceipt?.id
      : null) ||
    votingState.participationId ||
    null;


  const [loadVoteMsg, setLoadVoteMsg] = useState(null);
  const getVotingParticipationForElection = electionId =>
    (votingState.participations || []).find(
      item => String(item?.electionId || '') === String(electionId || ''),
    ) || null;

  const handleVotingPress = async targetElection => {
    setLoadVoteMsg('Verificando credenciales...');
    const selectedElection = targetElection || votingElection;
    if (!selectedElection?.id) {
      setLoadVoteMsg(null);
      return;
    }

    try {
      const hasCredential = await checkClaimedCredForVote(selectedElection.id, userData.did, userData.privKey);
      if (!hasCredential) {
        const claimed = await claimForVote(selectedElection.id, userData.dni, userData.did, userData.privKey);
        if (!claimed) {
          throw new Error('Credential not claimed');
        }
      }
    } catch (error) {
      captureError(error, {
        flow: 'voting_flow',
        step: 'claim_nullifier',
        critical: true,
        allowPii: true,
      })
      setInfoModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo obtener la credencial de voto necesaria para participar. Intenta nuevamente más tarde.',
      });
      setLoadVoteMsg(null);
      return;
    }

    setLoadVoteMsg(null);
    navigation.navigate(StackNav.VotingCandidateScreen, {
      electionId: selectedElection.id,
      election: selectedElection,
      isInVotePlace: selectedElection.presentialKioskEnabled
    });
  };
  const handleVotingDetailsPress = targetElection => {
    const selectedElection = targetElection || votingElection;
    const isUpcomingElection =
      Number(selectedElection?.startsAt || 0) > Date.now() &&
      !selectedElection?.alreadyVoted;

    if (isUpcomingElection) {
      navigation.navigate(StackNav.VotingNotificationDetailScreen, {
        notification: {
          mesa: selectedElection?.title || 'Detalle de elección',
          kind: 'voting_event',
          statusTone: selectedElection?.isEligible ? 'success' : 'danger',
          direccion: selectedElection?.instituteName || '',
          votingStartLabel: selectedElection?.startsAt
            ? new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(selectedElection.startsAt))
            : '',
          votingEndLabel: selectedElection?.closesAt
            ? new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(selectedElection.closesAt))
            : '',
          data: {
            bannerTitle: selectedElection?.isEligible
              ? 'Habilitado para votar'
              : 'No habilitado para votar',
            body: selectedElection?.instituteName || '',
          },
        },
      });
      return;
    }

    const participation = getVotingParticipationForElection(selectedElection?.id);
    if (participation?.id) {
      navigation.navigate(StackNav.VotingReceiptScreen, {
        participationId: participation.id,
        electionId: selectedElection?.id,
        allowBack: true,
      });
      return;
    }

    if (
      currentParticipationId &&
      String(votingElection?.id || '') === String(selectedElection?.id || '')
    ) {
      navigation.navigate(StackNav.VotingReceiptScreen, {
        participationId: currentParticipationId,
        electionId: selectedElection?.id,
        allowBack: true,
      });
      return;
    }

    navigation.navigate(StackNav.VotingParticipationsScreen);
  };
  const renderVotingElectionCarousel = () => {
    if (
      !FEATURE_FLAGS.ENABLE_VOTING_FLOW ||
      votingState.isLoading ||
      loadingVotingElection ||
      votingElections.length === 0
    ) {
      return null;
    }

    const cardWidth = isTablet && isLandscape
      ? Math.min(screenWidth * 0.36, 440)
      : screenWidth - getResponsiveSize(32, 40, 48);

    const renderVotingCard = item => {
      const participation = getVotingParticipationForElection(item?.id);
      const hasVotedForElection =
        Boolean(participation) || Boolean(item?.alreadyVoted);
      const isSyncedForElection =
        Boolean(participation?.synced) || Boolean(item?.alreadyVoted);

      return (
        <ElectionCard
          hasVoted={hasVotedForElection}
          voteSynced={isSyncedForElection}
          isEligible={Boolean(item?.isEligible)}
          election={item}
          onVotePress={() => handleVotingPress(item)}
          onDetailsPress={() => handleVotingDetailsPress(item)}
          loadMsg={
            loadVoteMsg &&
            String(item?.id || '') === String(votingElection?.id || '')
              ? loadVoteMsg
              : null
          }
        />
      );
    };

    if (votingElections.length === 1) {
      return (
        <View style={stylesx.votingCarouselContainer}>
          <View style={stylesx.singleVotingCardContainer}>
            {renderVotingCard(votingElections[0])}
          </View>
        </View>
      );
    }

    return (
      <View style={stylesx.votingCarouselContainer}>
        <FlashList
          data={votingElections}
          keyExtractor={(item, index) => String(item?.id || index)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="center"
          onMomentumScrollEnd={event => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / cardWidth,
            );
            setCurrentVotingElectionIndex(
              Math.max(0, Math.min(index, votingElections.length - 1)),
            );
          }}
          renderItem={({item}) => <View style={{width: cardWidth}}>{renderVotingCard(item)}</View>}
        />
        {votingElections.length > 1 && (
          <View style={stylesx.votingPageIndicators}>
            {votingElections.map((item, index) => (
              <View
                key={String(item?.id || index)}
                style={[
                  stylesx.pageIndicator,
                  index === currentVotingElectionIndex &&
                    stylesx.activePageIndicator,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };
  const retryableFailedItems = (queueFailModal.failedItems || []).filter(
    item => item?.removedFromQueue !== true,
  );
  const firstRetryableFailedId = retryableFailedItems?.[0]?.id;
  const canRetryFailedItems = retryableFailedItems.length > 0;
  const firstVotingFailedItem = (queueFailModal.failedItems || []).find(
    item => item?.type === 'votingFlowVote',
  );
  const canReleaseFailedVote =
    Boolean(firstVotingFailedItem?.id) && !canRetryFailedItems;
  const queueFailPrimaryText = canRetryFailedItems ? 'Reintentar' : 'Aceptar';
  const queueFailTertiaryText = firstRetryableFailedId
    ? 'Eliminar'
    : canReleaseFailedVote
      ? 'Volver a votar'
      : undefined;

  return (
    <CSafeAreaView testID="homeContainer" style={stylesx.bg}>
      {votingSyncBanner.visible && (
        <View style={stylesx.votingSyncBanner}>
          <CText style={stylesx.votingSyncBannerText}>
            {votingSyncBanner.message}
          </CText>
        </View>
      )}
      {/* Modal de cerrar sesión */}
      <Modal
        testID="homeLogoutModal"
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View
          testID="homeLogoutModalOverlay"
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            testID="homeLogoutModalContent"
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 28,
              alignItems: 'center',
              width: '80%',
            }}>
            <CText
              testID="homeLogoutModalTitle"
              style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              {I18nStrings.areYouSureWantToLogout ||
                '¿Seguro que quieres cerrar sesión?'}
            </CText>
            <View
              testID="homeLogoutModalButtons"
              style={{ flexDirection: 'row', marginTop: 18, gap: 16 }}>
              <TouchableOpacity
                testID="homeLogoutModalCancelButton"
                style={{
                  backgroundColor: '#f5f5f5',
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={() => setLogoutModalVisible(false)}>
                <CText
                  testID="homeLogoutModalCancelText"
                  style={{ color: '#222', fontWeight: '600' }}>
                  {I18nStrings.cancel || 'Cancelar'}
                </CText>
              </TouchableOpacity>
              <TouchableOpacity
                testID="homeLogoutModalConfirmButton"
                style={{
                  backgroundColor: '#E72F2F',
                  paddingVertical: 10,
                  paddingHorizontal: 22,
                  borderRadius: 8,
                }}
                onPress={handleLogout}>
                <CText
                  testID="homeLogoutModalConfirmText"
                  style={{ color: '#fff', fontWeight: '600' }}>
                  {I18nStrings.logOut || 'Cerrar sesión'}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tablet Landscape Layout */}
      {isTablet && isLandscape ? (
        <View style={stylesx.tabletLandscapeContainer}>
          {/* Left Column: Header and Welcome */}
          <View style={stylesx.tabletLeftColumn}>
            <View style={stylesx.headerRow}>
              <MiVotoLogo />
              <View style={stylesx.headerIcons}>
                <TouchableOpacity
                  onPress={handleOpenNotifications}
                  style={stylesx.notificationIconButton}>
                  <Ionicons
                    name={'notifications-outline'}
                    size={getResponsiveSize(24, 28, 32)}
                    color={'#41A44D'}
                  />
                  {notificationUnreadCount > 0 && (
                    <View style={stylesx.notificationBadge}>
                      <CText style={stylesx.notificationBadgeText}>
                        {notificationUnreadCount > 99
                          ? '99+'
                          : String(notificationUnreadCount)}
                      </CText>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onPressLogout}>
                  <Ionicons
                    name="log-out-outline"
                    size={getResponsiveSize(24, 28, 32)}
                    color="#E72F2F"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={stylesx.welcomeContainer}>
              <View style={stylesx.welcomeHeader}>
                <View style={stylesx.welcomeTextContainer}>
                  <CText style={stylesx.bienvenido}>{I18nStrings.homeWelcome}</CText>
                  <CText style={stylesx.nombre}>{userFullName}!</CText>
                </View>
              </View>
            </View>

            {/* Carrusel deslizable */}
            <View style={stylesx.carouselContainer}>
              <FlashList
                ref={carouselRef}
                data={carouselData}
                renderItem={({ item }) => <CarouselItem item={item} />}
                keyExtractor={item => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={event => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / screenWidth,
                  );
                  setCurrentCarouselIndex(index);
                }}
              />
              <View style={stylesx.pageIndicators}>
                {carouselData.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      stylesx.pageIndicator,
                      index === currentCarouselIndex &&
                      stylesx.activePageIndicator,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
          {renderVotingElectionCarousel()}

          {!hasBackup && (
            <RegisterAlertCard
              title={I18nStrings.backupAccount}
              description={I18nStrings.backupAccountDescription}
              onPress={() =>
                navigation.navigate(StackNav.RecuperationQR)
              }
            />
          )}

          {!checkingVotePlace && shouldShowRegisterAlert && (
            <RegisterAlertCard
              title={I18nStrings.registerPlace}
              description={I18nStrings.registerPlaceDescription}
              onPress={handleRegisterPlacePress}
            />
          )}

          <View style={stylesx.tabletRightColumn}>
            {/* --- AQUÍ CAMBIA EL GRID DE BOTONES --- */}
            <View style={stylesx.gridParent}>
              {/* Participar (arriba, ocupa dos columnas) */}
              {/* <TouchableOpacity
                style={[stylesx.gridDiv1, stylesx.card]}
                activeOpacity={0.87}
                onPress={menuItems[0].onPress}
                testID="participateButton">
                {React.createElement(menuItems[0].iconComponent, {
                  name: menuItems[0].icon,
                  size: getResponsiveSize(30, 36, 42),
                  color: '#41A44D',
                  style: { marginBottom: getResponsiveSize(6, 8, 10) },
                })}

                <CText style={stylesx.cardTitle}>{menuItems[0].title}</CText>
                <CText style={stylesx.cardDescription}>
                  {menuItems[0].description}
                </CText>
              </TouchableOpacity> */}

              <View style={stylesx.gridDiv1}>
                {loadingAvailability ? <ActionButtonsLoader /> : <ActionButtonsGroup />}
              </View>
              <View style={stylesx.gridRow2}>
                {/* Anunciar conteo */}
                {/* <TouchableOpacity
                  style={[stylesx.gridDiv2, stylesx.card]}
                  activeOpacity={0.87}
                  onPress={menuItems[1].onPress}
                  testID="announceCountButtonTablet">
                  {React.createElement(menuItems[1].iconComponent, {
                    name: menuItems[1].icon,
                    size: getResponsiveSize(30, 36, 42),
                    color: '#41A44D',
                    style: { marginBottom: getResponsiveSize(6, 8, 10) },
                  })}
                  <CText style={[stylesx.cardTitle]}>
                    {menuItems[1].title}
                  </CText>
                  <CText style={[stylesx.cardDescription]}>
                    {menuItems[1].description}
                  </CText>
                </TouchableOpacity> */}
                {/* Mis atestiguamientos */}
                <TouchableOpacity
                  style={[stylesx.gridDiv3, stylesx.card, stylesx.myWitnessesCard]}
                  activeOpacity={0.87}
                  onPress={menuItems[2].onPress}
                  testID="myWitnessesButton">
                  {hasPendingActa && (
                    <View style={stylesx.cardBadge}>
                      <ActivityIndicator size="small" color="#41A44D" />
                    </View>
                  )}
                  <View style={stylesx.cardHeaderRow}>
                    {React.createElement(menuItems[2].iconComponent, {
                      name: menuItems[2].icon,
                      size: getResponsiveSize(30, 36, 42),
                      color: '#fff',
                      style: stylesx.cardHeaderIcon,
                    })}
                    <CText
                      style={[stylesx.cardTitle1, stylesx.cardTitleInline]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}>
                      {menuItems[2].title}
                    </CText>
                  </View>
                  <CText style={[stylesx.cardDescription, stylesx.cardDescriptionEmph]}>
                    {menuItems[2].description}
                  </CText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Regular Layout: Phones and Tablet Portrait */
        <View style={stylesx.regularContainer}>
          <View style={stylesx.headerRow}>
            <MiVotoLogo />
            <View style={stylesx.headerIcons}>
              <TouchableOpacity
                testID="notificationsButton"
                onPress={handleOpenNotifications}
                style={stylesx.notificationIconButton}>
                <Ionicons
                  name={'notifications-outline'}
                  size={getResponsiveSize(24, 28, 32)}
                  color={'#41A44D'}
                />
                {notificationUnreadCount > 0 && (
                  <View style={stylesx.notificationBadge} testID="notificationsBadge">
                    <CText style={stylesx.notificationBadgeText}>
                      {notificationUnreadCount > 99
                        ? '99+'
                        : String(notificationUnreadCount)}
                    </CText>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={onPressLogout} testID="logoutButton">
                <Ionicons
                  name="log-out-outline"
                  size={getResponsiveSize(24, 28, 32)}
                  color="#E72F2F"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* ===== Bienvenida ===== */}
          <View style={stylesx.welcomeContainer}>
            <View style={stylesx.welcomeHeader}>
              <View style={stylesx.welcomeTextContainer}>
                <CText style={stylesx.bienvenido}>{I18nStrings.homeWelcome}</CText>
                <CText style={stylesx.nombre}>{userFullName}!</CText>
              </View>
            </View>
          </View>
          <ScrollView>
            {/* Carrusel deslizable */}
            <View style={stylesx.carouselContainer}>
              <FlashList
                ref={carouselRef}
                data={carouselData}
                renderItem={({ item }) => <CarouselItem item={item} />}
                keyExtractor={item => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={event => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / screenWidth,
                  );
                  setCurrentCarouselIndex(index);
                }}
              />
              <View style={stylesx.pageIndicators}>
                {carouselData.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      stylesx.pageIndicator,
                      index === currentCarouselIndex &&
                      stylesx.activePageIndicator,
                    ]}
                  />
                ))}
              </View>
            </View>

            {renderVotingElectionCarousel()}

            {!hasBackup && (
              <RegisterAlertCard
                title={I18nStrings.backupAccount}
                description={I18nStrings.backupAccountDescription}
                onPress={() =>
                  navigation.navigate(StackNav.RecuperationQR)
                }
              />
            )}

            {!checkingVotePlace && shouldShowRegisterAlert && (
              <RegisterAlertCard
                title={I18nStrings.registerPlace}
                description={I18nStrings.registerPlaceDescription}
                onPress={handleRegisterPlacePress}
              />
            )}

            {/* --- AQUÍ CAMBIA EL GRID DE BOTONES --- */}
            <View style={stylesx.gridParent}>
              {/* Participar (arriba, ocupa dos columnas) */}
              {/* <TouchableOpacity
                style={[
                  stylesx.gridDiv1,
                  stylesx.card,
                  { flexDirection: 'row', alignItems: 'center' },
                ]}
                activeOpacity={0.87}
                onPress={menuItems[0].onPress}
                testID="participateButtonRegular">
                {React.createElement(menuItems[0].iconComponent, {
                  name: menuItems[0].icon,
                  size: getResponsiveSize(40, 50, 60),
                  color: '#41A44D',
                  style: { marginRight: getResponsiveSize(6, 8, 10) },
                })}

                <View style={{ flex: 1 }}>
                  <CText style={stylesx.cardTitle}>{menuItems[0].title}</CText>
                  <CText style={stylesx.cardDescription}>
                    {menuItems[0].description}
                  </CText>
                </View>
              </TouchableOpacity>
              */}
              <View style={stylesx.gridDiv1}>
                {loadingAvailability ? <ActionButtonsLoader /> : <ActionButtonsGroup />}
              </View>
              <View style={stylesx.gridRow2}>
                {/* Anunciar conteo */}
                {/* <TouchableOpacity
                  style={[stylesx.gridDiv2, stylesx.card]}
                  activeOpacity={0.87}
                  onPress={menuItems[1].onPress}
                  testID="announceCountButtonRegular">
                  {React.createElement(menuItems[1].iconComponent, {
                    name: menuItems[1].icon,
                    size: getResponsiveSize(30, 36, 42),
                    color: '#41A44D',
                    style: { marginBottom: getResponsiveSize(6, 8, 10) },
                  })}
                  <CText style={[stylesx.cardTitle]}>{menuItems[1].title}</CText>
                  <CText style={[stylesx.cardDescription]}>
                    {menuItems[1].description}
                  </CText>
                </TouchableOpacity> */}
                {/* Mis atestiguamientos */}
                <TouchableOpacity
                  style={[stylesx.gridDiv3, stylesx.card, stylesx.myWitnessesCard]}
                  activeOpacity={0.87}
                  onPress={menuItems[2].onPress}
                  testID="myWitnessesButtonRegular">
                  {hasPendingActa && (
                    <View style={stylesx.cardBadge}>
                      <ActivityIndicator size="small" color="#ff0000ff" />
                    </View>
                  )}
                  <View style={stylesx.cardHeaderRow}>
                    {React.createElement(menuItems[2].iconComponent, {
                      name: menuItems[2].icon,
                      size: getResponsiveSize(30, 36, 42),
                      color: '#41A44D',
                      style: stylesx.cardHeaderIcon,
                    })}
                    <CText
                      style={[stylesx.cardTitle1, stylesx.cardTitleInline]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}>
                      {menuItems[2].title}
                    </CText>
                  </View>
                  <CText style={[stylesx.cardDescription, stylesx.cardDescriptionEmph]}>
                    {menuItems[2].description}
                  </CText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
      <CustomModal
        visible={permissionModal.visible}
        onClose={() => setPermissionModal(m => ({ ...m, visible: false }))}
        type={permissionModal.type}
        title={permissionModal.title}
        message={permissionModal.message}
        buttonText={permissionModal.primaryText}
        onButtonPress={permissionModal.onPrimary}
        secondaryButtonText={permissionModal.secondaryText}
        onSecondaryPress={permissionModal.onSecondary}
      />
      <CustomModal
        visible={!!infoModal.visible}
        onClose={() => setInfoModal(m => ({ ...m, visible: false }))}
        type={infoModal.type}
        title={infoModal.title}
        message={infoModal.message}
        buttonText={'Aceptar'}
      />
      <CustomModal
        visible={queueFailModal.visible}
        onClose={() => setQueueFailModal(m => ({ ...m, visible: false }))}
        type="warning"
        title={deriveQueueFailTitle(queueFailModal.failedItems)}
        message={queueFailModal.message}
        buttonText={queueFailPrimaryText}
        onButtonPress={canRetryFailedItems
          ? handleQueueRetry
          : () => setQueueFailModal(m => ({ ...m, visible: false }))}
        tertiaryButtonText={queueFailTertiaryText}
        onTertiaryPress={firstRetryableFailedId
          ? () => handleRemoveFailedItem(firstRetryableFailedId)
          : canReleaseFailedVote
            ? () => handleRemoveFailedItem(firstVotingFailedItem?.id)
            : undefined}
        tertiaryVariant="danger"
      />
    </CSafeAreaView>
  );
}

const stylesx = StyleSheet.create({
  votingSyncBanner: {
    position: 'absolute',
    top: getResponsiveSize(14, 18, 22),
    left: getResponsiveSize(16, 20, 24),
    right: getResponsiveSize(16, 20, 24),
    zIndex: 20,
    backgroundColor: '#1F7A36',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  votingSyncBannerText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: getResponsiveSize(13, 14, 16),
  },
  gridParent: {
    width: '100%',
    marginTop: getResponsiveSize(10, 13, 16),
    paddingRight: getResponsiveSize(16, 20, 24),
    paddingLeft: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(10, 13, 16),
  },
  gridDiv1: {
    flexDirection: 'column',
    width: '100%',
    marginBottom: getResponsiveSize(10, 13, 16),
  },
  gridRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridDiv2: {
    flex: 1,
    marginRight: getResponsiveSize(6, 10, 14),
  },
  gridDiv3: {
    flex: 1,
    // No marginRight aquí, así queda a la derecha
  },
  bg: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 0,
  },
  // Tablet Landscape Layout Styles
  tabletLandscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletLeftColumn: {
    flex: 0.4,
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  tabletRightColumn: {
    flex: 0.6,
    paddingLeft: getResponsiveSize(8, 12, 16),
  },
  regularContainer: {
    height: '105%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 16, 20),
    paddingBottom: getResponsiveSize(2, 4, 6),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagBox: {
    width: getResponsiveSize(32, 38, 44),
    height: getResponsiveSize(32, 38, 44),
    marginRight: getResponsiveSize(1, 2, 3),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  flagStripe: {
    position: 'absolute',
    left: getResponsiveSize(9, 11, 13),
    width: getResponsiveSize(16, 19, 22),
    height: getResponsiveSize(4, 5.3, 6),
    borderRadius: 2,
    zIndex: 2,
  },
  flagCheckOutline: {
    position: 'absolute',
    left: getResponsiveSize(1, 2, 3),
    top: getResponsiveSize(4, 5, 6),
    width: getResponsiveSize(24, 28, 32),
    height: getResponsiveSize(24, 28, 32),
    borderWidth: getResponsiveSize(2.8, 3.3, 3.8),
    borderColor: '#292D32',
    borderRadius: getResponsiveSize(5, 6, 7),
    zIndex: 1,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: getResponsiveSize(7, 8, 9),
  },
  logoTitle: {
    fontSize: getResponsiveSize(21, 26, 30),
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#8B9399',
    fontWeight: '400',
    marginTop: -2,
    marginLeft: 2,
  },
  welcomeContainer: {
    marginTop: getResponsiveSize(10, 13, 16),
    marginLeft: getResponsiveSize(18, 21, 24),
    marginBottom: getResponsiveSize(12, 16, 20),
    ...(isTablet &&
      isLandscape && {
      marginTop: getResponsiveSize(40, 50, 60),
      marginBottom: getResponsiveSize(20, 25, 30),
    }),
  },
  bienvenido: {
    fontSize: getResponsiveSize(18, 22, 26),
    color: '#41A44D',
    fontWeight: '700',
    marginBottom: -2,
    letterSpacing: -0.5,
    ...(isTablet &&
      isLandscape && {
      fontSize: getResponsiveSize(24, 28, 32),
    }),
  },
  nombre: {
    fontSize: getResponsiveSize(18, 22, 26),
    color: '#232323',
    fontWeight: '700',
    marginBottom: 0,
    letterSpacing: -0.5,
    ...(isTablet &&
      isLandscape && {
      fontSize: getResponsiveSize(24, 28, 32),
    }),
  },
  // Banner Blockchain Consultora
  bannerBC: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: getResponsiveSize(12, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 22),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bcLogoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#41A44D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  bcLogoImage: {
    width: getResponsiveSize(40, 45, 50),
    height: getResponsiveSize(40, 45, 50),
    marginRight: getResponsiveSize(12, 16, 20),
  },
  bcLogoText: {
    color: '#41A44D',
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: -1,
    fontFamily: undefined,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232323',
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#232323',
    marginTop: 2,
    opacity: 0.87,
  },
  bannerButton: {
    backgroundColor: '#4CA950',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 18,
    marginLeft: 14,
    alignSelf: 'center',
  },
  bannerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      CARDS_PER_ROW === 4
        ? 'space-around'
        : isTablet
          ? 'flex-start'
          : 'space-between',
    paddingHorizontal: getResponsiveSize(8, 12, 16),
    marginTop: getResponsiveSize(6, 10, 14),
    ...(isTablet && {
      gap:
        CARDS_PER_ROW === 4
          ? getResponsiveSize(8, 12, 16)
          : getResponsiveSize(12, 16, 20),
    }),
    ...(isTablet &&
      isLandscape && {
      marginTop: getResponsiveSize(20, 25, 30),
      paddingHorizontal: getResponsiveSize(12, 16, 20),
    }),
  },
  card: {
    minHeight: getResponsiveSize(100, 116, 140),
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(14, 17, 20),
    borderWidth: getResponsiveSize(1.1, 1.3, 1.5),
    borderColor: '#E0E0E0',
    alignItems: 'flex-start',
    padding: getResponsiveSize(14, 18, 22),
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    ...(isTablet &&
      CARDS_PER_ROW === 2 && {
      marginRight: getResponsiveSize(8, 12, 16),
    }),
  },
  cardTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#232323',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  cardTitle1: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#232323',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  cardHeaderIcon: {
    marginRight: getResponsiveSize(8, 10, 12),
  },
  cardTitleInline: {
    flex: 1,
    minWidth: 0,
  },
  cardDescription: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#282828',
    fontWeight: '400',
    marginTop: 1,
    marginBottom: -3,
    opacity: 0.78,
  },
  cardDescriptionEmph: {
    fontSize: getResponsiveSize(14, 16, 18),
    opacity: 0.9,
  },
  myWitnessesCard: {
    borderRightWidth: getResponsiveSize(3, 4, 5),
    borderRightColor: '#41A44D',
  },
  // Gas Indicator Styles
  gasContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: getResponsiveSize(10, 12, 14),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    minWidth: getResponsiveSize(80, 90, 100),
  },
  gasLabel: {
    fontSize: getResponsiveSize(10, 11, 12),
    color: '#6c757d',
    fontWeight: '500',
  },
  gasPrice: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#4CAF50',
    fontWeight: '700',
  },
  // Welcome Section Styles
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingRight: getResponsiveSize(16, 20, 24),
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: getResponsiveSize(20, 24, 28),
  },
  // Header Styles
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 12, 16),
  },
  notificationIconButton: {
    position: 'relative',
    padding: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E72F2F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
  // Carousel Styles
  carouselContainer: {
    marginVertical: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(30, 24, 28),
  },
  carouselItem: {
    width: screenWidth - getResponsiveSize(32, 40, 48),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(12, 16, 20),
    minHeight: getResponsiveSize(110, 130, 140),
    backgroundColor: '#E8F5E9',
    padding: getResponsiveSize(12, 18, 18),
    // position: 'relative',
    // paddingBottom: CTA_HEIGHT + CTA_MARGIN, // espacio para el botón
  },
  carouselGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // Columna izquierda (logo)
  carouselLeft: {
    width: LEFT_COL_WIDTH,
    marginRight: getResponsiveSize(12, 16, 20),
    justifyContent: 'flex-start', // ← antes estaba 'center'
    alignItems: 'center',
    paddingTop: getResponsiveSize(2, 4, 6),
  },
  carouselContent: {
    flex: 1,
  },
  carouselMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  carouselTextContainer: {
    // flex: 1,
    // flexShrink: 1,
    // marginLeft: getResponsiveSize(0, 0, 0),
    // marginRight: 0,
    // paddingRight: CTA_WIDTH + CTA_MARGIN,
  },
  carouselArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveSize(28, 32, 36),
    height: getResponsiveSize(28, 32, 36),
  },
  carouselRight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  carouselTitle: {
    fontSize: getResponsiveSize(16, 18, 22),
    fontWeight: '700',
    color: '#232323', // Texto oscuro como en la imagen
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  carouselSubtitle: {
    fontSize: getResponsiveSize(13, 14, 16),
    color: '#232323', // Texto oscuro como en la imagen
    lineHeight: getResponsiveSize(18, 20, 22),
    marginBottom: getResponsiveSize(8, 12, 16),
    opacity: 0.87,
  },
  carouselButton: {
    position: 'absolute',
    right: CTA_MARGIN,
    bottom: CTA_MARGIN,
    backgroundColor: '#4CA950',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  carouselButtonInline: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CA950',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    // Sombra opcional:
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  carouselButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '700',
    color: '#fff',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(6, 8, 10),
  },
  votingCarouselContainer: {
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  singleVotingCardContainer: {
    width: '100%',
  },
  votingPageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(2, 4, 6),
    gap: getResponsiveSize(6, 8, 10),
  },
  pageIndicator: {
    width: getResponsiveSize(6, 8, 10),
    height: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(3, 4, 5),
    backgroundColor: '#d1d5db',
  },
  activePageIndicator: {
    backgroundColor: '#4CAF50',
    width: getResponsiveSize(16, 20, 24),
  },
  logoImage: {
    width: getResponsiveSize(32, 38, 44),
    height: getResponsiveSize(32, 38, 44),
  },
  disabledItem: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#999999',
  },
  disabledIcon: {
    opacity: 0.6,
  },
  cardBadge: {
    position: 'absolute',
    top: getResponsiveSize(10, 12, 14),
    right: getResponsiveSize(10, 12, 14),
    backgroundColor: '#f8a1a1ff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activateLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(10, 12, 14),
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  activateLocationIconBox: {
    width: getResponsiveSize(42, 48, 54),
    height: getResponsiveSize(42, 48, 54),
    borderRadius: getResponsiveSize(10, 12, 14),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(12, 16, 18),
  },
  activateLocationTitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '700',
    color: '#92400E',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  activateLocationDescription: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#B45309',
    lineHeight: getResponsiveSize(17, 19, 22),
  },
  splitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(10, 12, 14),

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  splitBtnIconBox: {
    width: getResponsiveSize(42, 48, 54),
    height: getResponsiveSize(42, 48, 54),
    borderRadius: getResponsiveSize(10, 12, 14),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(12, 16, 18),
  },
  splitBtnContent: {
    flex: 1,
  },

  warningContractCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(10, 12, 14),
  },
  warningContractTitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '700',
    color: '#92400E', // Marrón oscuro/dorado
    marginBottom: 2,
  },
  warningContractText: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#B45309',
    flexWrap: 'wrap',
  },
  availabilityLoaderCard: {
    backgroundColor: '#FFF',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  availabilityLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  availabilityLoaderTitle: {
    marginLeft: 10,
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '700',
    color: '#232323',
  },

  availabilityLoaderSubtitle: {
    marginTop: 6,
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#6B7280',
  },

});
