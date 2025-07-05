import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import HomeScreen from '../../container/TabBar/Home/HomeScreen';
import CameraScreen from '../../container/Voto/SubirActa/CameraScreen';
import CameraPermissionTest from '../../container/Voto/SubirActa/CameraPermissionTest';

const HomeStack = createStackNavigator();

export default function HomeStackNavigation() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="HomeMain">
      {/* Pantalla principal del Home */}
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />

      {/* Pantallas de Voto anidadas */}
      <HomeStack.Screen
        name={StackNav.BuscarMesa}
        component={StackRoute.BuscarMesa}
      />
      <HomeStack.Screen
        name={StackNav.DetalleMesa}
        component={StackRoute.DetalleMesa}
      />
      <HomeStack.Screen name="CameraScreen" component={CameraScreen} />
      <HomeStack.Screen
        name="CameraPermissionTest"
        component={CameraPermissionTest}
      />
      <HomeStack.Screen
        name={StackNav.PhotoReviewScreen}
        component={StackRoute.PhotoReviewScreen}
      />
      <HomeStack.Screen
        name={StackNav.PhotoConfirmationScreen}
        component={StackRoute.PhotoConfirmationScreen}
      />
      <HomeStack.Screen
        name={StackNav.AtestiguarActa}
        component={StackRoute.AtestiguarActa}
      />
      <HomeStack.Screen
        name={StackNav.CualEsCorrectaScreen}
        component={StackRoute.CualEsCorrectaScreen}
      />
      <HomeStack.Screen
        name={StackNav.AnunciarConteo}
        component={StackRoute.AnunciarConteo}
      />
      <HomeStack.Screen
        name={StackNav.BuscarMesaConteo}
        component={StackRoute.BuscarMesaConteo}
      />
      <HomeStack.Screen
        name={StackNav.DetalleMesaConteo}
        component={StackRoute.DetalleMesaConteo}
      />
      <HomeStack.Screen
        name={StackNav.MisAtestiguamientos}
        component={StackRoute.MisAtestiguamientos}
      />
    </HomeStack.Navigator>
  );
}
