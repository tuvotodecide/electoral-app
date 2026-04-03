import { BACKEND_RESULT } from '@env';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { requestPushPermissionExplicit } from '../../../services/pushPermission';
import { formatTiempoRelativo } from '../../../services/notifications';
import {
  getLocalStoredNotifications,
  mergeAndDedupeNotifications,
} from '../../../notifications';
import { getCache, setCache } from '../../../utils/lookupCache';
import { authenticateWithBackend } from '../../../utils/offlineQueueHandler';
import { StackNav, TabNav } from '../../../navigation/NavigationKey';
import { FEATURE_FLAGS, DEV_FLAGS } from '../../../config/featureFlags';
import { FlashList } from '@shopify/flash-list';

const buildNotificationSeenKey = dniValue => {
  const normalized = String(dniValue || '')
    .trim()
    .toLowerCase();
  return `@notifications:last-seen:${normalized || 'anon'}`;
};

const notificationsCacheKey = dniValue =>
  `home:notifications:${String(dniValue || '').trim().toLowerCase() || 'anon'}`;

const pad2 = value => String(value).padStart(2, '0');

const formatVotingDate = value => {
  const parsed = Date.parse(String(value || ''));
  if (!Number.isFinite(parsed)) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
};

const formatCountdownLabel = (target, now) => {
  const diff = Number(target || 0) - Number(now || 0);
  if (!Number.isFinite(diff) || diff <= 0) {
    return 'Inició';
  }

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `Inicia en ${days}d ${hours}h`;
  }

  return `Inicia en ${pad2(hours)}:${pad2(minutes)}`;
};

export const resolveVotingEventDescription = (data = {}, body = '') => {
  const eventName = String(
    data?.eventName ||
      data?.title ||
      data?.eventTitle ||
      '',
  ).trim();
  if (eventName) {
    return eventName;
  }

  const normalizedBody = String(body || '').trim();
  const quotedMatch = normalizedBody.match(/["“](.+?)["”]/);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim();
  }

  return normalizedBody;
};

export const getNotificationKind = ({ type, title, body }) => {
  const normalizedType = String(type || '').trim().toUpperCase();
  const haystack = `${String(title || '')} ${String(body || '')}`.toLowerCase();

  if (
    normalizedType === 'ELECTION_RESULTS' ||
    normalizedType === 'INSTITUTIONAL_RESULTS_AVAILABLE' ||
    haystack.includes('resultados')
  ) {
    return 'election_results';
  }

  if (
    normalizedType === 'INSTITUTIONAL_EVENT_PUBLISHED' ||
    normalizedType === 'INSTITUTIONAL_SCHEDULE_UPDATED' ||
    haystack.includes('convocatoria') ||
    haystack.includes('votacion') ||
    haystack.includes('cronograma') ||
    haystack.includes('horario')
  ) {
    return 'voting_event';
  }

  return 'generic';
};

