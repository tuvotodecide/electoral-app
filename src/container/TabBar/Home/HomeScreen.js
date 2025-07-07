import {StyleSheet, TouchableOpacity, View, Dimensions} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import {StackNav} from '../../../navigation/NavigationKey';

const deviceWidth = Dimensions.get('window').width;
const CARD_MARGIN = 10;
const CARD_WIDTH = (deviceWidth - 3 * CARD_MARGIN) / 2; // 2 cards + margins

// Logo personalizado con bandera boliviana
const MiVotoLogo = () => (
  <View style={stylesx.logoRow}>
    {/* Bandera */}
    <View style={stylesx.flagBox}>
      <View
        style={[stylesx.flagStripe, {backgroundColor: '#E72F2F', top: 0}]}
      />
      <View
        style={[stylesx.flagStripe, {backgroundColor: '#FFD800', top: 7}]}
      />
      <View
        style={[stylesx.flagStripe, {backgroundColor: '#4FC144', top: 14}]}
      />
      <View style={stylesx.flagCheckOutline} />
    </View>
    <View style={{marginLeft: 8}}>
      <CText style={stylesx.logoTitle}>Mi Voto</CText>
      <CText style={stylesx.logoSubtitle}>Control ciudadano del voto</CText>
    </View>
  </View>
);

export default function HomeScreen({navigation}) {
  // Simulación de usuario
  const userFullName = 'Juan Pérez Cuéllar';

  const onPressNotification = () => navigation.navigate(StackNav.Notification);

  const menuItems = [
    {
      icon: 'camera-outline',
      title: 'Subir Acta',
      description: 'Cargá fotos del acta de una mesa.',
      onPress: () => navigation.navigate(StackNav.BuscarMesa),
      iconComponent: Ionicons,
    },
    {
      icon: 'eye-outline',
      title: 'Atestiguar Acta',
      description: 'Validá un acta ya subida en una mesa.',
      onPress: () => navigation.navigate(StackNav.AtestiguarActa),
      iconComponent: Ionicons,
    },
    {
      icon: 'megaphone-outline',
      title: 'Anunciar Conteo',
      description: 'Avisar el inicio del conteo.',
      onPress: () => navigation.navigate(StackNav.AnunciarConteo),
      iconComponent: Ionicons,
    },
    {
      icon: 'bar-chart-outline',
      title: 'Mis atestiguamientos',
      description: 'Revisa tu historial',
      onPress: () =>
        navigation.navigate(StackNav.MisAtestiguamientosListScreen),
      iconComponent: Ionicons,
    },
  ];

  return (
    <CSafeAreaView style={stylesx.bg}>
      <View style={stylesx.headerRow}>
        <MiVotoLogo />
        <TouchableOpacity onPress={onPressNotification}>
          <Ionicons name={'notifications-outline'} size={28} color={'#222'} />
        </TouchableOpacity>
      </View>

      {/* ===== Bienvenida ===== */}
      <View style={stylesx.welcomeContainer}>
        <CText style={stylesx.bienvenido}>¡Bienvenido,</CText>
        <CText style={stylesx.nombre}>{userFullName}!</CText>
      </View>

      {/* ===== Cards de Menú ===== */}
      <View style={stylesx.gridContainer}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.title}
            style={stylesx.card}
            activeOpacity={0.87}
            onPress={item.onPress}>
            <item.iconComponent
              name={item.icon}
              size={36}
              color="#41A44D"
              style={{marginBottom: 8}}
            />
            <CText style={stylesx.cardTitle}>{item.title}</CText>
            <CText style={stylesx.cardDescription}>{item.description}</CText>
          </TouchableOpacity>
        ))}
      </View>
    </CSafeAreaView>
  );
}

const stylesx = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagBox: {
    width: 38,
    height: 38,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  flagStripe: {
    position: 'absolute',
    left: 11,
    width: 19,
    height: 5.3,
    borderRadius: 2,
    zIndex: 2,
  },
  flagCheckOutline: {
    position: 'absolute',
    left: 2,
    top: 5,
    width: 28,
    height: 28,
    borderWidth: 3.3,
    borderColor: '#292D32',
    borderRadius: 6,
    zIndex: 1,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 8,
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: -1,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#8B9399',
    fontWeight: '400',
    marginTop: -2,
    marginLeft: 2,
  },
  welcomeContainer: {
    marginTop: 13,
    marginLeft: 21,
    marginBottom: 16,
  },
  bienvenido: {
    fontSize: 22,
    color: '#41A44D',
    fontWeight: '700',
    marginBottom: -2,
    letterSpacing: -0.5,
  },
  nombre: {
    fontSize: 22,
    color: '#232323',
    fontWeight: '700',
    marginBottom: 0,
    letterSpacing: -0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 10,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 116,
    backgroundColor: '#FFF',
    borderRadius: 17,
    borderWidth: 1.3,
    borderColor: '#E0E0E0',
    alignItems: 'flex-start',
    padding: 18,
    marginBottom: 15,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#232323',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#282828',
    fontWeight: '400',
    marginTop: 1,
    marginBottom: -3,
    opacity: 0.78,
  },
  bannerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 0,
    marginBottom: 0,
  },
  bannerImage: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginTop: 10,
  },
});
