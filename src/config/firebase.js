import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';
import functions from '@react-native-firebase/functions';

// Configuración Firebase
export const firebaseDatabase = database();
export const firebaseMessaging = messaging();
export const firebaseFunctions = functions();

// Configurar región de functions si es necesario
// firebaseFunctions.useFunctionsEmulator('http://localhost:5001');

// Configurar canales de notificación para Android
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    const { default: notifee } = await import('@notifee/react-native');
    
    await notifee.createChannel({
      id: 'conteo_votos',
      name: 'Conteo de Votos',
      sound: 'default',
      importance: 4, // HIGH
      description: 'Notificaciones cuando se inicia un conteo de votos cerca',
    });

    await notifee.createChannel({
      id: 'high_prio',
      name: 'Prioridad Alta',
      sound: 'default',
      importance: 4, // HIGH
      description: 'Notificaciones de alta prioridad',
    });
  }
};

// Configuración inicial de Firebase
export const initializeFirebase = async () => {
  try {
    console.log('🔥 Inicializando Firebase...');
    
    // Verificar que Firebase esté conectado
    const isConnected = await firebaseDatabase.goOnline();
    console.log('📱 Firebase Database conectado');
    
    // Configurar canales de notificación
    await setupNotificationChannels();
    console.log('📢 Canales de notificación configurados');
    
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    return false;
  }
};

export default {
  database: firebaseDatabase,
  messaging: firebaseMessaging,
  functions: firebaseFunctions,
  initialize: initializeFirebase,
};
