import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FirebaseNotificationService } from '../services/FirebaseNotificationService';

export const useFirebaseUserSetup = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const userData = useSelector(state => state.wallet.payload);
  const notificationService = new FirebaseNotificationService();

  useEffect(() => {
    const initializeUser = async () => {
      if (!userData || !userData.address || isInitialized) {
        return;
      }

      try {
        console.log('🚀 Inicializando usuario Firebase:', userData.address);
        setInitializationError(null);
        
        const result = await notificationService.initializeUser(userData.address, {
          nombre: userData.nombre || userData.address.substring(0, 8) + '...',
          direccion: userData.direccion || '',
          telefono: userData.telefono || '',
          email: userData.email || ''
        });
        
        if (result.success) {
          console.log('✅ Usuario inicializado exitosamente');
          console.log('📱 Token FCM:', result.fcmToken?.substring(0, 20) + '...');
          console.log('📍 Ubicación:', `${result.location.latitude}, ${result.location.longitude}`);
          console.log('🗺️  Geohash:', result.geohash);
          setIsInitialized(true);
        } else {
          console.error('❌ Error inicializando usuario:', result.error);
          setInitializationError(result.error);
        }
      } catch (error) {
        console.error('❌ Error en inicialización Firebase:', error);
        setInitializationError(error.message);
      }
    };

    initializeUser();
  }, [userData, isInitialized]);

  // Reinicializar si cambian los datos del usuario
  useEffect(() => {
    if (userData && userData.address) {
      setIsInitialized(false);
    }
  }, [userData?.address]);

  return {
    isInitialized,
    initializationError,
    notificationService
  };
};
