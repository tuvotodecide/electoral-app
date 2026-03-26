import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
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

const NotificationDetailScreen = () => {
  const route = useRoute();
  const notification = route?.params?.notification || DEFAULT_NOTIFICATION;
  const rawData = notification?.data || {};
  const kind = notification?.kind || 'generic';
  const statusTone = notification?.statusTone || 'success';
  const startsAtLabel = notification?.votingStartLabel || formatEventDate(rawData?.votingStart);
  const endsAtLabel = notification?.votingEndLabel || formatEventDate(rawData?.votingEnd);
  const resultsSummary = Array.isArray(notification?.resultsSummary)
    ? notification.resultsSummary
    : [];
  const resolvedPublicUrl = resolvePublicResultsUrl(notification);

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
          {kind !== 'voting_event' && (
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
            {resultsSummary.length > 0 ? (
              resultsSummary.slice(0, 3).map(result => (
                <View key={String(result?.id)} style={styles.resultRow}>
                  <View style={styles.resultCopy}>
                    <CText type="M14" style={styles.resultName}>
                      {result?.name}
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
                Los resultados se estan preparando para esta elección.
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
  resultVotes: {
    color: '#64748B',
    marginTop: 2,
  },
  resultPercent: {
    color: '#1F7A36',
    fontWeight: '700',
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
