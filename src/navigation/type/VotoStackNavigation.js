import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import CameraScreen from '../../container/Voto/SubirActa/CameraScreen';

const VotoStack = createStackNavigator();

export default function VotoStackNavigation() {
  return (
    <VotoStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      //   initialRouteName={StackNav.SubirActa}>
      //   <VotoStack.Screen
      //     name={StackNav.SubirActa}
      //     component={StackRoute.SubirActa}
      //   />
      initialRouteName={StackNav.BuscarMesa}>
      <VotoStack.Screen
        name={StackNav.BuscarMesa}
        component={StackRoute.BuscarMesa}
      />
      <VotoStack.Screen
        name={StackNav.DetalleMesa}
        component={StackRoute.DetalleMesa}
      />
      <VotoStack.Screen
        name={StackNav.AtestiguarActa}
        component={StackRoute.AtestiguarActa}
      />
      <VotoStack.Screen
        name={StackNav.AnunciarConteo}
        component={StackRoute.AnunciarConteo}
      />
      <VotoStack.Screen
        name={StackNav.MisAtestiguamientos}
        component={StackRoute.MisAtestiguamientos}
      />
      <VotoStack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{headerShown: false}}
      />
    </VotoStack.Navigator>
  );
}
