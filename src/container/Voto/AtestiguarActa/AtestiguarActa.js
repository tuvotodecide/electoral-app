import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';

export default function AtestiguarActa({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  // Datos de ejemplo de actas disponibles para atestiguar
  const [actasDisponibles] = useState([
    {
      id: 1,
      mesa: 'Mesa 001',
      escuela: 'Escuela Primaria N° 15',
      direccion: 'Av. Corrientes 1234',
      hora: '14:30',
      estado: 'Pendiente',
    },
    {
      id: 2,
      mesa: 'Mesa 002',
      escuela: 'Instituto San José',
      direccion: 'San Martín 567',
      hora: '15:45',
      estado: 'Pendiente',
    },
    {
      id: 3,
      mesa: 'Mesa 003',
      escuela: 'Colegio Nacional',
      direccion: 'Belgrano 890',
      hora: '16:20',
      estado: 'En revisión',
    },
  ]);

  const renderActaItem = ({item}) => (
    <TouchableOpacity
      style={[localStyle.actaCard, {backgroundColor: colors.inputBg}]}
      onPress={() => handleAtestiguar(item)}>
      <View style={localStyle.cardHeader}>
        <CText type={'B16'} color={colors.textColor}>
          {item.mesa}
        </CText>
        <View
          style={[
            localStyle.statusBadge,
            {
              backgroundColor:
                item.estado === 'Pendiente' ? '#FFF3CD' : '#D1ECF1',
            },
          ]}>
          <CText
            type={'R12'}
            color={item.estado === 'Pendiente' ? '#856404' : '#0C5460'}>
            {item.estado}
          </CText>
        </View>
      </View>

      <CText type={'R14'} color={colors.grayScale500} style={styles.mt5}>
        {item.escuela}
      </CText>
      <CText type={'R12'} color={colors.grayScale500}>
        {item.direccion}
      </CText>

      <View style={localStyle.cardFooter}>
        <View style={localStyle.timeContainer}>
          <Ionicons
            name="time-outline"
            size={moderateScale(16)}
            color={colors.grayScale500}
          />
          <CText type={'R12'} color={colors.grayScale500} style={styles.ml5}>
            Subida: {item.hora}
          </CText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={moderateScale(20)}
          color={colors.grayScale500}
        />
      </View>
    </TouchableOpacity>
  );

  const handleAtestiguar = acta => {
    console.log('Atestiguar acta:', acta);
    // Aquí navegarías a la pantalla de detalle del acta
  };

  return (
    <CSafeAreaView
      style={[localStyle.container, {backgroundColor: colors.backgroundColor}]}>
      {/* Header */}
      <View style={localStyle.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(24)}
            color={colors.textColor}
          />
        </TouchableOpacity>
        <CText type={'B18'} color={colors.textColor}>
          Atestiguar Acta
        </CText>
        <View style={{width: moderateScale(24)}} />
      </View>

      {/* Content */}
      <View style={localStyle.content}>
        <View style={localStyle.infoContainer}>
          <Ionicons
            name="eye-outline"
            size={moderateScale(40)}
            color={colors.primary}
          />
          <CText type={'B18'} style={[styles.ml10, {color: colors.textColor}]}>
            Actas Disponibles
          </CText>
        </View>

        <CText
          type={'R14'}
          color={colors.grayScale500}
          style={[styles.mb20, styles.ph5]}>
          Selecciona un acta para revisar y validar su contenido.
        </CText>

        <FlatList
          data={actasDisponibles}
          renderItem={renderActaItem}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...styles.ph20,
    ...styles.pv15,
  },
  content: {
    flex: 1,
    ...styles.ph20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...styles.mb10,
  },
  actaCard: {
    ...styles.p15,
    borderRadius: moderateScale(12),
    ...styles.mb15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    ...styles.ph10,
    ...styles.pv5,
    borderRadius: moderateScale(12),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...styles.mt10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
