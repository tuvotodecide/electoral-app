import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {FirebaseNotificationService} from '../services/FirebaseNotificationService';

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
        setInitializationError(null);

        const result = await notificationService.initializeUser(
          userData.address,
          {
            nombre: userData.nombre || userData.address.substring(0, 8) + '...',
            direccion: userData.direccion || '',
            telefono: userData.telefono || '',
            email: userData.email || '',
          },
        );

        if (result.success) {
          setIsInitialized(true);
        } else {
          
          setInitializationError(result.error);
        }
      } catch (error) {
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
    notificationService,
  };
};
