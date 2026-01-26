import {
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Linking,
  ScrollView,
  FlatList,
  Image,
  ImageBackground,
  Alert,
  AppState,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import Geolocation from '@react-native-community/geolocation';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../../../redux/slices/authSlice';
import { clearWallet } from '../../../redux/action/walletAction';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import I18nStrings from '../../../i18n/String';
import { AuthNav, StackNav } from '../../../navigation/NavigationKey';
import { useSelector } from 'react-redux';
import { store } from '../../../redux/store';
import { clearSession } from '../../../utils/Session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ELECTION_ID,
  ELECTION_STATUS,
  JWT_KEY,
  KEY_OFFLINE,
} from '../../../common/constants';
import axios from 'axios';
import images from '../../../assets/images';
import { BACKEND_RESULT, BACKEND_SECRET } from '@env';

import { useFocusEffect } from '@react-navigation/native';
import {
  getAll as getOfflineQueue,
  getVotePlace,
  processQueue,
  saveVotePlace,
  removeById,
} from '../../../utils/offlineQueue';
import { ActivityIndicator } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { publishActaHandler } from '../../../utils/offlineQueueHandler';
import CustomModal from '../../../components/common/CustomModal';
import {
  isStateEffectivelyOnline,
  NET_POLICIES,
} from '../../../utils/networkQuality';

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

const RegisterAlertCard = ({ onPress }) => (
  <View style={stylesx.registerAlertCard}>
    <View style={{ flex: 1 }}>
      <CText style={stylesx.registerAlertTitle}>Registrar recinto</CText>
      <CText style={stylesx.registerAlertSubtitle}>
        Registra tu recinto y mesa para recibir avisos.
      </CText>
    </View>

    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={stylesx.registerAlertCta}
      accessibilityRole="button"
      accessibilityLabel="Registrar recinto">
      <Ionicons
        name="arrow-forward"
        size={getResponsiveSize(16, 18, 20)}
        color="#fff"
      />
    </TouchableOpacity>
  </View>
);

