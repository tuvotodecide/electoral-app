import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';
import { BACKEND_RESULT } from '@env';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const formatEventDate = value => {
  const parsed = Date.parse(String(value || ''));
  if (!Number.isFinite(parsed)) {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(parsed));
};

const DEFAULT_NOTIFICATION = {
  title: 'Resultados disponibles',
  kind: 'election_results',
  tipo: 'Ver ganador',
  direccion: 'Resultados preliminares disponibles',
  actionLabel: 'Ver detalles',
  actionUrl: null,
  data: {
    bannerTitle: 'Resultados publicados',
    body: 'Consulta los resultados publicados de esta votación.',
  },
};

const API_BASE = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1`;

const colorPalette = [
  '#1e40af',
  '#059669',
  '#dc2626',
  '#7c3aed',
  '#0ea5e9',
  '#f59e0b',
];

const resolvePublicResultsUrl = notification => {
  const rawData = notification?.data || {};
  const directUrl =
    notification?.actionUrl ||
    rawData?.actionUrl ||
    rawData?.publicUrl ||
    null;

  if (directUrl) {
    return directUrl;
  }

  const relativePath = rawData?.publicPath || rawData?.link || null;
  if (!relativePath || !String(relativePath).startsWith('/')) {
    return null;
  }

  const backendBase = String(BACKEND_RESULT || '').trim();
  if (!backendBase) {
    return null;
  }

  try {
    const url = new URL(backendBase);
    url.pathname = String(relativePath);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
};

const mapResultsSummaryFromDetail = detail => {
  const options = Array.isArray(detail?.options) ? detail.options : [];
  const resultRows = Array.isArray(detail?.results) ? detail.results : [];
  const votesByOption = new Map(
    resultRows.map(result => [String(result?.option ?? ''), Number(result?.votes ?? 0)]),
  );

  const mapped = options.map((option, index) => {
    const partyName = String(option?.name ?? `Opcion ${index + 1}`);
    const firstCandidate =
      Array.isArray(option?.candidates) && option.candidates.length > 0
        ? option.candidates[0]
        : null;
    const votes = votesByOption.get(partyName) ?? 0;

    return {
      id: String(option?.id ?? `option-${index + 1}`),
      name: firstCandidate?.name ?? partyName,
      party: partyName,
      colorHex: option?.color ?? colorPalette[index % colorPalette.length],
      votes,
      percent: 0,
    };
  });

  const totalVotes = mapped.reduce((sum, candidate) => sum + candidate.votes, 0);

  return mapped
    .map(candidate => ({
      ...candidate,
      percent: totalVotes > 0 ? Number(((candidate.votes * 100) / totalVotes).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4);
};

const NotificationDetailScreen = () => {
  const route = useRoute();
  const notification = route?.params?.notification || DEFAULT_NOTIFICATION;
  const rawData = notification?.data || {};
  const kind = notification?.kind || 'generic';
  const statusTone = notification?.statusTone || 'success';
  const startsAtLabel = notification?.votingStartLabel || formatEventDate(rawData?.votingStart);
  const endsAtLabel = notification?.votingEndLabel || formatEventDate(rawData?.votingEnd);
  const [remoteResultsSummary, setRemoteResultsSummary] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(kind === 'election_results');
  const resolvedPublicUrl = resolvePublicResultsUrl(notification);
  const eventId = String(rawData?.eventId || notification?.eventId || '').trim();
  const resultsSummary = Array.isArray(notification?.resultsSummary) && notification.resultsSummary.length > 0
    ? notification.resultsSummary
    : remoteResultsSummary;

  useEffect(() => {
    if (kind !== 'election_results' || !eventId) {
      setResultsLoading(false);
      return;
    }

    let mounted = true;
    const loadPublicDetail = async () => {
      try {
        setResultsLoading(true);
        const response = await fetch(
          `${API_BASE}/voting/events/public/detail/${encodeURIComponent(eventId)}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          },
        );

        if (!response.ok) {
          throw new Error('No se pudo cargar el detalle publico');
        }

        const detail = await response.json();
        if (!mounted) {
          return;
        }

        setRemoteResultsSummary(mapResultsSummaryFromDetail(detail));
      } catch {
        if (mounted) {
          setRemoteResultsSummary([]);
        }
      } finally {
        if (mounted) {
          setResultsLoading(false);
        }
      }
    };

    loadPublicDetail();
    return () => {
      mounted = false;
    };
  }, [eventId, kind]);

  const heroConfig = useMemo(() => {
    if (kind === 'election_results') {
      return {
        backgroundColor: '#1F7A36',
        iconName: 'podium-outline',
        iconBg: 'rgba(255,255,255,0.18)',
        title: rawData?.bannerTitle || 'Resultados publicados',
        subtitle: '',
        textColor: '#FFFFFF',
      };
    }

    if (kind === 'voting_event' && statusTone === 'danger') {
      return {
        backgroundColor: '#B91C1C',
        iconName: 'close-circle-outline',
        iconBg: 'rgba(255,255,255,0.16)',
        title: 'No habilitado para votar',
        subtitle: '',
        textColor: '#FFFFFF',
      };
    }

    return {
      backgroundColor: '#1F7A36',
      iconName: 'checkmark-circle-outline',
      iconBg: 'rgba(255,255,255,0.16)',
      title: rawData?.bannerTitle || 'Habilitado para votar',
      subtitle: '',
      textColor: '#FFFFFF',
    };
  }, [kind, rawData?.bannerTitle, statusTone]);

  const handlePrimaryAction = () => {
    const targetUrl = resolvedPublicUrl;

    if (!targetUrl) {
      return;
    }

    Linking.openURL(targetUrl).catch(() => {});
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.notificationHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <CText type="B20" style={styles.title}>
            {notification?.mesa || notification?.title || DEFAULT_NOTIFICATION.title}
          </CText>
          {kind === 'election_results' ? null : (
            <CText type="R14" style={styles.subtitle}>
              {rawData?.body || notification?.direccion || ''}
            </CText>
          )}
        </View>

        <View style={[styles.heroCard, { backgroundColor: heroConfig.backgroundColor }]}>
          <View style={[styles.heroIcon, { backgroundColor: heroConfig.iconBg }]}>
            <Ionicons name={heroConfig.iconName} size={34} color="#FFFFFF" />
          </View>
          {kind === 'generic' && (
            <CText type="B18" style={[styles.heroTitle, { color: heroConfig.textColor }]}>
              {heroConfig.title}
            </CText>
          )}
        </View>

        {kind === 'election_results' ? (
          <View style={styles.sectionCard}>
            <CText type="B16" style={styles.sectionTitle}>
              Resultados
            </CText>
            {resultsLoading ? (
              <View style={styles.loadingResultsBox}>
                <ActivityIndicator size="small" color="#1F7A36" />
                <CText type="R14" style={styles.loadingResultsText}>
                  Cargando resultados...
                </CText>
              </View>
            ) : resultsSummary.length > 0 ? (
              resultsSummary.map(result => (
                <View key={String(result?.id)} style={styles.resultRow}>
                  <View style={styles.resultCopy}>
                    <CText type="M14" style={styles.resultName}>
                      {result?.name}
                    </CText>
                    <CText type="R12" style={styles.resultParty}>
                      {result?.party || 'Candidato'}
                    </CText>
                    {Number(result?.votes || 0) > 0 ? (
                      <CText type="R12" style={styles.resultVotes}>
                        {result.votes} votos
                      </CText>
                    ) : null}
                  </View>
                  <CText type="B16" style={styles.resultPercent}>
                    {Number(result?.percent || 0).toFixed(1)}%
                  </CText>
                </View>
              ))
            ) : (
              <CText type="R14" style={styles.emptyResultsText}>
                Resultados listos para consultar en detalle.
              </CText>
            )}
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <CText type="B16" style={styles.sectionTitle}>
              Fechas de la elección
            </CText>
            {startsAtLabel ? (
              <View style={styles.scheduleRow}>
                <CText type="R14" style={styles.scheduleLabel}>
                  Inicio
                </CText>
                <CText type="M14" style={styles.scheduleValue}>
                  {startsAtLabel}
                </CText>
              </View>
            ) : null}
            {endsAtLabel ? (
              <View style={styles.scheduleRow}>
                <CText type="R14" style={styles.scheduleLabel}>
                  Cierre
                </CText>
                <CText type="M14" style={styles.scheduleValue}>
                  {endsAtLabel}
                </CText>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {kind === 'election_results' ? (
        <View style={styles.bottomContainer}>
          <CButton
            title={notification?.actionLabel || 'Ver detalles'}
            type="B16"
            onPress={handlePrimaryAction}
            containerStyle={styles.actionButton}
            disabled={!resolvedPublicUrl}
            sinMargen
            testID="goToResultsButton"
          />
        </View>
      ) : null}
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 16, 20),
    paddingBottom: getResponsiveSize(120, 128, 136),
  },
  headerSection: {
    marginBottom: getResponsiveSize(18, 22, 26),
  },
  title: {
    color: '#0F172A',
    fontSize: getResponsiveSize(22, 24, 28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  subtitle: {
    color: '#475569',
    fontSize: getResponsiveSize(15, 16, 18),
    lineHeight: getResponsiveSize(22, 24, 26),
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: moderateScale(18),
    paddingVertical: getResponsiveSize(22, 26, 30),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(18, 22, 26),
  },
  heroIcon: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(14, 16, 18),
  },
  heroTitle: {
    textAlign: 'center',
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: getResponsiveSize(18, 22, 26),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    marginBottom: getResponsiveSize(14, 16, 18),
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scheduleLabel: {
    color: '#64748B',
  },
  scheduleValue: {
    flex: 1,
    marginLeft: 12,
    textAlign: 'right',
    color: '#0F172A',
    fontWeight: '600',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultCopy: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    color: '#0F172A',
    fontWeight: '600',
  },
  resultParty: {
    color: '#64748B',
    marginTop: 2,
  },
  resultVotes: {
    color: '#64748B',
    marginTop: 2,
  },
  resultPercent: {
    color: '#1F7A36',
    fontWeight: '700',
  },
  loadingResultsBox: {
    paddingVertical: getResponsiveSize(18, 20, 24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingResultsText: {
    marginTop: 10,
    color: '#64748B',
  },
  emptyResultsText: {
    color: '#475569',
    lineHeight: getResponsiveSize(22, 24, 26),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 14, 16),
    paddingBottom: getResponsiveSize(24, 28, 32),
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    height: getHeight(52),
    borderRadius: moderateScale(14),
  },
});

export default NotificationDetailScreen;
