import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import CStandardHeader from '../../../components/common/CStandardHeader';
import axios from 'axios';
import {BACKEND_RESULT, BACKEND_SECRET} from '@env';
import {requestPushPermissionExplicit} from '../../../services/pushPermission';
import {formatTiempoRelativo} from '../../../services/notifications';

export default function Notification({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const userData = useSelector(state => state.wallet.payload);

  // === Resolver DNI como en Home ===
  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ??
    subject?.documentNumber ??
    subject?.governmentIdentifier ??
    userData?.dni;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mapServerToUi = n => {
    const data = n?.data || {};
    const created = n?.createdAt || n?.timestamp || new Date().toISOString();

    
    const mesaLabel = data.tableNumber
      ? `Mesa ${String(data.tableNumber)}`
      : data.tableCode || 'Mesa';

    return {
      id: n?._id || `srv_${created}`,
      tipo:
        data?.type === 'announce_count' ? 'Conteo de Votos' : 'Notificación',
      mesa: mesaLabel, 
      colegio: data?.locationName || n?.locationName || 'Recinto',
      direccion: data?.locationAddress || n?.locationAddress || '',
      distancia: null,
      timestamp: new Date(created).getTime(),
      estado: 'iniciado',
    };
  };

  const fetchFromBackend = useCallback(
    async (isRefresh = false) => {
      if (!dni) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (!isRefresh) setLoading(true);
      try {
        const response = await axios.get(
          `${BACKEND_RESULT}/api/v1/users/${dni}/notifications`,
          {headers: {'x-api-key': BACKEND_SECRET}, timeout: 12000},
        );
        const list = response?.data?.data || response?.data || [];
        setItems(
          list.map(mapServerToUi).sort((a, b) => b.timestamp - a.timestamp),
        );
      } catch {
        setItems([]);
      } finally {
        if (isRefresh) setRefreshing(false);
        setLoading(false);
      }
    },
    [dni],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      await requestPushPermissionExplicit();
      if (mounted) await fetchFromBackend(false);
    })();
    const unsubFocus = navigation.addListener('focus', () =>
      fetchFromBackend(true),
    );
    return () => {
      mounted = false;
      unsubFocus && unsubFocus();
    };
  }, [navigation, fetchFromBackend]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFromBackend(true);
  };

  const getIconName = tipo => {
    switch (tipo) {
      case 'Conteo de Votos':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderItem = ({item}) => {
    return (
      <TouchableOpacity
        style={localStyle.notificationCard}
        // onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        <View style={localStyle.cardContent}>
          <Ionicons
            name={getIconName(item.tipo)}
            size={38}
            color={'#111'}
            
          />
          <View style={localStyle.contentContainer}>
            <View style={localStyle.headerRow}>
              <Text style={localStyle.title}>{item.mesa}</Text>
              <View style={localStyle.rightInfo}>
                {item.distancia && (
                  <Text style={localStyle.distance}>{item.distancia}</Text>
                )}
                <Text style={localStyle.time}>
                  {formatTiempoRelativo(item.timestamp)}
                </Text>
              </View>
            </View>
            <Text style={localStyle.subtitle}>{item.tipo}</Text>
            <Text style={localStyle.detailText}>{item.colegio}</Text>
            <Text style={localStyle.detailText}>{item.direccion}</Text>
            {/* {item.tipo === 'Conteo de Votos' && (
            <View style={localStyle.actionHint}>
              <Ionicons name="arrow-forward" size={16} color="#2790b0" />
              <Text style={localStyle.actionText}>Toca para ver detalles</Text>
            </View>
          )} */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <CStandardHeader
        title="Notificaciones"
        onPressBack={() => navigation.goBack()}
      />

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={localStyle.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={localStyle.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={{marginTop: 50, alignItems: 'center'}}>
              <Text>No hay notificaciones</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const localStyle = StyleSheet.create({
  listContent: {paddingHorizontal: 18, paddingTop: 6, paddingBottom: 15},
  notificationCard: {paddingBottom: 6, backgroundColor: '#fff'},
  cardContent: {flexDirection: 'row', alignItems: 'center'},
  contentContainer: {flex: 1, marginLeft: 10},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  rightInfo: {alignItems: 'flex-end'},
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
  time: {color: '#2790b0', fontSize: 13, fontWeight: '400', marginTop: 2},
  subtitle: {fontSize: 16, color: '#111', marginTop: 1, fontWeight: '400'},
  detailText: {fontSize: 14, color: '#444', marginTop: 2, fontWeight: '400'},
  actionHint: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  actionText: {
    color: '#2790b0',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  separator: {height: 1, backgroundColor: '#ededed', marginVertical: 10},
});
