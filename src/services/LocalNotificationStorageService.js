import AsyncStorage from '@react-native-async-storage/async-storage';

class LocalNotificationStorageService {
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

      const existingNotifications = await this.getStoredNotifications();
      const updatedNotifications = [notification, ...existingNotifications];

      // Limitar a 50 notificaciones máximo
      const limitedNotifications = updatedNotifications.slice(0, 50);

      await AsyncStorage.setItem(
        'local_notifications',
        JSON.stringify(limitedNotifications),
      );
    } catch (error) {
      console.warn('Error storing notification:', error);
    }
  }

  async getStoredNotifications() {
    try {
      const notifications = await AsyncStorage.getItem('local_notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      return [];
    }
  }
}

export const localNotificationStorageService = new LocalNotificationStorageService();
