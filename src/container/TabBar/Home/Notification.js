import React, {useCallback, useEffect, useState} from 'react';
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
import {mockNotificaciones} from '../../../data/mockNotificaciones';


export default function Notification({navigation}) {
  const userData = useSelector(state => state.wallet.payload);

  const vc = userData?.vc;
  const subject = vc?.credentialSubject || vc?.vc?.credentialSubject || {};
  const dni =
    subject?.nationalIdNumber ||
    subject?.documentNumber ||
    subject?.governmentIdentifier ||
    userData?.dni;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mapServerToUi = useCallback(n => {
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
      distancia: data?.distance ?? null,
      timestamp: new Date(created).getTime(),
      estado: data?.status || 'iniciado',
    };
  }, []);

  const fetchFromBackend = useCallback(
    async (isRefresh = false) => {
      if (!dni) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!isRefresh) {
        setLoading(true);
      }

      try {
        const response = await axios.get(
          `${BACKEND_RESULT}/api/v1/users/${dni}/notifications`,
          {headers: {'x-api-key': BACKEND_SECRET}, timeout: 12000},
        );
        const list = response?.data?.data || response?.data || [];
        const mapped = list
          .map(mapServerToUi)
          .sort((a, b) => b.timestamp - a.timestamp);
        setItems(mapped);
      } catch (error) {
        setItems([...mockNotificaciones]);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
        setLoading(false);
      }
    },
    [dni, mapServerToUi],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      await requestPushPermissionExplicit();
      if (mounted) {
        await fetchFromBackend(false);
      }
    })();
    const unsubFocus = navigation.addListener('focus', () => {
      fetchFromBackend(true);
    });
    return () => {
      mounted = false;
      unsubFocus && unsubFocus();
    };
  }, [navigation, fetchFromBackend]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFromBackend(true);
  }, [fetchFromBackend]);

  const getIconName = useCallback(tipo => {
    switch (tipo) {
      case 'Conteo de Votos':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  }, []);

  const handleNotificationPress = useCallback(
    item => {
      if (item.tipo === 'Conteo de Votos') {
        const mesaData = {
          id: item.id,
          numero: item.mesa,
          nombre: item.mesa,
          recinto: item.colegio,
          direccion: item.direccion,
          distancia: item.distancia || 'Cerca',
          latitude: -16.5,
          longitude: -68.15,
          estado: item.estado || 'iniciado',
        };

        navigation.navigate('CountTableDetail', {mesa: mesaData});
      }
    },
    [navigation],
  );

  const renderNotificationItem = useCallback(
    ({item, index}) => (
      <TouchableOpacity
        testID={`notificationItem_${index}`}
        style={localStyle.notificationCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        <View
          testID={`notificationCardContent_${index}`}
          style={localStyle.cardContent}>
          <Ionicons
            testID={`notificationIcon_${index}`}
            name={getIconName(item.tipo)}
            size={38}
            color={'#111'}
            style={{marginTop: 3}}
          />
          <View
            testID={`notificationContentContainer_${index}`}
            style={localStyle.contentContainer}>
            <View
              testID={`notificationHeaderRow_${index}`}
              style={localStyle.headerRow}>
              <Text
                testID={`notificationTitle_${index}`}
                style={localStyle.title}>
                {item.mesa}
              </Text>
              <View
                testID={`notificationRightInfo_${index}`}
                style={localStyle.rightInfo}>
                {item.distancia && (
                  <Text
                    testID={`notificationDistance_${index}`}
                    style={localStyle.distance}>
                    {item.distancia}
                  </Text>
                )}
                <Text
                  testID={`notificationTime_${index}`}
                  style={localStyle.time}>
                  {formatTiempoRelativo(item.timestamp)}
                </Text>
              </View>
            </View>
            <Text
              testID={`notificationSubtitle_${index}`}
              style={localStyle.subtitle}>
              {item.tipo}
            </Text>
            <Text
              testID={`notificationCollege_${index}`}
              style={localStyle.detailText}>
              {item.colegio}
            </Text>
            <Text
              testID={`notificationAddress_${index}`}
              style={localStyle.detailText}>
              {item.direccion}
            </Text>
            {item.tipo === 'Conteo de Votos' && (
              <View
                testID={`notificationActionHint_${index}`}
                style={localStyle.actionHint}>
                <Ionicons
                  testID={`notificationActionIcon_${index}`}
                  name="arrow-forward"
                  size={16}
                  color="#2790b0"
                />
                <Text
                  testID={`notificationActionText_${index}`}
                  style={localStyle.actionText}>
                  Toca para ver detalles
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [getIconName, handleNotificationPress],
  );

  return (
    <View
      testID="notificationScreenContainer"
      style={{flex: 1, backgroundColor: '#fff'}}>
      <CStandardHeader
        testID="notificationHeader"
        title="Notificaciones"
        onPressBack={() => navigation.goBack()}
      />

      <FlatList
        testID="notificationList"
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={renderNotificationItem}
        contentContainerStyle={localStyle.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View testID="notificationSeparator" style={localStyle.separator} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View
              testID="notificationEmptyState"
              style={{marginTop: 50, alignItems: 'center'}}>
              <Text testID="notificationEmptyText">No hay notificaciones</Text>
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
