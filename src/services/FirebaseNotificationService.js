import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';
// import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración Firebase para notificaciones
export class FirebaseNotificationService {
  constructor() {
    this.setupNotifications();
  }

  // Inicializar notificaciones
  async setupNotifications() {
    await this.requestUserPermission();
    await this.setupForegroundMessageHandler();
    await this.setupBackgroundMessageHandler();
  }

  // Solicitar permisos de notificación
  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      return true;
    }
    return false;
  }

  // Obtener token FCM
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Configurar handler para mensajes en primer plano
  setupForegroundMessageHandler() {
    messaging().onMessage(async remoteMessage => {
      console.log('Mensaje recibido en primer plano:', remoteMessage);
      // Almacenar la notificación localmente
      await this.storeNotificationLocally(remoteMessage);
    });
  }

  // Almacenar notificación localmente
  async storeNotificationLocally(remoteMessage) {
    try {
      const notification = {
        id: Date.now(),
        mesa: remoteMessage.data?.mesa || 'Mesa desconocida',
        tipo: 'Conteo de Votos',
        colegio: remoteMessage.data?.recinto || 'Recinto desconocido',
        direccion: remoteMessage.data?.direccion || 'Dirección no disponible',
        tiempo: 'Ahora',
        icon: 'megaphone',
        estado: 'iniciado',
        timestamp: Date.now(),
        distancia: remoteMessage.data?.distancia || 'Cerca',
        latitude: parseFloat(remoteMessage.data?.latitude) || null,
        longitude: parseFloat(remoteMessage.data?.longitude) || null,
      };

      // Obtener notificaciones existentes
      const existingNotifications = await this.getStoredNotifications();
      const updatedNotifications = [notification, ...existingNotifications];
      
      // Limitar a 50 notificaciones máximo
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      await AsyncStorage.setItem('local_notifications', JSON.stringify(limitedNotifications));
      console.log('Notificación almacenada localmente');
    } catch (error) {
      console.error('Error almacenando notificación:', error);
    }
  }

  // Obtener notificaciones almacenadas
  async getStoredNotifications() {
    try {
      const notifications = await AsyncStorage.getItem('local_notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  // Configurar handler para mensajes en segundo plano
  setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Mensaje recibido en segundo plano:', remoteMessage);
      // Almacenar la notificación localmente
      await this.storeNotificationLocally(remoteMessage);
    });
  }

  // Inicializar usuario al entrar a la aplicación
  async initializeUser(userId, userData = {}) {
    try {
      console.log('Inicializando usuario:', userId);
      
      // Obtener token FCM
      const fcmToken = await this.getFCMToken();
      if (!fcmToken) {
        throw new Error('No se pudo obtener el token FCM');
      }

      // Obtener ubicación actual
      const location = await this.getCurrentLocation();
      const geohash = this.calculateGeohash(location.latitude, location.longitude);

      // Datos del usuario para guardar
      const userInfo = {
        fcmToken: fcmToken,
        ubicacion: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        geohash: geohash,
        ultimaActualizacion: database.ServerValue.TIMESTAMP,
        activo: true,
        nombre: userData.nombre || 'Usuario',
        ...userData // Otros datos del usuario que se pasen
      };

      // Guardar en Realtime Database
      const userRef = database().ref(`usuarios/${userId}`);
      await userRef.set(userInfo);

      console.log('Usuario inicializado correctamente:', userId);
      console.log('Geohash:', geohash);
      console.log('Ubicación:', location);

      return {
        success: true,
        userId,
        location,
        fcmToken,
        geohash
      };
    } catch (error) {
      console.error('Error inicializando usuario:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener ubicación actual (método auxiliar)
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (Platform.OS === 'android') {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ).then((granted) => {
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            reject(new Error('Permiso de ubicación denegado'));
            return;
          }
          
          // Geolocation.getCurrentPosition(
          //   (position) => {
          //     resolve({
          //       latitude: position.coords.latitude,
          //       longitude: position.coords.longitude
          //     });
          //   },
          //   (error) => reject(error),
          //   {
          //     enableHighAccuracy: true,
          //     timeout: 15000,
          //     maximumAge: 10000,
          //   }
          // );
        });
      } else {
        // Geolocation.getCurrentPosition(
        //   (position) => {
        //     resolve({
        //       latitude: position.coords.latitude,
        //       longitude: position.coords.longitude
        //     });
        //   },
        //   (error) => reject(error),
        //   {
        //     enableHighAccuracy: true,
        //     timeout: 15000,
        //     maximumAge: 10000,
        //   }
        // );
      }
    });
  }
  async updateUserLocation(userId) {
    try {
      // Solicitar permisos de ubicación
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Permiso de ubicación denegado');
        }
      }

      return new Promise((resolve, reject) => {
        // Geolocation.getCurrentPosition(
        //   async (position) => {
        //     try {
        //       const { latitude, longitude } = position.coords;
        //       const fcmToken = await this.getFCMToken();

        //       // Calcular geohash para consultas eficientes
        //       const geohash = this.calculateGeohash(latitude, longitude);

        //       // Guardar en Realtime Database
        //       const userRef = database().ref(`usuarios/${userId}`);
        //       await userRef.set({
        //         ubicacion: {
        //           latitude: latitude,
        //           longitude: longitude
        //         },
        //         geohash: geohash,
        //         fcmToken: fcmToken,
        //         ultimaActualizacion: database.ServerValue.TIMESTAMP,
        //         activo: true
        //       });

        //       console.log('Usuario actualizado en Realtime Database:', userId);
        //       resolve({ latitude, longitude });
        //     } catch (error) {
        //       console.error('Error actualizando usuario:', error);
        //       reject(error);
        //     }
        //   },
        //   (error) => {
        //     console.error('Error obteniendo ubicación:', error);
        //     reject(error);
        //   },
        //   {
        //     enableHighAccuracy: true,
        //     timeout: 15000,
        //     maximumAge: 10000,
        //   }
        // );
      });
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      throw error;
    }
  }

  // Función simple para calcular geohash (versión básica)
  calculateGeohash(latitude, longitude, precision = 7) {
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let latRange = [-90, 90];
    let lngRange = [-180, 180];
    let geohash = '';
    let even = true;
    let bit = 0;
    let ch = 0;

    while (geohash.length < precision) {
      if (even) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (longitude >= mid) {
          ch |= (1 << (4 - bit));
          lngRange[0] = mid;
        } else {
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (latitude >= mid) {
          ch |= (1 << (4 - bit));
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }

      even = !even;
      if (bit < 4) {
        bit++;
      } else {
        geohash += base32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return geohash;
  }

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en metros
  }

  // Anunciar conteo a usuarios cercanos
  async announceCountToNearbyUsers(userId, mesaData, locationData) {
    try {
      console.log('Iniciando anuncio de conteo para usuarios cercanos...');
      
      // Obtener ubicación actual del usuario que anuncia
      const currentLocation = await this.updateUserLocation(userId);
      
      // Llamar a Cloud Function para procesar y enviar notificaciones
      const functions = require('@react-native-firebase/functions').default;
      const announceCount = functions().httpsCallable('announceCountToNearby');
      
      const result = await announceCount({
        emisorId: userId,
        ubicacionEmisor: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        },
        mesaData: {
          numero: mesaData.numero,
          codigo: mesaData.codigo,
          recinto: mesaData.recinto || locationData?.name,
          colegio: mesaData.colegio || locationData?.name,
          provincia: mesaData.provincia || locationData?.address,
          zona: mesaData.zona || locationData?.zone,
          distrito: mesaData.distrito || locationData?.district
        },
        radio: 300 // 300 metros
      });

      console.log('Resultado del anuncio:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error anunciando conteo:', error);
      throw error;
    }
  }
}

// Instancia singleton
export const firebaseNotificationService = new FirebaseNotificationService();