export const mapResultsSummary = data => {
  if (Array.isArray(data?.results?.candidates)) {
    return data.results.candidates
      .map(candidate => ({
        id: String(candidate?.id || candidate?.candidateId || candidate?.name || Math.random()),
        name: candidate?.name || candidate?.partyName || 'Opción',
        percent: Number(candidate?.percent ?? candidate?.percentage ?? 0),
        votes: Number(candidate?.votes ?? 0),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  }

  if (Array.isArray(data?.rankings)) {
    return data.rankings
      .map(candidate => ({
        id: String(candidate?.id || candidate?.candidateId || candidate?.name || Math.random()),
        name: candidate?.name || candidate?.partyName || 'Opción',
        percent: Number(candidate?.percent ?? candidate?.percentage ?? 0),
        votes: Number(candidate?.votes ?? 0),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  }

  return [];
};

export const safeParseNotificationRouteParams = routeParams => {
  if (!routeParams) {
    return {};
  }

  try {
    const parsed = JSON.parse(routeParams);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const buildNotificationNavigationTarget = (
  item,
  { enableVotingFlow = FEATURE_FLAGS.ENABLE_VOTING_FLOW } = {},
) => {
  const rawData = item?.data || {};

  if (enableVotingFlow) {
    if (
      item?.kind === 'election_results' ||
      item?.kind === 'voting_event' ||
      rawData?.type === 'election_results' ||
      rawData?.type === 'INSTITUTIONAL_EVENT_PUBLISHED' ||
      rawData?.type === 'INSTITUTIONAL_SCHEDULE_UPDATED'
    ) {
      return {
        name: StackNav.VotingNotificationDetailScreen,
        params: { notification: item },
      };
    }
  }

  if (rawData?.type === 'worksheet_uploaded') {
    return {
      name: StackNav.TabNavigation,
      params: { screen: TabNav.HomeScreen },
    };
  }

  if (item?.screen === 'SuccessScreen') {
    const paramsFromNotif = safeParseNotificationRouteParams(item.routeParams);
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

    return {
      name: 'SuccessScreen',
      params: {
        ...paramsFromNotif,
        ipfsData: {
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
        },
        certificateData: {
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
        },
        nftData: {
          ...rawNftData,
          nftUrl:
            rawNftData?.nftUrl ||
            (notificationType === 'participation_certificate'
              ? rawData?.imageUrl
              : null),
        },
        notificationType,
        fromNotifications: true,
      },
    };
  }

  if (typeof item?.screen === 'string' && StackNav[item.screen]) {
    return {
      name: item.screen,
      params: safeParseNotificationRouteParams(item.routeParams),
    };
  }

  return null;
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
  const [notificationNow, setNotificationNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNotificationNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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

  const mapServerToUi = useCallback((n, now = Date.now()) => {
    const data = n?.data || {};
    const created = n?.createdAt || n?.timestamp || new Date().toISOString();
    const titleFromBackend = n?.title || data?.title || '';
    const bodyFromBackend = n?.body || data?.body || '';
    const normalizedType = String(data?.type || '').trim().toUpperCase();
    const isScheduleUpdate = normalizedType === 'INSTITUTIONAL_SCHEDULE_UPDATED';
    const notificationKind = getNotificationKind({
      type: data?.type,
      title: titleFromBackend,
      body: bodyFromBackend,
    });

    let mesaLabel = '';
    if (notificationKind === 'voting_event') {
      mesaLabel =
        titleFromBackend ||
        data?.title ||
        data?.eventName ||
        bodyFromBackend ||
        data?.body ||
        'Nueva convocatoria de votación';
    } else if (notificationKind === 'election_results') {
      mesaLabel =
        titleFromBackend ||
        data?.title ||
        data?.eventName ||
        bodyFromBackend ||
        'Resultados disponibles';
    } else if (String(data?.type || '').trim().toLowerCase() === 'acta_published') {
      mesaLabel = titleFromBackend || bodyFromBackend || 'Acta publicada';
    } else if (data.tableNumber) {
      mesaLabel = `Mesa ${String(data.tableNumber)}`;
    } else if (data.tableCode) {
      mesaLabel = data.tableCode;
    } else {
      mesaLabel = titleFromBackend || bodyFromBackend || 'Actualización';
    }

    let tipo = 'Actualizar';
    if (notificationKind === 'voting_event') {
      const startsAt = data?.votingStart || data?.startsAt;
      tipo = isScheduleUpdate
        ? 'Cronograma modificado'
        : startsAt
          ? formatCountdownLabel(Date.parse(String(startsAt)), now)
          : 'Ver convocatoria';
    } else if (notificationKind === 'election_results') {
      tipo = 'Ver ganador';
    } else if (data?.type === 'announce_count') {
      tipo = 'Conteo de Votos';
    } else if (data?.type === 'acta_published') {
      tipo = 'Acta publicada';
    } else if (data?.type === 'participation_certificate') {
      tipo = 'Certificado de participación';
    } else if (data?.type === 'worksheet_uploaded') {
      tipo = 'Hoja de trabajo subida';
    }
    if (notificationKind === 'generic' && String(data?.type || '').trim().toLowerCase() === 'acta_published' && bodyFromBackend) {
      tipo = bodyFromBackend;
    }

    const startsAtLabel = formatVotingDate(data?.votingStart || data?.startsAt);
    const endsAtLabel = formatVotingDate(data?.votingEnd || data?.endsAt);
    const dateRange =
      startsAtLabel && endsAtLabel
        ? `${startsAtLabel} - ${endsAtLabel}`
        : startsAtLabel || endsAtLabel || '';

    const actionUrl =
      data?.actionUrl ||
      data?.publicUrl ||
      n?.actionUrl ||
      null;
    const eligibleFlag =
      typeof data?.eligible === 'string'
        ? data.eligible.toLowerCase() === 'true'
        : data?.eligible === true;

    return {
      id: n?._id || `srv_${created}`,
      raw: n,
      data,
      kind: notificationKind,
      tipo,
      mesa: mesaLabel,
      colegio: data?.locationName || n?.locationName || '',
      direccion:
        notificationKind === 'voting_event'
          ? resolveVotingEventDescription(data, bodyFromBackend) || dateRange
          : notificationKind === 'election_results'
            ? bodyFromBackend || data?.summary || 'Resultados preliminares disponibles'
            : data?.locationAddress || n?.locationAddress || '',
      distancia: data?.distance ?? null,
      timestamp: new Date(created).getTime(),
      estado: data?.status || 'iniciado',
      statusTone:
        notificationKind === 'election_results'
          ? 'success'
          : notificationKind === 'voting_event' && eligibleFlag === false
            ? 'danger'
            : 'success',
      votingStartLabel: startsAtLabel,
      votingEndLabel: endsAtLabel,
      actionUrl,
      resultsSummary: mapResultsSummary(data),
      screen: data?.screen || null,
      routeParams: data?.routeParams || null,
      title: titleFromBackend,
      body: bodyFromBackend,
      isScheduleUpdate,
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

      let resolvedApiKey = apiKey;
      if (!resolvedApiKey && authResolved && userData?.did && userData?.privKey) {
        try {
          resolvedApiKey = await authenticateWithBackend(
            userData.did,
            userData.privKey,
          );
          setApiKey(resolvedApiKey);
        } catch {
          resolvedApiKey = null;
        }
      }

      if (!resolvedApiKey) {
        if (isRefresh) {
          setRefreshing(false);
        }
        if (authResolved) {
          const cachedEntry = await getCache(notificationsCacheKey(dni));
          const cachedList = Array.isArray(cachedEntry?.data) ? cachedEntry.data : [];
          const localList = await getLocalStoredNotifications(dni);
          const mergedList = mergeAndDedupeNotifications({
            localList,
            remoteList: cachedList,
          });
          const mappedCached = mergedList
            .map(item => mapServerToUi(item, notificationNow))
            .sort((a, b) => b.timestamp - a.timestamp);
          setItems(mappedCached);
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
              'x-api-key': resolvedApiKey
            },
            timeout: 30000,
          },
        );
        const list = response?.data?.data || response?.data || [];
        await setCache(notificationsCacheKey(dni), list, { version: 'notifications-v1' });
        const localList = await getLocalStoredNotifications(dni);
        const mergedList = mergeAndDedupeNotifications({
          localList,
          remoteList: list,
        });
        const mapped = mergedList
          .map(item => mapServerToUi(item, notificationNow))
          .sort((a, b) => b.timestamp - a.timestamp);
        setItems(mapped);
        await markNotificationsAsSeen(mapped);
      } catch (error) {
        const cachedEntry = await getCache(notificationsCacheKey(dni));
        const cachedList = Array.isArray(cachedEntry?.data) ? cachedEntry.data : [];
        const localList = await getLocalStoredNotifications(dni);
        const dedupedLocalList = mergeAndDedupeNotifications({
          localList,
          remoteList: cachedList,
        });
        const mappedLocal = dedupedLocalList
          .map(item => mapServerToUi(item, notificationNow))
          .sort((a, b) => b.timestamp - a.timestamp);
        setItems(mappedLocal);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
        setLoading(false);
      }
    },
    [
      dni,
      apiKey,
      authResolved,
      mapServerToUi,
      markNotificationsAsSeen,
      notificationNow,
      userData?.did,
      userData?.privKey,
    ],
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

  // DEV: Mock notification para probar NotificationDetailScreen
  const mockElectionResultsNotification = DEV_FLAGS.FORCE_HAS_NOT_VOTED && FEATURE_FLAGS.ENABLE_VOTING_FLOW
    ? {
        id: 'mock_election_results',
        mesa: 'Resultados Disponibles',
        tipo: 'Ver ganador',
        kind: 'election_results',
        direccion: 'Resultados preliminares de la votación',
        timestamp: Date.now(),
        statusTone: 'success',
        resultsSummary: [
          {id: '1', name: 'Lista 1', percent: 52.4, votes: 412},
          {id: '2', name: 'Lista 2', percent: 38.1, votes: 299},
        ],
        data: {
          type: 'election_results',
          title: 'Resultados Disponibles',
          bannerTitle: 'Resultados Preliminares',
          bannerSubtitle: 'Conteo en tiempo real',
          body: 'Ya están disponibles los primeros resultados preliminares de la votación para "Elección Directiva 2026".',
          actionUrl: 'https://results.tuvotodecide.com',
        },
      }
    : null;

  const displayItems = useMemo(() => {
    const remappedItems = items.map(item =>
      item?.raw ? mapServerToUi(item.raw, notificationNow) : item,
    );

    return mockElectionResultsNotification
      ? [mockElectionResultsNotification, ...remappedItems]
      : remappedItems;
  }, [items, mapServerToUi, mockElectionResultsNotification, notificationNow]);

  const showLoader =
    items.length === 0 && (loading || !authResolved || refreshing);

  const getIconName = useCallback(tipo => {
    switch (tipo) {
      case 'Conteo de Votos':
        return 'megaphone-outline';
      default:
        return 'sparkles-outline';
    }
  }, []);

  const handleNotificationPress = useCallback(
    item => {
      const target = buildNotificationNavigationTarget(item);
      if (!target?.name) {
        return;
      }
      navigation.navigate(target.name, target.params);
    },
    [navigation],
  );
  const renderNotificationItem = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        testID={`notificationItem_${index}`}
        style={localStyle.notificationCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        <View
          testID={`notificationCardContent_${index}`}
          style={localStyle.cardContent}>
          <View
            style={[
              localStyle.iconWrap,
              item.statusTone === 'danger'
                ? localStyle.iconWrapDanger
                : localStyle.iconWrapSuccess,
            ]}>
            <Ionicons
              testID={`notificationIcon_${index}`}
              name={item.kind === 'election_results' ? 'podium-outline' : getIconName(item.tipo)}
              size={26}
              color={item.statusTone === 'danger' ? '#B91C1C' : '#1F7A36'}
            />
          </View>
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
              testID={`notificationAddress_${index}`}
              style={localStyle.detailText}>
              {item.direccion}
            </Text>
            {Array.isArray(item.resultsSummary) && item.resultsSummary.length > 0 ? (
              <View style={localStyle.resultsPreview}>
                {item.resultsSummary.slice(0, 2).map(result => (
                  <View key={result.id} style={localStyle.resultRow}>
                    <Text style={localStyle.resultName} numberOfLines={1}>
                      {result.name}
                    </Text>
                    <Text style={localStyle.resultPercent}>
                      {Number(result.percent || 0).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
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
        <FlashList
          testID="notificationList"
          data={displayItems}
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
  listContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8EEF3',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconWrapSuccess: {
    backgroundColor: '#E8F5E9',
  },
  iconWrapDanger: {
    backgroundColor: '#FEE2E2',
  },
  contentContainer: { flex: 1, marginLeft: 14 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  rightInfo: { alignItems: 'flex-end' },
  distance: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#0F172A',
    marginRight: 10,
    flex: 1,
  },
  time: { color: '#64748B', fontSize: 12, fontWeight: '500', marginTop: 2 },
  subtitle: {
    fontSize: 15,
    color: '#1F7A36',
    marginTop: 2,
    fontWeight: '700',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    marginTop: 6,
    fontWeight: '500',
  },
  resultsPreview: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F7',
    gap: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultName: {
    flex: 1,
    marginRight: 8,
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  resultPercent: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  separator: { height: 14 },
});

