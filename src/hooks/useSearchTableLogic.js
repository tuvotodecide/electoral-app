import {useState} from 'react';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {StackNav, TabNav} from '../navigation/NavigationKey';

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
    let rootNav = navigation;

    while (rootNav && rootNav.getParent && rootNav.getParent()) {
      rootNav = rootNav.getParent();
    }

    if (
      !CommonActions ||
      typeof CommonActions.reset !== 'function' ||
      !rootNav ||
      typeof rootNav.dispatch !== 'function'
    ) {
      return;
    }

    rootNav.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: StackNav.TabNavigation,
            params: {
              screen: TabNav.HomeScreen,
              params: {screen: 'HomeMain'},
            },
          },
        ],
      }),
    );
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
