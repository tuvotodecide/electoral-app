import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from './CText';
import {moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKey';
import {BACKEND_RESULT} from '@env';
import {authenticateWithBackend} from '../../utils/offlineQueueHandler';
import {
  getLocalStoredNotifications,
  mergeAndDedupeNotifications,
} from '../../notifications';
import {getCache, isFresh, setCache} from '../../utils/lookupCache';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const NOTIFICATIONS_CACHE_TTL_MS = 60 * 1000;
const NOTIFICATIONS_AUTH_RETRY_MS = 60 * 1000;

const buildNotificationSeenKey = dniValue => {
  const normalized = String(dniValue || '')
    .trim()
    .toLowerCase();
  return `@notifications:last-seen:${normalized || 'anon'}`;
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

const notificationsCacheKey = dniValue =>
  `home:notifications:${String(dniValue || '').trim().toLowerCase() || 'anon'}`;

const isStateEffectivelyOnline = state =>
  !!state?.isConnected && state?.isInternetReachable !== false;

const UniversalHeader = ({
  testID = "universalHeader",
  colors,
  onBack,
  title = 'Title',
  showNotification = true,
  onNotificationPress,
  customStyles = {},
}) => {
  const navigation = useNavigation();
  const userData = useSelector(state => state.wallet?.payload);
  const auth = useSelector(state => state.auth);
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ||
    subject?.documentNumber ||
    subject?.governmentIdentifier ||
    userData?.dni;
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const notificationsApiKeyRef = useRef(null);
  const notificationsAuthRetryAtRef = useRef(0);
  const SIDE_W = getResponsiveSize(48, 56, 64);
  const TITLE_SIZE = getResponsiveSize(16, 20, 26);

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
    if (!showNotification || !auth?.isAuthenticated || !dni) {
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
        const baseline =
          timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
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

    const cacheKey = notificationsCacheKey(dni);
    const cachedEntry = await getCache(cacheKey);
    const cachedList = Array.isArray(cachedEntry?.data) ? cachedEntry.data : [];
    await applyUnreadFromList(cachedList);

    const cacheFresh = await isFresh(cacheKey, NOTIFICATIONS_CACHE_TTL_MS);
    if (cacheFresh) return;

    const state = await NetInfo.fetch();
    if (!isStateEffectivelyOnline(state)) return;

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

      await setCache(cacheKey, list, {version: 'notifications-v1'});
      await applyUnreadFromList(list);
    } catch (error) {
      const status = Number(error?.response?.status || 0);
      if (status === 401 || status === 403) {
        notificationsApiKeyRef.current = null;
        notificationsAuthRetryAtRef.current =
          Date.now() + NOTIFICATIONS_AUTH_RETRY_MS;
      }
    }
  }, [auth?.isAuthenticated, dni, ensureNotificationsApiKey, showNotification]);

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
      const intervalId = setInterval(refresh, 15000);
      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [refreshNotificationBadgeCount]),
  );

  const handleNotificationPress = async () => {
    try {
      if (dni) {
        const seenKey = buildNotificationSeenKey(dni);
        await AsyncStorage.setItem(seenKey, String(Date.now()));
      }
    } catch {
      // continuar navegación aunque falle storage local
    }
    setNotificationUnreadCount(0);
    if (typeof onNotificationPress === 'function') {
      onNotificationPress();
      return;
    }
    navigation.navigate(StackNav.Notification);
  };
  return (
    <View
      testID={testID}
      style={[
        styles.header,
        customStyles.header,
        {
          paddingHorizontal: getResponsiveSize(12, 16, 24),
          paddingVertical: getResponsiveSize(8, 12, 16),
          minHeight: getResponsiveSize(56, 64, 72),
        },
      ]}>
      <View testID={`${testID}LeftSide`} style={[styles.side, {width: SIDE_W}]}>
        <TouchableOpacity
          testID={`${testID}BackButton`}
          onPress={onBack}
          style={[
            styles.backButton,
            customStyles.backButton,
            {
              padding: getResponsiveSize(6, 8, 12),
            },
          ]}>
          <MaterialIcons
            name="keyboard-arrow-left"
            size={getResponsiveSize(32, 36, 44)}
            color={colors?.black || '#2F2F2F'}
          />
        </TouchableOpacity>
      </View>
      <View testID={`${testID}CenterWrap`} style={styles.centerWrap}>
        <CText
          testID={`${testID}Title`}
          style={[
            styles.headerTitle,
            customStyles.headerTitle,
            {
              fontSize: TITLE_SIZE,
              lineHeight: TITLE_SIZE,
              includeFontPadding: false,
              textAlignVertical: 'center',
            },
          ]}>
          {title}
        </CText>
      </View>
      <View testID={`${testID}RightSide`} style={[styles.side, {width: SIDE_W}]}>
        {showNotification && (
          <TouchableOpacity
            testID={`${testID}NotificationButton`}
            style={[
              styles.bellIcon,
              customStyles.bellIcon,
              {
                padding: getResponsiveSize(6, 8, 12),
              },
            ]}
            onPress={handleNotificationPress}>
            <Ionicons
              name="notifications-outline"
              size={getResponsiveSize(28, 32, 40)}
              color={colors?.textColor || colors?.text || '#232323'}
            />
            {notificationUnreadCount > 0 && (
              <View testID={`${testID}NotificationBadge`} style={styles.notificationBadge}>
                <CText style={styles.notificationBadgeText}>
                  {notificationUnreadCount > 99
                    ? '99+'
                    : String(notificationUnreadCount)}
                </CText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  side: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  headerTitle: {
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: isTablet ? 'center' : 'left',
  },
  bellIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 10,
    fontWeight: '700',
  },
});

export default UniversalHeader;
