import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const UnifiedParticipationScreen = ({ navigation, route }) => {
  const colors = useSelector(state => state.theme.theme);
  const { locationId, locationData } = route.params || {};

  // Automáticamente navegar a subir acta (temporalmente)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(StackNav.UnifiedTableScreen, {
        locationId,
        locationData,
        targetScreen: 'SearchTable',
      });
    }, 100); // Pequeño delay para evitar warning de navegación

    return () => clearTimeout(timer);
  }, [navigation, locationId, locationData]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleUploadActa = () => {
    navigation.navigate(StackNav.UnifiedTableScreen, {
      locationId,
      locationData,
      targetScreen: 'SearchTable',
    });
  };

  const handleWitnessActa = () => {
    navigation.navigate(StackNav.UnifiedTableScreen, {
      locationId,
      locationData,
      targetScreen: 'WitnessRecord',
    });
  };

  return (
    <CSafeAreaView testID="unifiedParticipationContainer" style={styles.container}>
      <CHeader
        testID="unifiedParticipationHeader"
        title={String.participate}
        onBack={handleBack}
        color={colors.white}
      />

      <View testID="unifiedParticipationContent" style={styles.content}>
        <View testID="unifiedParticipationHeaderContainer" style={styles.headerContainer}>
          <CText testID="redirectingTitle" style={styles.title}>
            Redirigiendo a subir acta...
          </CText>
          <CText testID="redirectingSubtitle" style={styles.subtitle}>
            Por favor espera un momento
          </CText>
        </View>
      </View>
    </CSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(20, 24, 32),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(32, 40, 48),
  },
  title: {
    fontSize: getResponsiveSize(22, 26, 30),
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 12, 16),
  },
  subtitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 24, 28),
  },
  optionsContainer: {
    flex: 1,
    gap: getResponsiveSize(16, 20, 24),
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(16, 18, 20),
    padding: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  optionIcon: {
    width: getResponsiveSize(64, 72, 80),
    height: getResponsiveSize(64, 72, 80),
    borderRadius: getResponsiveSize(32, 36, 40),
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  optionTitle: {
    fontSize: getResponsiveSize(18, 20, 22),
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  optionDescription: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 24, 28),
  },
});

export default UnifiedParticipationScreen;
