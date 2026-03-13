/**
 * Notification Detail Screen
 *
 * Pantalla de detalle de notificación de resultados.
 * Muestra información sobre resultados disponibles con botón de acción.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import { moderateScale, getHeight } from '../../../common/constants';
import { UI_STRINGS } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

// Mock notification data
const MOCK_NOTIFICATION = {
  id: 'notif_1',
  title: 'Resultados Disponibles',
  timestamp: 'Hace 10 min',
  source: 'Tu voto decide',
  bannerTitle: 'Resultados Preliminares',
  bannerSubtitle: 'Conteo en tiempo real',
  body: 'Ya están disponibles los primeros resultados preliminares de la votación para "Elección Directiva 2026".',
  actionUrl: 'https://results.tuvotodecide.com', // URL de resultados
};

const NotificationDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get notification from params or use mock
  const notification = route?.params?.notification || MOCK_NOTIFICATION;

  const handleGoToResults = () => {
    // Open results page
    if (notification.actionUrl) {
      Linking.openURL(notification.actionUrl).catch((err) =>
        console.error('Error opening URL:', err)
      );
    }
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader title={UI_STRINGS.notificationHeader} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <CText type="B20" style={styles.title}>
            {notification.title}
          </CText>
          <CText type="R12" style={styles.timestamp}>
            {notification.timestamp} · {notification.source}
          </CText>
        </View>

        {/* Banner Card */}
        <View style={styles.bannerCard}>
          {/* Decorative circles */}
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
          <View style={[styles.circle, styles.circle4]} />

          {/* Icon */}
          <View style={styles.bannerIconContainer}>
            <Ionicons name="cube-outline" size={40} color="#FFFFFF" />
          </View>

          {/* Banner Text */}
          <CText type="B18" style={styles.bannerTitle}>
            {notification.bannerTitle}
          </CText>
          <CText type="R14" style={styles.bannerSubtitle}>
            {notification.bannerSubtitle}
          </CText>
        </View>

        {/* Body Text */}
        <CText type="R16" style={styles.bodyText}>
          {notification.body}
        </CText>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <CButton
          title={UI_STRINGS.goToResultsPage}
          type="B16"
          onPress={handleGoToResults}
          containerStyle={styles.actionButton}
          sinMargen
          testID="goToResultsButton"
        />
      </View>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(16, 20, 24),
    paddingBottom: getResponsiveSize(100, 110, 120),
  },
  headerSection: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  title: {
    color: '#1F2937',
    fontSize: getResponsiveSize(20, 22, 26),
    fontWeight: '700',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: getResponsiveSize(12, 13, 14),
  },
  bannerCard: {
    backgroundColor: '#41A44D',
    borderRadius: moderateScale(16),
    padding: getResponsiveSize(24, 28, 32),
    marginBottom: getResponsiveSize(20, 24, 28),
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
  },
  circle1: {
    width: 60,
    height: 60,
    top: -20,
    left: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    top: 40,
    right: -30,
  },
  circle3: {
    width: 40,
    height: 40,
    bottom: 20,
    left: 30,
  },
  circle4: {
    width: 100,
    height: 100,
    bottom: -40,
    right: 40,
  },
  bannerIconContainer: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(18, 20, 24),
    fontWeight: '700',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: getResponsiveSize(13, 14, 16),
  },
  bodyText: {
    color: '#374151',
    fontSize: getResponsiveSize(14, 15, 17),
    lineHeight: getResponsiveSize(22, 24, 28),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(12, 14, 16),
    paddingBottom: getResponsiveSize(24, 28, 32),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    height: getHeight(52),
    borderRadius: moderateScale(12),
  },
});

export default NotificationDetailScreen;
