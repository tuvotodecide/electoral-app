import {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import { TabNav } from '../navigation/NavigationKey';

export const useSearchTableLogic = navigationTarget => {
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTablePress = tableOrParams => {
    // If it's an object with tableData and photoUri, pass it directly
    // If not, assume it's a simple table and wrap it
    const params = tableOrParams.tableData
      ? tableOrParams
      : {table: tableOrParams, mesa: tableOrParams}; // Add mesa parameter for consistency

    navigation.navigate(navigationTarget, params);
  };

  const handleNotificationPress = () => {
    // Implement notification logic if needed
  };

  const handleHomePress = () => {
    const parent = navigation.getParent(); // Tab navigator (si existe)
    if (parent?.navigate) {
      parent.navigate(TabNav.HomeScreen, {screen: 'HomeMain'});
    } else {
      navigation.navigate('HomeMain'); // fallback si ya estás dentro del HomeStack
    }
  };

  const handleProfilePress = () => {
    // Implement profile navigation
  };

  return {
    colors,
    searchText,
    setSearchText,
    handleBack,
    handleTablePress,
    handleNotificationPress,
    handleHomePress,
    handleProfilePress,
  };
};
