import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';
import { BACKEND_RESULT, FRONTEND_RESULTS } from '@env';
import { StackNav } from '../../../navigation/NavigationKey';

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
  tipo: 'Ver resultados',
  direccion: 'Resultados preliminares disponibles',
  actionLabel: 'Ver detalles',
  actionUrl: null,
  data: {
    bannerTitle: 'Resultados publicados',
    body: 'Consulta los resultados publicados de esta votación.',
  },
};

const API_BASE = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1`;
const VOTING_CANCELLED_TYPE = 'INSTITUTIONAL_VOTING_CANCELLED';

const PUBLIC_ELECTION_WEBVIEW_TYPES = new Set([
  'INSTITUTIONAL_EVENT_PUBLISHED',
  'INSTITUTIONAL_SCHEDULE_UPDATED',
  'INSTITUTIONAL_PADRON_REVIEW_OPEN',
  'INSTITUTIONAL_OFFICIAL_PUBLICATION_CONFIRMED',
  'INSTITUTIONAL_VOTING_ENABLED',
  'INSTITUTIONAL_VOTING_STARTS_IN_1H',
  'INSTITUTIONAL_VOTING_STARTS_IN_15M',
  'INSTITUTIONAL_VOTING_ENDS_IN_1H',
  'INSTITUTIONAL_VOTING_ENDS_IN_15M',
]);

const VOTING_REMINDER_TYPES = new Set([
  'INSTITUTIONAL_VOTING_STARTS_IN_1H',
  'INSTITUTIONAL_VOTING_STARTS_IN_15M',
  'INSTITUTIONAL_VOTING_ENDS_IN_1H',
  'INSTITUTIONAL_VOTING_ENDS_IN_15M',
]);

const PUBLIC_EVENT_DETAIL_CANCEL_CHECK_TYPES = new Set([
  ...PUBLIC_ELECTION_WEBVIEW_TYPES,
  'INSTITUTIONAL_RESULTS_AVAILABLE',
]);

const colorPalette = [
  '#1e40af',
  '#059669',
  '#dc2626',
  '#7c3aed',
  '#0ea5e9',
  '#f59e0b',
];

const isAbsoluteOrDeepLink = value =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(String(value || '').trim());

const isPublicElectionPath = value => {
  const path = String(value || '').trim();
  return (
    /^\/votacion\/elecciones\/[^/]+\/publica\/?$/i.test(path) ||
    /^\/elections\/[^/]+\/public\/?$/i.test(path)
  );
};

const isPublicElectionUrl = value => {
  try {
    const parsed = new URL(String(value || '').trim());
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      isPublicElectionPath(parsed.pathname)
    );
  } catch {
    return false;
  }
};

const IMAGE_URL_PATTERN = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:$|[?#])/i;

export const resolveValidImageUrl = value => {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = new URL(rawValue);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!IMAGE_URL_PATTERN.test(parsed.pathname || '')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const buildNotificationSeenKey = dniValue => {
  const normalized = String(dniValue || '')
    .trim()
    .toLowerCase();
  return `@notifications:last-seen:${normalized || 'anon'}`;
};

export const resolvePublicResultsUrl = notification => {
  const rawData = notification?.data || {};
  const directUrlCandidates = [
    notification?.actionUrl,
    rawData?.actionUrl,
    rawData?.publicUrl,
  ];

  const directUrl = directUrlCandidates.find(isAbsoluteOrDeepLink);
  if (directUrl) {
    return directUrl;
  }

  const link = rawData?.link || null;
  if (isAbsoluteOrDeepLink(link)) {
    return link;
  }

  const relativePath = rawData?.publicPath || link || null;
  if (relativePath && String(relativePath).startsWith('/')) {
    const frontendBase = String(FRONTEND_RESULTS || '').trim();
    if (frontendBase) {
      try {
        const url = new URL(frontendBase);
        url.pathname = String(relativePath);
        url.search = '';
        url.hash = '';
        return url.toString();
      } catch {}
    }
  }

  return isAbsoluteOrDeepLink(rawData?.deepLink) ? rawData.deepLink : null;
};

export const resolvePublicElectionUrl = notification => {
  const rawData = notification?.data || {};
  const eventId = String(rawData?.eventId || notification?.eventId || '').trim();
  // Only election-public http(s) URLs are accepted here. Generic external links
  // remain in the legacy action flow and are not opened in the election WebView.
  const publicUrlCandidates = [
    rawData?.publicUrl,
    notification?.publicUrl,
  ];
  const actionUrlCandidates = [
    rawData?.actionUrl,
    notification?.actionUrl,
  ];

  const directUrl = [...publicUrlCandidates, ...actionUrlCandidates].find(isPublicElectionUrl);
  if (directUrl) {
    return directUrl;
  }

  const link = String(rawData?.link || '').trim();
  if (isPublicElectionUrl(link)) {
    return link;
  }

  const frontendBase = String(FRONTEND_RESULTS || '').trim();
  const relativePath = String(
    rawData?.publicPath || (!isAbsoluteOrDeepLink(link) ? link : ''),
  ).trim();
  if (frontendBase && isPublicElectionPath(relativePath)) {
    try {
      const url = new URL(frontendBase);
      url.pathname = relativePath;
      url.search = '';
      url.hash = '';
      const resolvedUrl = url.toString();
      return isPublicElectionUrl(resolvedUrl) ? resolvedUrl : null;
    } catch {}
  }

  if (frontendBase && eventId) {
    try {
      const url = new URL(frontendBase);
      url.pathname = `/votacion/elecciones/${encodeURIComponent(eventId)}/publica`;
      url.search = '';
      url.hash = '';
      const resolvedUrl = url.toString();
      return isPublicElectionUrl(resolvedUrl) ? resolvedUrl : null;
    } catch {}
  }

  return null;
};

const mapEligibilityBadge = status => {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'ELIGIBLE') {
    return 'Habilitado';
  }
  if (normalized === 'DISABLED' || normalized === 'NOT_ELIGIBLE') {
    return 'No habilitado';
  }
  return null;
};

export const resolveNotificationActionLabel = ({
  notification,
  kind,
  isNews,
  type,
  isReferendum = false,
} = {}) => {
  const explicitLabel = String(notification?.actionLabel || '').trim();
  if (explicitLabel) {
    if (
      isReferendum &&
      explicitLabel.toLowerCase() === 'ver elección'
    ) {
      return 'Ver referéndum';
    }
    return explicitLabel;
  }

  if (String(type || '').trim().toUpperCase() === 'INSTITUTIONAL_VOTING_ENABLED') {
    return 'Ver padrón';
  }

  if (String(type || '').trim().toUpperCase() === 'INSTITUTIONAL_PADRON_REVIEW_OPEN') {
    return 'Ver padrón';
  }

  if (String(type || '').trim().toUpperCase() === 'INSTITUTIONAL_RESULTS_AVAILABLE') {
    return 'Ver detalles';
  }

  if (isNews) {
    return 'Abrir enlace';
  }

  if (kind === 'election_results') {
    return 'Ver detalles';
  }

  return isReferendum ? 'Ver referéndum' : 'Ver elección';
};

const normalizeOptionColors = option => {
  const colors = Array.isArray(option?.colors)
    ? option.colors
        .map(color => String(color || '').trim())
        .filter(Boolean)
    : [];

  if (colors.length > 0) {
    return colors;
  }

  const legacyColor = String(option?.color || '').trim();
  return [legacyColor || null].filter(Boolean);
};

const mapResultsSummaryFromDetail = detail => {
  const options = Array.isArray(detail?.options) ? detail.options : [];
  const resultRows = Array.isArray(detail?.results) ? detail.results : [];
  const isReferendum = detail?.isReferendum === true;
  const votesByOption = new Map(
    resultRows.map(result => [String(result?.option ?? ''), Number(result?.votes ?? 0)]),
  );

  const mapped = options.map((option, index) => {
    const partyName = String(option?.name ?? `Opción ${index + 1}`);
    const firstCandidate =
      Array.isArray(option?.candidates) && option.candidates.length > 0
        ? option.candidates[0]
        : null;
    const votes = votesByOption.get(partyName) ?? 0;

    return {
      id: String(option?.id ?? `option-${index + 1}`),
      name: isReferendum ? partyName : firstCandidate?.name ?? partyName,
      party: isReferendum ? `Opción ${index + 1}` : partyName,
      colorHex:
        normalizeOptionColors(option)[0] ??
        option?.color ??
        colorPalette[index % colorPalette.length],
      colors: normalizeOptionColors(option),
      votes,
      percent: 0,
      isTied: false,
    };
  });

  const totalVotes = mapped.reduce((sum, candidate) => sum + candidate.votes, 0);
  const maxVotes = mapped.reduce((max, candidate) => Math.max(max, candidate.votes), 0);
  const tiedCount = maxVotes > 0 ? mapped.filter(candidate => candidate.votes === maxVotes).length : 0;

  return mapped
    .map(candidate => ({
      ...candidate,
      percent: totalVotes > 0 ? Number(((candidate.votes * 100) / totalVotes).toFixed(2)) : 0,
      isTied: maxVotes > 0 && tiedCount > 1 && candidate.votes === maxVotes,
    }))
    .sort((a, b) => b.votes - a.votes || b.percent - a.percent)
    .slice(0, Math.max(4, tiedCount));
};

const pickEventDateValue = (...values) =>
  values.find(value => formatEventDate(value)) || null;

const isCancelledPublicEventDetail = detail => {
  const state = String(detail?.state || '').trim().toUpperCase();
  const availabilityStatus = String(detail?.availabilityStatus || '').trim().toUpperCase();
  return state === 'CANCELLED' || availabilityStatus === 'CANCELLED';
};

const resolveCancelledEventName = (...sources) => {
  for (const source of sources) {
    const rawData = source?.data && typeof source.data === 'object' ? source.data : source;
    const candidate = String(
      rawData?.eventName ||
        rawData?.name ||
        rawData?.bannerTitle ||
        rawData?.title ||
        rawData?.eventTitle ||
        '',
    ).trim();
    if (
      candidate &&
      candidate !== 'Votación eliminada' &&
      candidate !== 'Esta votación fue eliminada'
    ) {
      return candidate;
    }
  }

  return 'Proceso electoral';
};

const NotificationDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userData = useSelector(state => state.wallet?.payload);
  const notification = route?.params?.notification || DEFAULT_NOTIFICATION;
  const rawData = notification?.data || {};
  const kind = notification?.kind || 'generic';
  const normalizedType = String(rawData?.type || '').trim().toUpperCase();
  const isScheduleUpdate =
    notification?.isScheduleUpdate === true ||
    normalizedType === 'INSTITUTIONAL_SCHEDULE_UPDATED';
  const isNews = kind === 'news' ||
    normalizedType === 'INSTITUTIONAL_NEWS';
  const isVotingEnabled = normalizedType === 'INSTITUTIONAL_VOTING_ENABLED';
  const statusTone = notification?.statusTone || 'success';
  const isExplicitVotingCancelled =
    normalizedType === VOTING_CANCELLED_TYPE ||
    String(rawData?.state || '').trim().toUpperCase() === 'CANCELLED' ||
    String(rawData?.availabilityStatus || '').trim().toUpperCase() === 'CANCELLED';
  const [resolvedVotingCancelled, setResolvedVotingCancelled] = useState(isExplicitVotingCancelled);
  const [remoteResultsSummary, setRemoteResultsSummary] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(kind === 'election_results');
  const [detailMeta, setDetailMeta] = useState({
    isReferendum: false,
    name: '',
    objective: '',
    questionTitle: '',
  });
  const [remoteCancelledEventName, setRemoteCancelledEventName] = useState('');
  const [eligibilityBadge, setEligibilityBadge] = useState(null);
  const [remoteSchedule, setRemoteSchedule] = useState({
    votingStart: null,
    votingEnd: null,
    resultsPublishAt: null,
  });
  const resolvedPublicUrl = resolvePublicResultsUrl(notification);
  const resolvedPublicElectionUrl = resolvePublicElectionUrl(notification);
  const imageUrl = resolveValidImageUrl(notification?.imageUrl || rawData?.imageUrl || null);
  const eventId = String(rawData?.eventId || notification?.eventId || '').trim();
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ||
    subject?.documentNumber ||
    subject?.governmentIdentifier ||
    userData?.dni;
  const resultsSummary = Array.isArray(notification?.resultsSummary) && notification.resultsSummary.length > 0
    ? notification.resultsSummary
    : remoteResultsSummary;
  const tiedLeaders = useMemo(
    () => resultsSummary.filter(result => result?.isTied),
    [resultsSummary],
  );
  const hasTie = tiedLeaders.length > 1;
  const isInstitutionalWithEventId =
    Boolean(eventId) && normalizedType.startsWith('INSTITUTIONAL_');
  const isVotingCancelled = isExplicitVotingCancelled || resolvedVotingCancelled;
  const isVotingReminder = VOTING_REMINDER_TYPES.has(normalizedType);
  const supportsPublicElectionWebView = PUBLIC_ELECTION_WEBVIEW_TYPES.has(normalizedType);
  const startsAtLabel =
    notification?.votingStartLabel ||
    formatEventDate(rawData?.votingStart || rawData?.startsAt || remoteSchedule.votingStart);
  const endsAtLabel =
    notification?.votingEndLabel ||
    formatEventDate(rawData?.votingEnd || rawData?.endsAt || remoteSchedule.votingEnd);
  const resultsAtLabel = formatEventDate(
    rawData?.resultsPublishAt || rawData?.officialPublishedAt || remoteSchedule.resultsPublishAt,
  );
  const hasPayloadVotingStart = Boolean(
    notification?.votingStartLabel || rawData?.votingStart || rawData?.startsAt,
  );
  const hasPayloadVotingEnd = Boolean(
    notification?.votingEndLabel || rawData?.votingEnd || rawData?.endsAt,
  );
  const hasCompletePayloadVotingDates = hasPayloadVotingStart && hasPayloadVotingEnd;

  useEffect(() => {
    if (!dni) {
      return;
    }

    const seenKey = buildNotificationSeenKey(dni);
    const seenAt = Math.max(
      Date.now(),
      Date.parse(String(notification?.createdAt || notification?.timestamp || '')) || 0,
    );

    AsyncStorage.setItem(seenKey, String(seenAt)).catch(() => {});
  }, [dni, notification?.createdAt, notification?.timestamp]);

  useEffect(() => {
    setResolvedVotingCancelled(isExplicitVotingCancelled);
    setRemoteCancelledEventName('');
  }, [isExplicitVotingCancelled, eventId, normalizedType]);

  useEffect(() => {
    const shouldCheckCancellation =
      !isExplicitVotingCancelled &&
      isInstitutionalWithEventId &&
      (PUBLIC_EVENT_DETAIL_CANCEL_CHECK_TYPES.has(normalizedType) ||
        kind === 'election_results');

    if (!shouldCheckCancellation) {
      return;
    }

    let mounted = true;
    const resolveCurrentEventState = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/voting/events/public/detail/${encodeURIComponent(eventId)}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          },
        );

        if (response.status === 404 || response.status === 410) {
          if (mounted) {
            setResolvedVotingCancelled(true);
          }
          return;
        }

        if (!response.ok) {
          return;
        }

        const detail = await response.json();
        if (mounted && isCancelledPublicEventDetail(detail)) {
          setRemoteCancelledEventName(resolveCancelledEventName(detail));
          setResolvedVotingCancelled(true);
        }
      } catch {
        // Network errors keep the current notification behavior.
      }
    };

    resolveCurrentEventState();
    return () => {
      mounted = false;
    };
  }, [
    eventId,
    isExplicitVotingCancelled,
    isInstitutionalWithEventId,
    kind,
    normalizedType,
  ]);

  useEffect(() => {
    if (kind !== 'election_results' || !eventId || isVotingCancelled) {
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
          throw new Error('No se pudo cargar el detalle público');
        }

        const detail = await response.json();
        if (!mounted) {
          return;
        }

        if (isCancelledPublicEventDetail(detail)) {
          setRemoteCancelledEventName(resolveCancelledEventName(detail));
          setResolvedVotingCancelled(true);
          setRemoteResultsSummary([]);
          return;
        }

        setDetailMeta({
          isReferendum: detail?.isReferendum === true,
          name: String(detail?.name || '').trim(),
          objective: String(detail?.objective || detail?.description || '').trim(),
          questionTitle: String(detail?.objective || detail?.description || '').trim(),
        });
        setRemoteResultsSummary(mapResultsSummaryFromDetail(detail));
      } catch {
        if (mounted) {
          setDetailMeta({
            isReferendum: false,
            name: '',
            objective: '',
            questionTitle: '',
          });
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
  }, [eventId, isVotingCancelled, kind]);

  useEffect(() => {
    if (!supportsPublicElectionWebView || !eventId || hasCompletePayloadVotingDates || isVotingCancelled) {
      setRemoteSchedule({
        votingStart: null,
        votingEnd: null,
        resultsPublishAt: null,
      });
      return;
    }

    let mounted = true;
    const loadPublicSchedule = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/voting/events/public/detail/${encodeURIComponent(eventId)}`,
          {
            method: 'GET',
            headers: {Accept: 'application/json'},
          },
        );

        if (!response.ok) {
          throw new Error('No se pudo cargar el detalle público');
        }

        const detail = await response.json();
        if (!mounted) {
          return;
        }

        if (isCancelledPublicEventDetail(detail)) {
          setRemoteCancelledEventName(resolveCancelledEventName(detail));
          setResolvedVotingCancelled(true);
          setRemoteSchedule({
            votingStart: null,
            votingEnd: null,
            resultsPublishAt: null,
          });
          return;
        }

        setRemoteSchedule({
          votingStart: pickEventDateValue(
            detail?.votingStart,
            detail?.startsAt,
            detail?.startAt,
            detail?.votingStartDate,
          ),
          votingEnd: pickEventDateValue(
            detail?.votingEnd,
            detail?.endsAt,
            detail?.closesAt,
            detail?.endAt,
            detail?.votingEndDate,
          ),
          resultsPublishAt: pickEventDateValue(
            detail?.resultsPublishAt,
            detail?.officialPublishedAt,
            detail?.resultsAt,
          ),
        });
      } catch {
        if (mounted) {
          setRemoteSchedule({
            votingStart: null,
            votingEnd: null,
            resultsPublishAt: null,
          });
        }
      }
    };

    loadPublicSchedule();
    return () => {
      mounted = false;
    };
  }, [eventId, hasCompletePayloadVotingDates, isVotingCancelled, supportsPublicElectionWebView]);

  useEffect(() => {
    if (!supportsPublicElectionWebView || !eventId || !dni || isVotingCancelled) {
      setEligibilityBadge(null);
      return;
    }

    let mounted = true;
    const loadEligibility = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/voting/events/${encodeURIComponent(eventId)}/eligibility/public?carnet=${encodeURIComponent(dni)}`,
          {
            method: 'GET',
            headers: {Accept: 'application/json'},
          },
        );

        if (!response.ok) {
          throw new Error('No se pudo consultar la habilitación');
        }

        const data = await response.json();
        if (mounted) {
          setEligibilityBadge(mapEligibilityBadge(data?.status));
        }
      } catch {
        if (mounted) {
          setEligibilityBadge(null);
        }
      }
    };

    loadEligibility();
    return () => {
      mounted = false;
    };
  }, [dni, eventId, isVotingCancelled, supportsPublicElectionWebView]);

  const heroConfig = useMemo(() => {
    if (isVotingCancelled) {
      return {
        backgroundColor: '#B91C1C',
        iconName: 'close-circle-outline',
        iconBg: 'rgba(255,255,255,0.16)',
        title: 'Votación eliminada',
        subtitle: '',
        textColor: '#FFFFFF',
      };
    }

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

    if (isNews) {
      return {
        backgroundColor: '#0F766E',
        iconName: 'newspaper-outline',
        iconBg: 'rgba(255,255,255,0.16)',
        title: rawData?.bannerTitle || 'Noticia',
        subtitle: '',
        textColor: '#FFFFFF',
      };
    }

    if (kind === 'voting_event' && isScheduleUpdate) {
      return {
        backgroundColor: '#1F7A36',
        iconName: 'create-outline',
        iconBg: 'rgba(255,255,255,0.16)',
        title: rawData?.bannerTitle || 'Modificacion de cronograma',
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
  }, [isNews, isScheduleUpdate, isVotingCancelled, kind, rawData?.bannerTitle, statusTone]);

  const isElectionResults = kind === 'election_results';
  const resultsWebViewUrl = isElectionResults ? resolvedPublicElectionUrl : null;
  const shouldOpenPrimaryActionInWebView =
    supportsPublicElectionWebView || isElectionResults;
  const primaryActionUrl = shouldOpenPrimaryActionInWebView
    ? (supportsPublicElectionWebView ? resolvedPublicElectionUrl : resultsWebViewUrl)
    : resolvedPublicUrl;

  const handlePrimaryAction = () => {
    if (isVotingCancelled) {
      return;
    }

    if (!primaryActionUrl) {
      return;
    }

    if (shouldOpenPrimaryActionInWebView) {
      navigation.navigate(StackNav.PublicElectionWebViewScreen, {
        url: primaryActionUrl,
        title: isElectionResults ? 'Resultados' : 'Elección',
      });
      return;
    }

    Linking.openURL(primaryActionUrl).catch(() => {});
  };

  const isReferendumResults = isElectionResults && detailMeta.isReferendum;
  const isReferendumNotification = isReferendumResults || rawData?.isReferendum === true;
  const resultsProcessTitle = String(
    rawData?.eventTitle ||
      rawData?.processTitle ||
      rawData?.eventName ||
      detailMeta.name ||
      '',
  ).trim();
  const resultsProcessDescription = String(
    rawData?.eventDescription ||
      rawData?.objective ||
      rawData?.processDescription ||
      detailMeta.objective ||
      detailMeta.questionTitle ||
      '',
  ).trim();
  const hasScheduleDates = Boolean(startsAtLabel || endsAtLabel || resultsAtLabel);
  const showPrimaryAction = !isVotingCancelled && (
    shouldOpenPrimaryActionInWebView
      ? Boolean(primaryActionUrl)
      : Boolean(resolvedPublicUrl)
  );
  const detailBody =
    isVotingCancelled
      ? 'Ya no está disponible.'
      : isVotingReminder && notification?.reminderDetailBody
        ? notification.reminderDetailBody
      : notification?.direccion ||
    notification?.body ||
    rawData?.body ||
    (isNews ? 'Consulta la información publicada.' : 'Revisa la información publicada para esta votación.');
  const heroSubtitle =
    isVotingCancelled || kind === 'election_results' || isNews
      ? ''
      : String(heroConfig.subtitle || rawData?.bannerSubtitle || '')
          .trim();
  const heroTitle =
    isVotingCancelled
      ? 'Votación eliminada'
      :
    isReferendumResults && detailMeta.questionTitle
      ? detailMeta.questionTitle
      : notification?.mesa || notification?.title || heroConfig.title || DEFAULT_NOTIFICATION.title;
  const cancelledEventName = resolveCancelledEventName(
    { eventName: remoteCancelledEventName },
    rawData,
    notification,
  );
  const reminderEventName = String(
    rawData?.eventName ||
      notification?.eventName ||
      rawData?.bannerTitle ||
      'Proceso electoral',
  ).trim();

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.notificationHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: heroConfig.backgroundColor }]}>
          <View style={[styles.heroIcon, { backgroundColor: heroConfig.iconBg }]}>
            <Ionicons name={heroConfig.iconName} size={34} color="#FFFFFF" />
          </View>
          <CText type="B18" style={[styles.heroTitle, { color: heroConfig.textColor }]}>
            {heroTitle}
          </CText>
          {heroSubtitle && heroSubtitle !== detailBody ? (
            <CText type="R14" style={styles.heroSubtitle}>
              {heroSubtitle}
            </CText>
          ) : null}
        </View>

        {supportsPublicElectionWebView && eligibilityBadge ? (
          <View
            testID="eligibilityBadge"
            style={[
              styles.eligibilityBadge,
              eligibilityBadge === 'Habilitado'
                ? styles.eligibilityBadgeEnabled
                : styles.eligibilityBadgeDisabled,
            ]}>
            <CText
              type="B14"
              style={[
                styles.eligibilityBadgeText,
                eligibilityBadge === 'Habilitado'
                  ? styles.eligibilityBadgeTextEnabled
                  : styles.eligibilityBadgeTextDisabled,
              ]}>
              {eligibilityBadge}
            </CText>
          </View>
        ) : null}

        {isNews && imageUrl ? (
          <Image
            testID="notificationDetailNewsImage"
            source={{uri: imageUrl}}
            style={styles.newsImage}
            resizeMode="cover"
          />
        ) : null}

        {isVotingCancelled ? (
          <View style={[styles.sectionCard, styles.cancelledCard]}>
            <CText type="B16" style={[styles.sectionTitle, styles.cancelledSectionTitle]}>
              {cancelledEventName}
            </CText>
            <CText type="R14" style={styles.emptyResultsText}>
              {detailBody}
            </CText>
            <CText type="R14" style={styles.emptyResultsText}>
              {rawData?.reasonText || 'Fue eliminada por el administrador.'}
            </CText>
            <CText type="M14" style={styles.cancelledSecondaryText}>
              No es necesario realizar ninguna acción.
            </CText>
          </View>
        ) : isNews ? (
          <View style={styles.sectionCard}>
            <CText type="B16" style={styles.sectionTitle}>
              Noticia
            </CText>
            <CText type="R14" style={styles.emptyResultsText}>
              {detailBody}
            </CText>
          </View>
        ) : kind === 'election_results' ? (
          <View style={styles.sectionCard}>
            {resultsProcessTitle ? (
              <View style={styles.resultsProcessBlock}>
                <CText type="B14" style={styles.resultsProcessLabel}>
                  Proceso
                </CText>
                <CText type="B16" style={styles.resultsProcessTitle}>
                  {resultsProcessTitle}
                </CText>
              </View>
            ) : null}
            {resultsProcessDescription ? (
              <View style={styles.resultsProcessBlock}>
                <CText type="B14" style={styles.resultsProcessLabel}>
                  Descripción
                </CText>
                <CText type="R14" style={styles.resultsProcessDescription}>
                  {resultsProcessDescription}
                </CText>
              </View>
            ) : null}
            <CText type="B16" style={styles.sectionTitle}>
              {isReferendumResults ? 'Resultados del referéndum' : 'Resultados'}
            </CText>
            {hasTie ? (
              <View
                style={{
                  marginBottom: 16,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#FCD34D',
                  backgroundColor: '#FFFBEB',
                  padding: 14,
                }}>
                <CText type="B14" style={{color: '#92400E', fontWeight: '700'}}>
                  Empate
                </CText>
                <CText type="R12" style={{color: '#92400E', marginTop: 4}}>
                  {`Hay un empate en el primer lugar entre ${tiedLeaders.map(result => result?.name).join(', ')}.`}
                </CText>
              </View>
            ) : null}
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
                      {result?.party || (isReferendumResults ? 'Opción' : 'Candidato')}
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
                {isReferendumResults
                  ? 'Resultados del referéndum listos para consultar en detalle.'
                  : 'Resultados listos para consultar en detalle.'}
              </CText>
            )}
          </View>
        ) : (
          <>
            <View style={styles.sectionCard}>
              <CText type="B16" style={styles.sectionTitle}>
                {isVotingReminder
                  ? reminderEventName
                  : isReferendumNotification
                    ? 'Referéndum'
                    : 'Votación'}
              </CText>
              <CText type="R14" style={styles.emptyResultsText}>
                {detailBody}
              </CText>
            </View>
            {hasScheduleDates ? (
              <View style={[styles.sectionCard, styles.scheduleCard]}>
                <CText type="B16" style={styles.sectionTitle}>
                  {isReferendumNotification ? 'Fechas del referéndum' : 'Fechas de la votación'}
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
                {resultsAtLabel ? (
                  <View style={styles.scheduleRow}>
                    <CText type="R14" style={styles.scheduleLabel}>
                      Resultados
                    </CText>
                    <CText type="M14" style={styles.scheduleValue}>
                      {resultsAtLabel}
                    </CText>
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {showPrimaryAction ? (
        <View
          style={[
            styles.bottomContainer,
            { paddingBottom: Math.max(insets.bottom, getResponsiveSize(16, 18, 20)) + 10 },
          ]}
        >
          <CButton
            title={
              supportsPublicElectionWebView
                ? 'Ver votación'
                : resolveNotificationActionLabel({
                    notification,
                    kind,
                    isNews,
                    isReferendum: isReferendumNotification,
                    type: isVotingEnabled ? 'INSTITUTIONAL_VOTING_ENABLED' : normalizedType,
                  })
            }
            type="B16"
            onPress={handlePrimaryAction}
            containerStyle={styles.actionButton}
            disabled={
              shouldOpenPrimaryActionInWebView
                ? !primaryActionUrl
                : !resolvedPublicUrl
            }
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
    paddingBottom: getResponsiveSize(132, 144, 152),
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
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: getResponsiveSize(14, 15, 17),
    lineHeight: getResponsiveSize(20, 22, 24),
    textAlign: 'center',
    marginTop: getResponsiveSize(8, 10, 12),
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: getResponsiveSize(18, 22, 26),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelledCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cancelledSectionTitle: {
    color: '#B91C1C',
  },
  cancelledSecondaryText: {
    color: '#991B1B',
    fontWeight: '700',
    marginTop: getResponsiveSize(14, 16, 18),
    lineHeight: getResponsiveSize(21, 23, 25),
  },
  scheduleCard: {
    marginTop: getResponsiveSize(16, 18, 20),
  },
  newsImage: {
    width: '100%',
    height: getResponsiveSize(180, 210, 260),
    borderRadius: moderateScale(18),
    marginBottom: getResponsiveSize(18, 22, 26),
    backgroundColor: '#E2E8F0',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    marginBottom: getResponsiveSize(14, 16, 18),
  },
  resultsProcessBlock: {
    marginBottom: getResponsiveSize(14, 16, 18),
  },
  resultsProcessLabel: {
    color: '#64748B',
    fontSize: getResponsiveSize(13, 14, 15),
    fontWeight: '700',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  resultsProcessTitle: {
    color: '#0F172A',
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: '700',
    lineHeight: getResponsiveSize(22, 24, 26),
  },
  resultsProcessDescription: {
    color: '#334155',
    fontSize: getResponsiveSize(14, 15, 16),
    lineHeight: getResponsiveSize(21, 23, 25),
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
  eligibilityBadge: {
    alignSelf: 'center',
    borderRadius: moderateScale(999),
    borderWidth: 1,
    marginTop: getResponsiveSize(-6, -8, -10),
    marginBottom: getResponsiveSize(16, 18, 20),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(7, 8, 9),
  },
  eligibilityBadgeEnabled: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  eligibilityBadgeDisabled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  eligibilityBadgeText: {
    fontWeight: '700',
  },
  eligibilityBadgeTextEnabled: {
    color: '#047857',
  },
  eligibilityBadgeTextDisabled: {
    color: '#B91C1C',
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
