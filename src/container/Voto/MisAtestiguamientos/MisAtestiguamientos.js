import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import UniversalHeader from '../../../components/common/UniversalHeader';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';

export default function MisAtestiguamientos({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  // Datos de ejemplo del historial de atestiguamientos
  const [historial] = useState([
    {
      id: 1,
      mesa: 'Mesa 001',
      fecha: '2024-10-27',
      hora: '18:30',
      escuela: 'Escuela Primaria N° 15',
      estado: 'Completado',
      tipo: 'Atestiguamiento',
    },
    {
      id: 2,
      mesa: 'Mesa 002',
      fecha: '2024-10-27',
      hora: '17:45',
      escuela: 'Instituto San José',
      estado: 'Pendiente revisión',
      tipo: 'Subida de acta',
    },
    {
      id: 3,
      mesa: 'Mesa 003',
      fecha: '2024-10-27',
      hora: '16:20',
      escuela: 'Colegio Nacional',
      estado: 'Completado',
      tipo: 'Anuncio de conteo',
    },
    {
      id: 4,
      mesa: 'Mesa 004',
      fecha: '2024-10-26',
      hora: '19:15',
      escuela: 'Escuela Técnica N° 2',
      estado: 'Completado',
      tipo: 'Atestiguamiento',
    },
  ]);

  const getStatusColor = estado => {
    switch (estado) {
      case 'Completado':
        return '#28A745';
      case 'Pendiente revisión':
        return '#FFC107';
      default:
        return '#6C757D';
    }
  };

  const getTypeIcon = tipo => {
    switch (tipo) {
      case 'Atestiguamiento':
        return 'eye-outline';
      case 'Subida de acta':
        return 'camera-outline';
      case 'Anuncio de conteo':
        return 'megaphone-outline';
      default:
        return 'document-outline';
    }
  };

  const renderHistorialItem = ({item}) => (
    <TouchableOpacity
      style={[localStyle.historialCard, {backgroundColor: colors.inputBg}]}
      onPress={() => handleVerDetalle(item)}>
      <View style={localStyle.cardContent}>
        <View style={localStyle.iconContainer}>
          <Ionicons
            name={getTypeIcon(item.tipo)}
            size={moderateScale(24)}
            color={colors.primary}
          />
        </View>

        <View style={localStyle.infoContainer}>
          <View style={localStyle.headerRow}>
            <CText type={'B16'} color={colors.textColor}>
              {item.mesa}
            </CText>
            <View
              style={[
                localStyle.statusBadge,
                {backgroundColor: getStatusColor(item.estado) + '20'},
              ]}>
              <CText type={'R12'} color={getStatusColor(item.estado)}>
                {item.estado}
              </CText>
            </View>
          </View>

          <CText type={'R14'} color={colors.grayScale500} style={styles.mt5}>
            {item.escuela}
          </CText>

          <CText type={'R12'} color={colors.primary} style={styles.mt5}>
            {item.tipo}
          </CText>

          <View style={localStyle.dateTimeRow}>
            <View style={localStyle.dateTime}>
              <Ionicons
                name="calendar-outline"
                size={moderateScale(14)}
                color={colors.grayScale500}
              />
              <CText
                type={'R12'}
                color={colors.grayScale500}
                style={styles.ml5}>
                {item.fecha}
              </CText>
            </View>
            <View style={localStyle.dateTime}>
              <Ionicons
                name="time-outline"
                size={moderateScale(14)}
                color={colors.grayScale500}
              />
              <CText
                type={'R12'}
                color={colors.grayScale500}
                style={styles.ml5}>
                {item.hora}
              </CText>
            </View>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={moderateScale(20)}
          color={colors.grayScale500}
        />
      </View>
    </TouchableOpacity>
  );

  const handleVerDetalle = item => {
    console.log('Ver detalle:', item);
    // Aquí navegarías a la pantalla de detalle
  };

  return (
    <CSafeAreaView
      style={[localStyle.container, {backgroundColor: colors.backgroundColor}]}>
      {/* Header */}
      <UniversalHeader
        colors={colors}
        onBack={() => navigation.goBack()}
        title="Mis Atestiguamientos"
        showNotification={false}
      />

      {/* Content */}
      <View style={localStyle.content}>
        <View style={localStyle.summaryContainer}>
          <View style={localStyle.summaryCard}>
            <CText type={'B24'} color={colors.primary}>
              {historial.length}
            </CText>
            <CText type={'R14'} color={colors.grayScale500}>
              Total de actividades
            </CText>
          </View>
          <View style={localStyle.summaryCard}>
            <CText type={'B24'} color={'#28A745'}>
              {historial.filter(item => item.estado === 'Completado').length}
            </CText>
            <CText type={'R14'} color={colors.grayScale500}>
              Completadas
            </CText>
          </View>
        </View>

        <View style={localStyle.listHeader}>
          <CText type={'B16'} color={colors.textColor}>
            Historial de Actividades
          </CText>
        </View>

        <FlatList
          data={historial}
          renderItem={renderHistorialItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.pb20}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: moderateScale(100), // Espacio para el TabNavigation
  },
  content: {
    flex: 1,
    ...styles.ph20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...styles.mb20,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    ...styles.p15,
    borderRadius: moderateScale(12),
    alignItems: 'center',
    flex: 0.48,
  },
  listHeader: {
    ...styles.mb15,
  },
  historialCard: {
    ...styles.p15,
    borderRadius: moderateScale(12),
    ...styles.mb15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    ...styles.mr15,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    ...styles.ph10,
    ...styles.pv5,
    borderRadius: moderateScale(12),
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...styles.mt10,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
