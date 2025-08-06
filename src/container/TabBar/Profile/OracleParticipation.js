import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const OracleParticipation = ({ navigation }) => {
  const colors = useSelector(state => state.theme.theme);

  // Datos de ejemplo - estos vendrían de la API
  const participationData = {
    totalParticipations: 3,
    trustLevel: 94,
    coincidences: 17,
    lastParticipations: [
      {
        id: 1,
        tableNumber: '2023',
        location: 'Atestigua',
        status: 'coincide', // 'coincide' | 'no-coincide'
        date: '17 ago 2025',
        time: '16:22',
        type: 'Elecciones 2025',
        points: '+1'
      },
      {
        id: 2,
        tableNumber: '1213',
        location: 'Acta',
        status: 'coincide',
        date: '17 ago 2025',
        time: '16:22',
        type: 'Coincide',
        points: '+1'
      },
      {
        id: 3,
        tableNumber: '1772',
        location: 'Atestigua',
        status: 'no-coincide',
        date: '17 ago 2025',
        time: '16:22',
        type: 'No coincide',
        points: '-1'
      }
    ]
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShareProfile = () => {
    // Implementar funcionalidad de compartir perfil
    console.log('Compartir perfil');
  };

  const renderParticipationItem = (item) => {
    const isPositive = item.status === 'coincide';
    const statusColor = isPositive ? '#4CAF50' : '#F44336';
    const statusIcon = isPositive ? 'checkmark-circle' : 'close-circle';

    return (
      <View key={item.id} style={styles.participationItem}>
        <View style={styles.participationLeft}>
          <View style={[styles.statusIcon, { backgroundColor: statusColor + '20' }]}>
            <Ionicons 
              name={statusIcon} 
              size={getResponsiveSize(20, 24, 28)} 
              color={statusColor} 
            />
          </View>
          <View style={styles.participationInfo}>
            <CText style={styles.participationTitle}>
              Mesa {item.tableNumber} - {item.location}
            </CText>
            <CText style={styles.participationSubtitle}>
              {item.type}
            </CText>
            <CText style={styles.participationDate}>
              {item.date} - {item.time}
            </CText>
          </View>
        </View>
        <View style={styles.participationRight}>
          <CText style={[styles.participationPoints, { color: statusColor }]}>
            {item.points}
          </CText>
        </View>
      </View>
    );
  };

  return (
    <CSafeAreaView style={styles.container}>
      <CHeader
        title={String.oracleParticipationTitle}
        onBack={handleBack}
        color={colors.white}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header con estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <CText style={styles.statNumber}>{participationData.totalParticipations}</CText>
            <CText style={styles.statLabel}>{String.participations}</CText>
          </View>
        </View>

        {/* Últimas participaciones */}
        <View style={styles.section}>
          <CText style={styles.sectionTitle}>
            {String.lastParticipations}
          </CText>
          
          <View style={styles.participationsList}>
            {participationData.lastParticipations.map(renderParticipationItem)}
          </View>
        </View>

        {/* Botón compartir perfil */}
        <View style={styles.shareContainer}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShareProfile}
          >
            <Ionicons name="share-outline" size={20} color="#222" />
            <CText style={styles.shareButtonText}>
              {String.shareProfile}
            </CText>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  statsContainer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSize(20, 24, 32),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: getResponsiveSize(32, 36, 42),
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: getResponsiveSize(8, 10, 12),
  },
  statLabel: {
    fontSize: getResponsiveSize(14, 16, 18),
    color: '#666',
    marginTop: getResponsiveSize(4, 6, 8),
  },
  section: {
    marginBottom: getResponsiveSize(24, 28, 32),
  },
  sectionTitle: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: 'bold',
    color: '#222',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  participationsList: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(4, 6, 8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  participationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: getResponsiveSize(36, 40, 44),
    height: getResponsiveSize(36, 40, 44),
    borderRadius: getResponsiveSize(18, 20, 22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(12, 14, 16),
  },
  participationInfo: {
    flex: 1,
  },
  participationTitle: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#222',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  participationSubtitle: {
    fontSize: getResponsiveSize(12, 14, 16),
    color: '#666',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  participationDate: {
    fontSize: getResponsiveSize(11, 12, 14),
    color: '#999',
  },
  participationRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  participationPoints: {
    fontSize: getResponsiveSize(16, 18, 20),
    fontWeight: 'bold',
  },
  shareContainer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSize(20, 24, 32),
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButtonText: {
    fontSize: getResponsiveSize(14, 16, 18),
    fontWeight: '600',
    color: '#222',
    marginLeft: getResponsiveSize(8, 10, 12),
  },
});

export default OracleParticipation;
