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
import {FirebaseNotificationService} from '../../../services/FirebaseNotificationService';

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
  // const notificationService = new FirebaseNotificationService();

  useEffect(() => {
    const cargarNotificaciones = async () => {
      setLoading(true);
      try {
        // Combinar notificaciones almacenadas con las del mock
        const storedNotifications = await notificationService.getStoredNotifications();
        const allNotifications = [...storedNotifications, ...mockNotificaciones];
        
        // Ordenar por timestamp (más recientes primero)
        const sortedNotifications = allNotifications.sort((a, b) => b.timestamp - a.timestamp);
        
        setNotificaciones(sortedNotifications);
      } catch (error) {
        setNotificaciones(mockNotificaciones);
      }
      setLoading(false);
    };
    
    cargarNotificaciones();
    
    // Recargar notificaciones cuando la pantalla se enfoque
    const focusListener = navigation.addListener('focus', cargarNotificaciones);
    
    return () => focusListener();
  }, [navigation]);

  // Ícono solo negro, como en la imagen
  const getIconName = tipo => {
    switch (tipo) {
      case 'Conteo de Votos':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const handleNotificationPress = (item) => {
    if (item.tipo === 'Conteo de Votos') {
      // Navegar a CountTableDetail con la información de la mesa
      const mesaData = {
        id: item.id,
        numero: item.mesa,
        nombre: item.mesa,
        recinto: item.colegio,
        direccion: item.direccion,
        distancia: item.distancia || 'Cerca',
        latitude: -16.5000, // Coordenadas por defecto (La Paz)
        longitude: -68.1500,
        estado: item.estado || 'iniciado'
      };
      
      navigation.navigate('CountTableDetail', { mesa: mesaData });
    }
  };

  const renderNotificationItem = ({item, index}) => (
    <TouchableOpacity 
      testID={`notificationItem_${index}`}
      style={localStyle.notificationCard}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View testID={`notificationCardContent_${index}`} style={localStyle.cardContent}>
        <Ionicons
          testID={`notificationIcon_${index}`}
          name={getIconName(item.tipo)}
          size={38}
          color={'#111'}
          style={{marginTop: 3}}
        />
        <View testID={`notificationContentContainer_${index}`} style={localStyle.contentContainer}>
          <View testID={`notificationHeaderRow_${index}`} style={localStyle.headerRow}>
            <Text testID={`notificationTitle_${index}`} style={localStyle.title}>{item.mesa}</Text>
            <View testID={`notificationRightInfo_${index}`} style={localStyle.rightInfo}>
              {item.distancia && (
                <Text testID={`notificationDistance_${index}`} style={localStyle.distance}>{item.distancia}</Text>
              )}
              <Text testID={`notificationTime_${index}`} style={localStyle.time}>
                {formatTiempoRelativo(item.timestamp)}
              </Text>
            </View>
          </View>
          <Text testID={`notificationSubtitle_${index}`} style={localStyle.subtitle}>{item.tipo}</Text>
          <Text testID={`notificationCollege_${index}`} style={localStyle.detailText}>{item.colegio}</Text>
          <Text testID={`notificationAddress_${index}`} style={localStyle.detailText}>{item.direccion}</Text>
          {item.tipo === 'Conteo de Votos' && (
            <View testID={`notificationActionHint_${index}`} style={localStyle.actionHint}>
              <Ionicons testID={`notificationActionIcon_${index}`} name="arrow-forward" size={16} color="#2790b0" />
              <Text testID={`notificationActionText_${index}`} style={localStyle.actionText}>Toca para ver detalles</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View testID="notificationScreenContainer" style={{flex: 1, backgroundColor: '#fff'}}>
      {/* HEADER */}
      <CStandardHeader
        testID="notificationHeader"
        title="Notificaciones"
        onPressBack={() => navigation.goBack()}
      />

      <FlatList
        testID="notificationList"
        data={notificaciones}
        keyExtractor={item => item.id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={localStyle.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View testID="notificationSeparator" style={localStyle.separator} />}
        ListEmptyComponent={
          <View testID="notificationEmptyState" style={{marginTop: 50, alignItems: 'center'}}>
            <Text testID="notificationEmptyText">No hay notificaciones</Text>
          </View>
        }
      />
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
  rightInfo: {
    alignItems: 'flex-end',
  },
  distance: {
    color: '#2790b0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#111',
    marginRight: 10,
    marginTop: -3,
    flex: 1,
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
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: {
    color: '#2790b0',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
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
