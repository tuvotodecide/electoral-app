import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginUserTest from '../../container/Auth/LoginUserTest';
import ConnectTest from '../../container/ConnectTest';

const Stack = createNativeStackNavigator();

export default function AuthNavigationTest() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="ConnectTest">
      <Stack.Screen name="ConnectTest" component={ConnectTest} />
      <Stack.Screen name="LoginUserTest" component={LoginUserTest} />
    </Stack.Navigator>
  );
}
