import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import {moderateScale} from '../../../common/constants';
import CStandardHeader from '../../../components/common/CStandardHeader';

import {
  mockNotificaciones,
  formatTiempoRelativo,
} from '../../../data/mockNotificaciones';

// Si tienes assets, reemplaza por tus imágenes
// const LOGO1 = require('../../../assets/logo1.png');
// const LOGO2 = require('../../../assets/logo2.png');
// const LOGO_CENTER = require('../../../assets/logo_center.png');

export default function Notification({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setNotificaciones(mockNotificaciones);
      setLoading(false);
    };
    cargarNotificaciones();
  }, []);

  // Ícono solo negro, como en la imagen
  const getIconName = tipo => {
    switch (tipo) {
      case 'Conteo de Votos':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({item}) => (
    <View style={localStyle.notificationCard}>
      <View style={localStyle.cardContent}>
        <Ionicons
          name={getIconName(item.tipo)}
          size={38}
          color={'#111'}
          style={{marginTop: 3}}
        />
        <View style={localStyle.contentContainer}>
          <View style={localStyle.headerRow}>
            <Text style={localStyle.title}>{item.mesa}</Text>
            <Text style={localStyle.time}>
              {formatTiempoRelativo(item.timestamp)}
            </Text>
          </View>
          <Text style={localStyle.subtitle}>{item.tipo}</Text>
          <Text style={localStyle.detailText}>{item.colegio}</Text>
          <Text style={localStyle.detailText}>{item.direccion}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      {/* HEADER */}
      <CStandardHeader
        title="Notificaciones"
        onPressBack={() => navigation.goBack()}
      />

      <FlatList
        data={notificaciones}
        keyExtractor={item => item.id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={localStyle.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={localStyle.separator} />}
        ListEmptyComponent={
          <View style={{marginTop: 50, alignItems: 'center'}}>
            <Text>No hay notificaciones</Text>
          </View>
        }
      />

      {/* FOOTER */}
      {/* <View style={localStyle.footer}>
        <Text style={localStyle.footerText}>Iniciativa voluntaria de:</Text>
        <View style={localStyle.footerLogos}>
          <Image
            source={LOGO1}
            style={localStyle.footerLogoImg}
            resizeMode="contain"
          />
          <Image
            source={LOGO_CENTER}
            style={localStyle.footerLogoCenter}
            resizeMode="contain"
          />
          <Image
            source={LOGO2}
            style={localStyle.footerLogoImg}
            resizeMode="contain"
          />
        </View>
      </View> */}
    </View>
  );
}

const localStyle = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 24,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 15,
  },
  notificationCard: {
    paddingBottom: 6,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#111',
    marginRight: 10,
    marginTop: -3,
  },
  time: {
    color: '#2790b0',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#111',
    marginTop: 1,
    fontWeight: '400',
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
    fontWeight: '400',
  },
  separator: {
    height: 1,
    backgroundColor: '#ededed',
    marginVertical: 10,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  footerText: {
    color: '#979797',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '400',
  },
  footerLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginHorizontal: 18,
  },
  footerLogoCenter: {
    width: 52,
    height: 38,
    marginHorizontal: 12,
  },
});
