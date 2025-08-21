import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackNavigation from './type/StackNavigation';
import {navigationRef} from './RootNavigation';
import notifee from '@notifee/react-native';
import { handleNotificationPress } from '../notifications';

export default function AppNavigator() {
   useEffect(() => {
    (async () => {
      const initial = await notifee.getInitialNotification();
      if (initial) {
     handleNotificationPress(initial.notification);
      }
    })();
  }, []);
  return (
    <NavigationContainer ref={navigationRef}>
      <StackNavigation />
    </NavigationContainer>
  );
}
