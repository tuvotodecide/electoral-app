import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import CStandardHeader from '../../../components/common/CStandardHeader';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import axios from 'axios';
import { BACKEND_RESULT, VERIFIER_REQUEST_ENDPOINT } from '@env';
import { requestPushPermissionExplicit } from '../../../services/pushPermission';
import { formatTiempoRelativo } from '../../../services/notifications';
import { getLocalStoredNotifications } from '../../../notifications';
import { mockNotificaciones } from '../../../data/mockNotificaciones';
import wira from 'wira-sdk';
import { StackNav, TabNav } from '../../../navigation/NavigationKey';

const buildNotificationSeenKey = dniValue => {
  const normalized = String(dniValue || '')
    .trim()
    .toLowerCase();
  return `@notifications:last-seen:${normalized || 'anon'}`;
};

export default function Notification({ navigation }) {
  const userData = useSelector(state => state.wallet.payload);

  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ||
    subject?.documentNumber ||
    subject?.governmentIdentifier ||
    userData?.dni;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);

  const markNotificationsAsSeen = useCallback(
    async notifications => {
      if (!dni) return;
      const seenKey = buildNotificationSeenKey(dni);
      const latestTimestamp = Array.isArray(notifications)
        ? notifications.reduce((max, item) => Math.max(max, item?.timestamp || 0), 0)
        : 0;
      const seenAt = Math.max(Date.now(), latestTimestamp || 0);
      try {
        await AsyncStorage.setItem(seenKey, String(seenAt));
      } catch {
        // No bloquear por error de storage.
      }
    },
    [dni],
  );

  const mapServerToUi = useCallback(n => {
    const data = n?.data || {};
    const created = n?.createdAt || n?.timestamp || new Date().toISOString();
    let mesaLabel = '';
    if (data.tableNumber) {
      mesaLabel = `Mesa ${String(data.tableNumber)}`;
    } else if (data.tableCode) {
      mesaLabel = data.tableCode;
    } else {
      mesaLabel = n?.title || data?.title || 'Notificación';
    }
    let tipo = 'Notificación';
    if (data?.type === 'announce_count') {
      tipo = 'Conteo de Votos';
    } else if (data?.type === 'acta_published') {
      tipo = 'Acta publicada';
    } else if (data?.type === 'participation_certificate') {
      tipo = 'Certificado de participación';
    } else if (data?.type === 'worksheet_uploaded') {
      tipo = 'Hoja de trabajo subida';
    }

    return {
      id: n?._id || `srv_${created}`,
      raw: n,
      data,
      tipo,
      mesa: mesaLabel,
      colegio: data?.locationName || n?.locationName || 'Recinto',
      direccion: data?.locationAddress || n?.locationAddress || '',
      distancia: data?.distance ?? null,
      timestamp: new Date(created).getTime(),
      estado: data?.status || 'iniciado',

      screen: data?.screen || null,
      routeParams: data?.routeParams || null,
      title: n?.title || data?.title || '',
      body: n?.body || data?.body || '',
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setAuthResolved(false);
    (async () => {
      try {
        const key = await authenticateWithBackend(
          userData?.did,
          userData?.privKey,
        );
        if (mounted) setApiKey(key);
      } catch (e) {
        if (mounted) setApiKey(null);
      } finally {
        if (mounted) setAuthResolved(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userData?.did, userData?.privKey]);


  const fetchFromBackend = useCallback(
    async (isRefresh = false) => {
      if (!dni) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!apiKey) {
        if (isRefresh) {
          setRefreshing(false);
        }
        if (authResolved) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      if (!isRefresh) {
        setLoading(true);
      }

      try {
        const response = await axios.get(
          `${BACKEND_RESULT}/api/v1/users/${dni}/notifications`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            timeout: 30000,
          },
        );
        const list = response?.data?.data || response?.data || [];
        const localList = await getLocalStoredNotifications(dni);
        const mergedList = [
          ...(Array.isArray(localList) ? localList : []),
          ...(Array.isArray(list) ? list : []),
        ];
        const mapped = mergedList
          .map(mapServerToUi)
          .sort((a, b) => b.timestamp - a.timestamp);
        setItems(mapped);
        await markNotificationsAsSeen(mapped);
      } catch (error) {
        const localList = await getLocalStoredNotifications(dni);
        const mappedLocal = (Array.isArray(localList) ? localList : [])
          .map(mapServerToUi)
          .sort((a, b) => b.timestamp - a.timestamp);
        setItems(mappedLocal);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
        setLoading(false);
      }
    },
    [dni, apiKey, authResolved, mapServerToUi, markNotificationsAsSeen],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      requestPushPermissionExplicit().catch(() => {});
      if (mounted) {
        await fetchFromBackend(false);
      }
    })();
    const unsubFocus = navigation.addListener('focus', () => {
      markNotificationsAsSeen([]);
      setRefreshing(true);
      fetchFromBackend(true);
    });
    return () => {
      mounted = false;
      unsubFocus && unsubFocus();
    };
  }, [navigation, fetchFromBackend, markNotificationsAsSeen]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFromBackend(true);
  }, [fetchFromBackend]);

  const showLoader =
    items.length === 0 && (loading || !authResolved || refreshing);

  const getIconName = useCallback(tipo => {
    switch (tipo) {
      case 'Conteo de Votos':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  }, []);

  const handleNotificationPress = useCallback(
    item => {
      const rawData = item?.data || {};
      if (rawData?.type === 'worksheet_uploaded') {
        navigation.navigate(StackNav.TabNavigation, {
          screen: TabNav.HomeScreen,
        });
        return;
      }

      // Solo navegamos si es SuccessScreen
      if (item.screen === 'SuccessScreen') {
        let paramsFromNotif = {};
        if (item.routeParams) {
          try {
            paramsFromNotif = JSON.parse(item.routeParams);
          } catch (e) {
            // si viene mal, no revienta
          }
        }

        const notificationType =
          rawData?.type || paramsFromNotif?.notificationType || null;

        const rawIpfsData =
          paramsFromNotif?.ipfsData && typeof paramsFromNotif.ipfsData === 'object'
            ? paramsFromNotif.ipfsData
            : {};
        const rawCertificateData =
          paramsFromNotif?.certificateData &&
          typeof paramsFromNotif.certificateData === 'object'
            ? paramsFromNotif.certificateData
            : {};
        const rawNftData =
          paramsFromNotif?.nftData && typeof paramsFromNotif.nftData === 'object'
            ? paramsFromNotif.nftData
            : {};

        // Fallback desde data cuando backend no envía routeParams completos.
        const fallbackIpfsData = {
          ...rawIpfsData,
          jsonUrl:
            rawIpfsData?.jsonUrl ||
            rawData?.jsonUrl ||
            rawData?.ipfsUri ||
            null,
          imageUrl:
            rawIpfsData?.imageUrl ||
            (notificationType === 'acta_published' ||
            notificationType === 'worksheet_uploaded'
              ? rawData?.imageUrl
              : null),
          ipfsUri: rawIpfsData?.ipfsUri || rawData?.ipfsUri || null,
          url: rawIpfsData?.url || rawData?.ipfsUrl || null,
        };

        const fallbackCertificateData = {
          ...rawCertificateData,
          imageUrl:
            rawCertificateData?.imageUrl ||
            (notificationType === 'participation_certificate'
              ? rawData?.imageUrl
              : null),
          jsonUrl: rawCertificateData?.jsonUrl || null,
          certificateUrl:
            rawCertificateData?.certificateUrl ||
            (notificationType === 'participation_certificate'
              ? rawData?.imageUrl
              : null),
        };

        const fallbackNftData = {
          ...rawNftData,
          nftUrl:
            rawNftData?.nftUrl ||
            (notificationType === 'participation_certificate'
              ? rawData?.imageUrl
              : null),
        };

        navigation.navigate('SuccessScreen', {
          ...paramsFromNotif,
          ipfsData: fallbackIpfsData,
          certificateData: fallbackCertificateData,
          nftData: fallbackNftData,
          notificationType,
          fromNotifications: true,
        });
        return;
      }

      if (item.screen) {
        let paramsFromNotif = {};
        if (item.routeParams) {
          try {
            paramsFromNotif = JSON.parse(item.routeParams);
          } catch {
            paramsFromNotif = {};
          }
        }
        navigation.navigate(item.screen, paramsFromNotif);
      }
    },
    [navigation],
  );
  const renderNotificationItem = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        testID={`notificationItem_${index}`}
        style={localStyle.notificationCard}
        disabled={item.tipo === 'Conteo de Votos'}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        <View
          testID={`notificationCardContent_${index}`}
          style={localStyle.cardContent}>
          <Ionicons
            testID={`notificationIcon_${index}`}
            name={getIconName(item.tipo)}
            size={38}
            color={'#111'}
            style={{ marginTop: 3 }}
          />
          <View
            testID={`notificationContentContainer_${index}`}
            style={localStyle.contentContainer}>
            <View
              testID={`notificationHeaderRow_${index}`}
              style={localStyle.headerRow}>
              <Text
                testID={`notificationTitle_${index}`}
                style={localStyle.title}>
                {item.mesa}
              </Text>
              <View
                testID={`notificationRightInfo_${index}`}
                style={localStyle.rightInfo}>
                {item.distancia && (
                  <Text
                    testID={`notificationDistance_${index}`}
                    style={localStyle.distance}>
                    {item.distancia}
                  </Text>
                )}
                <Text
                  testID={`notificationTime_${index}`}
                  style={localStyle.time}>
                  {formatTiempoRelativo(item.timestamp)}
                </Text>
              </View>
            </View>
            <Text
              testID={`notificationSubtitle_${index}`}
              style={localStyle.subtitle}>
              {item.tipo}
            </Text>
            <Text
              testID={`notificationCollege_${index}`}
              style={localStyle.detailText}>
              {item.colegio}
            </Text>
            <Text
              testID={`notificationAddress_${index}`}
              style={localStyle.detailText}>
              {item.direccion}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [getIconName, handleNotificationPress],
  );

  return (
    <CSafeAreaView
      testID="notificationScreenContainer"
      style={{ flex: 1, backgroundColor: '#fff' }}
      addTabPadding={false}>
      <CStandardHeader
        testID="notificationHeader"
        title="Notificaciones"
        onPressBack={() => navigation.goBack()}
      />

      {showLoader ? (
        <View testID="notificationLoader" style={localStyle.loaderContainer}>
          <ActivityIndicator size="large" color="#2790b0" />
          <Text style={localStyle.loaderText}>Cargando notificaciones...</Text>
        </View>
      ) : (
        <FlatList
          testID="notificationList"
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={renderNotificationItem}
          contentContainerStyle={localStyle.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View testID="notificationSeparator" style={localStyle.separator} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View
              testID="notificationEmptyState"
              style={{ marginTop: 50, alignItems: 'center' }}>
              <Text testID="notificationEmptyText">No hay notificaciones</Text>
            </View>
          }
        />
      )}
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#2790b0',
  },
  listContent: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 15 },
  notificationCard: { paddingBottom: 6, backgroundColor: '#fff' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  contentContainer: { flex: 1, marginLeft: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  rightInfo: { alignItems: 'flex-end' },
  distance: {
    color: '#2790b0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#111',
    marginRight: 10,
    marginTop: -3,
    flex: 1,
  },
  time: { color: '#2790b0', fontSize: 13, fontWeight: '400', marginTop: 2 },
  subtitle: { fontSize: 16, color: '#111', marginTop: 1, fontWeight: '400' },
  detailText: { fontSize: 14, color: '#444', marginTop: 2, fontWeight: '400' },
  actionHint: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  actionText: {
    color: '#2790b0',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  separator: { height: 1, backgroundColor: '#ededed', marginVertical: 10 },
});

export const authenticateWithBackend = async (did, privateKey) => {
  const request = await axios.get(VERIFIER_REQUEST_ENDPOINT);

  const authData = request.data;
  if (!authData.apiKey || !authData.request) {
    throw new Error('Invalid authentication request response: missing message');
  }

  await wira.authenticateWithVerifier(
    JSON.stringify(authData.request),
    did,
    privateKey
  );

  return authData.apiKey;
}
