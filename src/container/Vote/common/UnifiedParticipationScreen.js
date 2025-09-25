import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {StackNav} from '../../../navigation/NavigationKey';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const UnifiedParticipationScreen = ({navigation, route}) => {
  const colors = useSelector(state => state.theme.theme);
  const {locationId, locationData} = route.params || {};
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Automáticamente navegar a subir acta (temporalmente)
  useEffect(() => {
    const timer = setTimeout(() => {
      const {locationId, locationData, tableData, fromCache, offline} =
        route.params || {};
      if (tableData) {
        // Ir directo al detalle de mesa (subir/ver acta) sin pasar por la lista
        navigation.replace(StackNav.TableDetail, {
          tableData,
          mesa: tableData,
          locationData: {...locationData, locationId},
          isFromUnifiedFlow: true,
          fromCache,
          offline,
        });
      } else {
        // Flujo normal (lista de mesas)
        navigation.replace(StackNav.UnifiedTableScreen, {
          locationId,
          locationData,
          targetScreen: 'SearchTable',
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [navigation, route?.params]);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader
        title={locationData.name}
        onBack={handleBack}
        color={colors.white}
      />

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <CText style={styles.title}>Redirigiendo{dots}</CText>
          <CText style={styles.subtitle}>Por favor espera un momento</CText>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingTop: getResponsiveSize(20, 24, 32),
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
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
    shadowOffset: {width: 0, height: 2},
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
