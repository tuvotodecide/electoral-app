import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import HomeScreen from '../../container/TabBar/Home/HomeScreen';
import CameraScreen from '../../container/Voto/UploadRecord/CameraScreen';
import CameraPermissionTest from '../../container/Voto/UploadRecord/CameraPermissionTest';

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
        name={StackNav.SearchTable}
        component={StackRoute.SearchTable}
      />
      <HomeStack.Screen
        name={StackNav.TableDetail}
        component={StackRoute.TableDetail}
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
        name={StackNav.SuccessScreen}
        component={StackRoute.SuccessScreen}
      />
      <HomeStack.Screen
        name={StackNav.WitnessRecord}
        component={StackRoute.WitnessRecord}
      />
      <HomeStack.Screen
        name={StackNav.WhichIsCorrectScreen}
        component={StackRoute.WhichIsCorrectScreen}
      />
      <HomeStack.Screen
        name={StackNav.RecordReviewScreen}
        component={StackRoute.RecordReviewScreen}
      />
      <HomeStack.Screen
        name={StackNav.RecordCertificationScreen}
        component={StackRoute.RecordCertificationScreen}
      />
      <HomeStack.Screen
        name={StackNav.AnnounceCount}
        component={StackRoute.AnnounceCount}
      />
      <HomeStack.Screen
        name={StackNav.SearchCountTable}
        component={StackRoute.SearchCountTable}
      />
      <HomeStack.Screen
        name={StackNav.CountTableDetail}
        component={StackRoute.CountTableDetail}
      />
      <HomeStack.Screen
        name={StackNav.MyWitnessesListScreen}
        component={StackRoute.MyWitnessesListScreen}
      />
      <HomeStack.Screen
        name={StackNav.MyWitnessesDetailScreen}
        component={StackRoute.MyWitnessesDetailScreen}
      />
    </HomeStack.Navigator>
  );
}
