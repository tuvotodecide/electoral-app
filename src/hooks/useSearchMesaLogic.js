import {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

export const useSearchMesaLogic = navigationTarget => {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMesaPress = mesa => {
    navigation.navigate(navigationTarget, {mesa});
  };

  const handleNotificationPress = () => {
    // Implementar lógica de notificaciones si es necesario
    console.log('Notification pressed');
  };

  const handleHomePress = () => {
    // Implementar navegación a inicio
    console.log('Home pressed');
  };

  const handleProfilePress = () => {
    // Implementar navegación a perfil
    console.log('Profile pressed');
  };

  return {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleMesaPress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  };
};
