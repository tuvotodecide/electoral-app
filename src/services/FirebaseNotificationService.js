import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  onMessage,
  requestPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { getDatabase, ref, serverTimestamp, set } from '@react-native-firebase/database';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { geoLocationService } from './GeoLocationService';
import { localNotificationStorageService } from './LocalNotificationStorageService';

// Configuración Firebase para notificaciones
// eslint-disable-next-line import/no-unused-modules
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
    const authStatus = await requestPermission(getMessaging());
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      return true;
    }
    return false;
  }

  // Obtener token FCM
  async getFCMToken() {
    try {
      const token = await getToken(getMessaging());
      return token;
    } catch (_) {
      return null;
    }
  }

  // Configurar handler para mensajes en primer plano
  setupForegroundMessageHandler() {
    onMessage(getMessaging(), async remoteMessage => {
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
    setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
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
        ultimaActualizacion: serverTimestamp(),
        activo: true,
        nombre: userData.nombre || 'Usuario',
        ...userData, // Otros datos del usuario que se pasen
      };

      // Guardar en Realtime Database
      const userRef = ref(getDatabase(), `usuarios/${userId}`);
      await set(userRef, userInfo);

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

  // Anunciar conteo a usuarios cercanos
  async announceCountToNearbyUsers(userId, mesaData, locationData) {
    try {
      // Obtener ubicación actual delegada a GeoLocationService
      const currentLocation = await this.locationService.getCurrentLocation();

      // Llamar a Cloud Function para procesar y enviar notificaciones
      const announceCount = httpsCallable(getFunctions(), 'announceCountToNearby');

      const result = await announceCount({
        emisorId: userId,
        ubicacionEmisor: {
          latitude: currentLocation?.latitude || 0,
          longitude: currentLocation?.longitude || 0,
        },
        mesaData: {
          numero: mesaData.numero || mesaData.nombre,
          codigo: mesaData.codigo || mesaData.id,
          recinto: mesaData.recinto || locationData?.name,
          colegio: mesaData.colegio || locationData?.name,
          provincia: mesaData.provincia || locationData?.address || 'La Paz',
          zona: mesaData.zona || locationData?.zone,
          distrito: mesaData.distrito || locationData?.district,
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
