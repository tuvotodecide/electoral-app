import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';
import functions from '@react-native-firebase/functions';
import {Platform, PermissionsAndroid} from 'react-native';
import { geoLocationService } from './GeoLocationService';
import { localNotificationStorageService } from './LocalNotificationStorageService';

// Configuración Firebase para notificaciones
export class FirebaseNotificationService {
  constructor(locationService, storageService) {
    this.locationService = locationService;
    this.storageService = storageService;
    this.setupNotifications();
  }

  // Inicializar notificaciones
  async setupNotifications() {
    // await this.requestUserPermission();
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
      return true;
    }
    return false;
  }

  // Obtener token FCM
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      return null;
    }
  }

  // Configurar handler para mensajes en primer plano
  setupForegroundMessageHandler() {
    messaging().onMessage(async remoteMessage => {
      // Delegar almacenamiento a LocalNotificationStorageService
      await this.storageService.storeNotificationLocally(remoteMessage);
    });
  }

  // Almacenar notificación localmente (Delegado para mantener compatibilidad)
  async storeNotificationLocally(remoteMessage) {
    return this.storageService.storeNotificationLocally(remoteMessage);
  }

  // Obtener notificaciones almacenadas (Delegado para mantener compatibilidad)
  async getStoredNotifications() {
    return this.storageService.getStoredNotifications();
  }

  // Configurar handler para mensajes en segundo plano
  setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      // Delegar almacenamiento a LocalNotificationStorageService
      await this.storageService.storeNotificationLocally(remoteMessage);
    });
  }

  // Inicializar usuario al entrar a la aplicación
  async initializeUser(userId, userData = {}) {
    try {
      // Obtener token FCM
      const fcmToken = await this.getFCMToken();
      if (!fcmToken) {
        throw new Error('No se pudo obtener el token FCM');
      }

      // Obtener ubicación actual delegada a GeoLocationService
      const location = await this.locationService.getCurrentLocation();
      const geohash = this.locationService.calculateGeohash(
        location?.latitude || 0,
        location?.longitude || 0,
      );

      // Datos del usuario para guardar
      const userInfo = {
        fcmToken: fcmToken,
        ubicacion: {
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0,
        },
        geohash: geohash,
        ultimaActualizacion: database.ServerValue.TIMESTAMP,
        activo: true,
        nombre: userData.nombre || 'Usuario',
        ...userData, // Otros datos del usuario que se pasen
      };

      // Guardar en Realtime Database
      const userRef = database().ref(`usuarios/${userId}`);
      await userRef.set(userInfo);

      return {
        success: true,
        userId,
        location,
        fcmToken,
        geohash,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Obtener ubicación actual (Delegado para compatibilidad)
  getCurrentLocation() {
    return this.locationService.getCurrentLocation();
  }

  // Función simple para calcular geohash (Delegado para compatibilidad)
  calculateGeohash(latitude, longitude, precision = 7) {
    return this.locationService.calculateGeohash(latitude, longitude, precision);
  }

  // Calcular distancia entre dos puntos (Delegado para compatibilidad)
  calculateDistance(lat1, lng1, lat2, lng2) {
    return this.locationService.calculateDistance(lat1, lng1, lat2, lng2);
  }

  async updateUserLocation(userId) {
    try {
      // Solicitar permisos de ubicación
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Permiso de ubicación denegado');
        }
      }

      return new Promise((resolve, reject) => {
        // Geolocation.getCurrentPosition(...)
        // Este bloque en la versión original estaba comentado.
      });
    } catch (error) {
      throw error;
    }
  }

  // Anunciar conteo a usuarios cercanos
  async announceCountToNearbyUsers(userId, announcePayload) {
    try {
      // Obtener ubicación actual delegada a GeoLocationService
      const currentLocation = await this.locationService.getCurrentLocation();

      // Llamar a Cloud Function para procesar y enviar notificaciones
      const announceCount = functions().httpsCallable('announceCountToNearby');

      const result = await announceCount({
        emisorId: userId,
        ubicacionEmisor: {
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
        },
        mesaData: {
          numero: announcePayload.numero,
          codigo: announcePayload.codigo,
          recinto: announcePayload.recinto,
          colegio: announcePayload.colegio,
          provincia: announcePayload.provincia,
          zona: announcePayload.zona,
          distrito: announcePayload.distrito,
        },
        radio: 300, // 300 metros
      });

      return result.data;
    } catch (error) {
      throw error;
    }
  }
}

// Instancia singleton
export const firebaseNotificationService = new FirebaseNotificationService(
  geoLocationService,
  localNotificationStorageService
);
