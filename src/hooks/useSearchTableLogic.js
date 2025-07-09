import {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

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
      : {table: tableOrParams};
    navigation.navigate(navigationTarget, params);
  };

  const handleNotificationPress = () => {
    // Implement notification logic if needed
    console.log('Notification pressed');
  };

  const handleHomePress = () => {
    // Implement home navigation
    console.log('Home pressed');
  };

  const handleProfilePress = () => {
    // Implement profile navigation
    console.log('Profile pressed');
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