// === Banner Blockchain Consultora ===
const BlockchainConsultoraBanner = () => (
  <View testID="homeBlockchainBanner" style={stylesx.bannerBC}>
    <View
      testID="homeBlockchainBannerContent"
      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const wallet = useSelector(s => s.wallet.payload);
  const account = useSelector(state => state.account);
  const auth = useSelector(s => s.auth);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const [hasPendingActa, setHasPendingActa] = useState(false);
  const processingRef = useRef(false);
  const [checkingVotePlace, setCheckingVotePlace] = useState(true);
  const [shouldShowRegisterAlert, setShouldShowRegisterAlert] = useState(false);
  const [electionStatus, setElectionStatus] = useState(null);
  const [contractsAvailability, setContractsAvailability] = useState({
    ALCALDE: { enabled: false, electionId: null, electionName: null, reason: null },
    GOBERNADOR: { enabled: false, electionId: null, electionName: null, reason: null },
    nearestLocation: null,
  });
  const contracts = contractsAvailability;
  const [queueFailModal, setQueueFailModal] = useState({
    visible: false,
    failedItems: [],
    message: '',
  });
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const pendingPermissionFromSettings = useRef(false);
  const availabilityRef = useRef({ lastCheckAt: 0 }); // evita spam en focus

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

  const getHomeLocation = useCallback(async () => {
    const ok = await requestLocationPermission();
    if (!ok) {
      showPermissionModal(
        'Ubicación requerida',
        'Necesitas habilitar la ubicación para verificar si tienes contratos activos en esta zona.',
        openLocationSettings,
      );
      return null;
    }

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
        showPermissionModal(
          'No se pudo obtener ubicación',
          'Activa la ubicación (GPS) e intenta nuevamente.',
          openLocationSettings,
        );
        return null;
      }
    }
  }, [requestLocationPermission]);

  const checkAttestationAvailability = useCallback(
    async (latitude, longitude) => {
      try {
        setLoadingAvailability(true);

        // Si tu endpoint requiere maxDistance, lo mandamos igual que "nearby"
        const res = await axios.get(
          `${BACKEND_RESULT}/api/v1/contracts/check-attestation-availability`,
          {
            timeout: 15000,
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
        const elections = Array.isArray(data?.availableElections) ? data.availableElections : [];

        // ALCALDE -> municipal
        const municipal = elections.find(e => e?.electionType === 'municipal');
        const municipalEnabled = !!municipal?.canAttest;

        // GOBERNADOR -> departamental
        const departamental = elections.find(e => e?.electionType === 'departamental');
        const departamentalEnabled = !!departamental?.canAttest;

        setContractsAvailability({
          nearestLocation: data?.nearestLocation || null,
          ALCALDE: {
            enabled: municipalEnabled,
            electionId: municipalEnabled ? municipal?.electionId : null,
            electionName: municipal?.electionName || null,
            reason: municipal?.reason || null,
          },
          GOBERNADOR: {
            enabled: departamentalEnabled,
            electionId: departamentalEnabled ? departamental?.electionId : null,
            electionName: departamental?.electionName || null,
            reason: departamental?.reason || null,
          },
        });
      } catch (e) {
        // En error: por seguridad, deshabilitamos ambos
        setContractsAvailability({
          nearestLocation: null,
          ALCALDE: { enabled: false, electionId: null, electionName: null, reason: null },
          GOBERNADOR: { enabled: false, electionId: null, electionName: null, reason: null },
        });
      } finally {
        setLoadingAvailability(false);
      }
    },
    [],
  );
  const requestLocationAndCheckAvailability = useCallback(async () => {
    // evita llamar demasiado en focus
    const now = Date.now();
    if (now - (availabilityRef.current.lastCheckAt || 0) < 4000) return;
    availabilityRef.current.lastCheckAt = now;

    // si estás offline, no tiene sentido pedir GPS para endpoint remoto
    const net = await NetInfo.fetch();
    const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
    if (!online) return;

    const coords = await getHomeLocation();
    if (!coords?.latitude || !coords?.longitude) return;

    await checkAttestationAvailability(coords.latitude, coords.longitude);
  }, [getHomeLocation, checkAttestationAvailability]);
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
              setPermissionModal(m => ({ ...m, visible: false }));
              requestLocationAndCheckAvailability();
            } else {
              showPermissionModal(
                'Ubicación requerida',
                'Aún no se otorgó el permiso de ubicación.',
                openLocationSettings,
              );
            }
          } else {
            const status = await Geolocation.requestAuthorization('whenInUse');
            if (status === 'granted') {
              setPermissionModal(m => ({ ...m, visible: false }));
              requestLocationAndCheckAvailability();
            } else {
              showPermissionModal(
                'Ubicación requerida',
                'Aún no se otorgó el permiso de ubicación.',
                openLocationSettings,
              );
            }
          }
        } catch (e) { }
      }
    });

    return () => sub.remove();
  }, [requestLocationAndCheckAvailability]);

  const fetchElectionStatus = useCallback(async () => {
    try {
      const res = await axios.get(
        `${BACKEND_RESULT}/api/v1/elections/config/status`,
        { timeout: 15000 },
      );

      if (res?.data) {
        setElectionStatus(res.data);

        // await AsyncStorage.setItem(ELECTION_STATUS, JSON.stringify(res.data));

        // guardar solo el id de la config
        if (res.data?.config?.id) {
          await AsyncStorage.setItem(ELECTION_ID, String(res.data.config.id));
        }
      }
    } catch (err) {
      console.error('[HOME] fetchElectionStatus error', err);
    }
  }, []);

  const userData = useSelector(state => state.wallet.payload);

  const [infoModal, setInfoModal] = useState({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  const runOfflineQueueOnce = useCallback(async () => {
    if (processingRef.current) return;
    if (!auth?.isAuthenticated || !userData?.privKey || !userData?.account) return;

    const net = await NetInfo.fetch();
    const online = isStateEffectivelyOnline(net, NET_POLICIES.balanced);
    if (!online) return;

    processingRef.current = true;

    try {
      const result = await processQueue(async item => {
        await publishActaHandler(item, userData);
      });

      // Actualiza badge/pending
      if (typeof result?.remaining === 'number') {
        setHasPendingActa(result.remaining > 0);
      } else {
        const listAfter = await getOfflineQueue();
        const pendingAfter = (listAfter || []).some(i => i.task?.type === 'publishActa');
        setHasPendingActa(pendingAfter);
      }

      // NUEVO: si hay fallos, abrir modal con acciones
      if (result?.failed > 0) {
        const failedItems = Array.isArray(result.failedItems) ? result.failedItems : [];
        const first = failedItems[0];

        const header =
          `${result.failed} envío(s) no se pudieron procesar.\n` +
          `Puedes reintentar o eliminar el fallido.\n`;

        const meta =
          first?.tableCode ? `\nMesa: ${first.tableCode}` : '';

        const type =
          first?.type ? `\nTipo: ${first.type}` : '';

        const detail =
          first?.error ? `\n\nError:\n${first.error}` : '';

        setQueueFailModal({
          visible: true,
          failedItems,
          message: header + meta + type + detail,
        });
      }
    } catch (e) {
      // Si aquí cae, es un fallo "global" (poco común en tu implementación)
      setQueueFailModal({
        visible: true,
        failedIds: [],
        message:
          'Ocurrió un error procesando la cola. Puedes reintentar o cancelar.',
      });
    } finally {
      processingRef.current = false;
    }
  }, [auth?.isAuthenticated, userData]);

  const handleRemoveFailedItem = async (id) => {
    try {
      await removeById(id);
      setQueueFailModal(m => ({
        ...m,
        failedItems: (m.failedItems || []).filter(x => x.id !== id),
        visible: ((m.failedItems || []).length - 1) > 0,
      }));

      const listAfter = await getOfflineQueue();
      const pendingAfter = (listAfter || []).some(i => i.task?.type === 'publishActa');
      setHasPendingActa(pendingAfter);
    } catch (e) {
      // opcional: modal informativo
    }
  };

  const handleRemoveAllFailed = async () => {
    try {
      const items = queueFailModal.failedItems || [];
      for (const it of items) {
        await removeById(it.id);
      }

      const listAfter = await getOfflineQueue();
      const pendingAfter = (listAfter || []).some(i => i.task?.type === 'publishActa');
      setHasPendingActa(pendingAfter);
    } finally {
      setQueueFailModal({ visible: false, failedItems: [], message: '' });
    }
  };


  const handleQueueRetry = async () => {
    setQueueFailModal(m => ({ ...m, visible: false }));
    // Reintento inmediato (respeta processingRef)
    runOfflineQueueOnce();
  };

  // const handleQueueCancel = async () => {
  //   try {
  //     const ids = queueFailModal.failedIds || [];
  //     // Si no tenemos ids (por error global), opcionalmente no borrar nada
  //     for (const id of ids) {
  //       await removeById(id);
  //     }

  //     // Refrescar estado pending
  //     const listAfter = await getOfflineQueue();
  //     const pendingAfter = (listAfter || []).some(i => i.task?.type === 'publishActa');
  //     setHasPendingActa(pendingAfter);
  //   } catch (e) {
  //     // opcional: mostrar otro modal informativo
  //   } finally {
  //     setQueueFailModal(m => ({ ...m, visible: false, failedIds: [] }));
  //   }
  // };
  const handleQueueCancel = () => {
    setQueueFailModal(m => ({ ...m, visible: false }));
  };

  const handleParticiparPress = async (type) => {
    const net = await NetInfo.fetch();
    const online = isStateEffectivelyOnline(net, NET_POLICIES.estrict);
    const selected = contractsAvailability?.[type];
    const electionId = selected?.electionId;
    if (!electionId) {
      setInfoModal({
        visible: true,
        type: 'warning',
        title: 'No disponible',
        message: selected?.reason || 'No tienes contratos activos para esta elección en tu ubicación.',
      });
      return;
    }

    const params = {
      targetScreen: 'UnifiedParticipation',
      electionType: type,
      electionId,
    };
    if (online) {
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
        ...(cached.table ? { tableData: cached.table } : {}),
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
  const ActionButtonsLoader = () => {
    return (
      <View style={stylesx.availabilityLoaderCard}>
        <View style={stylesx.availabilityLoaderRow}>
          <ActivityIndicator size="small" color="#41A44D" />
          <CText style={stylesx.availabilityLoaderTitle}>
            Verificando disponibilidad...
          </CText>
        </View>

        <CText style={stylesx.availabilityLoaderSubtitle}>
          Estamos validando si hay contratos activos para enviar actas en tu ubicación.
        </CText>
      </View>
    );
  };

  const ActionButtonsGroup = () => {
    const showAlcalde = !!contracts?.ALCALDE?.enabled;
    const showGobernador = !!contracts?.GOBERNADOR?.enabled;

    // CASO 1: Ninguno habilitado -> Mostrar Aviso
    if (!showAlcalde && !showGobernador) {
      return (
        <View style={stylesx.warningContractCard}>
          <Ionicons name="warning-outline" size={32} color="#F59E0B" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <CText style={stylesx.warningContractTitle}>Envío no disponible</CText>
            <CText style={stylesx.warningContractText}>
              No tienes contratos activos para enviar actas en esta ubicación.
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
              <CText style={stylesx.cardTitle}>Enviar Acta Alcalde</CText>
              <CText style={stylesx.cardDescription}>Revisa o sube un acta municipal</CText>
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
              <CText style={stylesx.cardTitle}>Enviar Acta Gobernador</CText>
              <CText style={stylesx.cardDescription}>Revisa o sube un acta departamental</CText>
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
            i => i.task?.type === 'publishActa',
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

  useFocusEffect(
    useCallback(() => {
      checkUserVotePlace();
      fetchElectionStatus();
      requestLocationAndCheckAvailability();
      let alive = true;
      // intenta una vez al enfocar
      runOfflineQueueOnce();
      // escucha cambios de red mientras esta pantalla está activa
      const unsubNet = NetInfo.addEventListener(state => {
        const online = isStateEffectivelyOnline(state, NET_POLICIES.balanced);
        if (online && alive) {
          runOfflineQueueOnce();

          // opcional: recheck cuando vuelve el internet
          requestLocationAndCheckAvailability();
        }
      });
      return () => {
        alive = false;
        unsubNet && unsubNet();
      };
    }, [runOfflineQueueOnce, fetchElectionStatus, requestLocationAndCheckAvailability]),
  );

  // Datos del carrusel
  const carouselData = [
    {
      id: 1,
      title: '¿Necesita una app blockchain?',
      subtitle: 'Blockchain Consultora desarrollo esta aplicación, contáctelos',
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

  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ??
    subject?.documentNumber ??
    subject?.governmentIdentifier ??
    userData?.dni;

  const normalizeVotePlace = srv => {
    const loc = srv?.location || {};
    const tab = srv?.table || {};
    return {
      location: {
        ...loc,
        _id: loc._id || loc.id,
        id: loc.id || loc._id,
      },
      table:
        tab && Object.keys(tab).length
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
  const checkUserVotePlace = useCallback(async () => {
    if (!dni) {
      setShouldShowRegisterAlert(false);
      setCheckingVotePlace(false);
      return;
    }
    try {
      setCheckingVotePlace(true);
      const res = await axios.get(
        `${BACKEND_RESULT}/api/v1/users/${dni}/vote-place`,
        {
          timeout: 12000,

        },
      );

      if (res?.data) {
        const { location, table } = normalizeVotePlace(res.data);
        await saveVotePlace(dni, {
          dni,
          userId: res.data.userId,
          location,
          table,
        });
      }
      const hasBoth = !!res?.data?.location && !!res?.data?.table;
      setShouldShowRegisterAlert(!hasBoth);
    } catch (e) {
      const cached = await getVotePlace(dni);
      const hasBothCached = !!cached?.location && !!cached?.table;
      setShouldShowRegisterAlert(!hasBothCached);
    } finally {
      setCheckingVotePlace(false);
    }
  }, [dni]);

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
      title: I18nStrings.myWitnesses,
      description: I18nStrings.myWitnessesDescription,
      onPress: () => navigation.navigate(StackNav.MyWitnessesListScreen),
      iconComponent: Ionicons,
    },
  ];
  const firstFailedId = queueFailModal.failedItems?.[0]?.id;

  return (
    <CSafeAreaView testID="homeContainer" style={stylesx.bg}>
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
                  onPress={() => navigation.navigate(StackNav.Notification)}>
                  <Ionicons
                    name={'notifications-outline'}
                    size={getResponsiveSize(24, 28, 32)}
                    color={'#41A44D'}
                  />
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
              <FlatList
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
          {/* {!checkingVotePlace && shouldShowRegisterAlert && (*/}
          {/* <RegisterAlertCard
            onPress={() =>
              navigation.navigate(StackNav.ElectoralLocationsSave, {
                dni,
              })
            }
          /> */}
          {/*)}*/}

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
                <TouchableOpacity
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
                </TouchableOpacity>
                {/* Mis atestiguamientos */}
                <TouchableOpacity
                  style={[stylesx.gridDiv3, stylesx.card]}
                  activeOpacity={0.87}
                  onPress={menuItems[2].onPress}
                  testID="myWitnessesButton">
                  {hasPendingActa && (
                    <View style={stylesx.cardBadge}>
                      <ActivityIndicator size="small" color="#41A44D" />
                    </View>
                  )}
                  {React.createElement(menuItems[2].iconComponent, {
                    name: menuItems[2].icon,
                    size: getResponsiveSize(30, 36, 42),
                    color: '#fff',
                    style: { marginBottom: getResponsiveSize(6, 8, 10) },
                  })}
                  <CText style={stylesx.cardTitle1}>{menuItems[2].title}</CText>
                  <CText style={stylesx.cardDescription}>
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
                onPress={() => navigation.navigate(StackNav.Notification)}>
                <Ionicons
                  name={'notifications-outline'}
                  size={getResponsiveSize(24, 28, 32)}
                  color={'#41A44D'}
                />
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
          {/* Carrusel deslizable */}
          <View style={stylesx.carouselContainer}>
            <FlatList
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
          {/* {!checkingVotePlace && shouldShowRegisterAlert && (
            <RegisterAlertCard
              onPress={() =>
                navigation.navigate(StackNav.ElectoralLocationsSave, {
                  dni,
                })
              }
            />
          )} */}
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
              <TouchableOpacity
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
              </TouchableOpacity>
              {/* Mis atestiguamientos */}
              <TouchableOpacity
                style={[stylesx.gridDiv3, stylesx.card]}
                activeOpacity={0.87}
                onPress={menuItems[2].onPress}
                testID="myWitnessesButtonRegular">
                {hasPendingActa && (
                  <View style={stylesx.cardBadge}>
                    <ActivityIndicator size="small" color="#ff0000ff" />
                  </View>
                )}
                {React.createElement(menuItems[2].iconComponent, {
                  name: menuItems[2].icon,
                  size: getResponsiveSize(30, 36, 42),
                  color: '#41A44D',
                  style: { marginBottom: getResponsiveSize(6, 8, 10) },
                })}
                <CText style={stylesx.cardTitle1}>{menuItems[2].title}</CText>
                <CText style={stylesx.cardDescription}>
                  {menuItems[2].description}
                </CText>
              </TouchableOpacity>
            </View>
          </View>
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
        title="Subida de pendientes"
        message={queueFailModal.message}
        buttonText="Reintentar"
        onButtonPress={handleQueueRetry}
        secondaryButtonText="Cancelar"
        onSecondaryPress={handleQueueCancel}
        tertiaryButtonText={firstFailedId ? "Eliminar fallido" : undefined}
        onTertiaryPress={firstFailedId ? () => handleRemoveFailedItem(firstFailedId) : undefined}
        tertiaryVariant="danger"
      />
    </CSafeAreaView>
  );
}

const stylesx = StyleSheet.create({
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
    flex: 1,
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
    flex: 1,
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
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '700',
    color: '#232323',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  cardDescription: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#282828',
    fontWeight: '400',
    marginTop: 1,
    marginBottom: -3,
    opacity: 0.78,
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
  registerAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2', // rojo claro
    borderColor: '#FCA5A5', // borde rojo suave
    borderWidth: 1,
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(14, 16, 20),
    marginHorizontal: getResponsiveSize(16, 20, 24),
    // marginTop: getResponsiveSize(10, 12, 16),
    marginBottom: getResponsiveSize(8, 10, 12),
    // sombra sutil
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  registerAlertTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  registerAlertSubtitle: {
    fontSize: getResponsiveSize(12, 13, 14),
    color: '#7F1D1D',
    opacity: 0.9,
  },
  registerAlertCta: {
    width: getResponsiveSize(36, 40, 44),
    height: getResponsiveSize(36, 40, 44),
    borderRadius: 999,
    backgroundColor: '#E72F2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getResponsiveSize(10, 12, 16),
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
