import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import CameraScreen from '../../container/Vote/UploadRecord/CameraScreen';

const Stack = createStackNavigator();

export default function StackNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={StackNav.Splash}>
      <Stack.Screen name={StackNav.Splash} component={StackRoute.Splash} />

      <Stack.Screen
        name={StackNav.AuthNavigation}
        component={StackRoute.AuthNavigation}
      />
      <Stack.Screen
        name={StackNav.TabNavigation}
        component={StackRoute.TabNavigation}
      />

      {/* Pantallas de Voto */}
      <Stack.Screen
        name={StackNav.SearchTable}
        component={StackRoute.SearchTable}
      />
      <Stack.Screen
        name={StackNav.TableDetail}
        component={StackRoute.TableDetail}
      />
      <Stack.Screen
        name={StackNav.WitnessRecord}
        component={StackRoute.WitnessRecord}
      />
      <Stack.Screen
        name={StackNav.AnnounceCount}
        component={StackRoute.AnnounceCount}
      />
      <Stack.Screen
        name={StackNav.SearchCountTable}
        component={StackRoute.SearchCountTable}
      />
      <Stack.Screen
        name={StackNav.CountTableDetail}
        component={StackRoute.CountTableDetail}
      />
      <Stack.Screen
        name={StackNav.MyWitnessesDetailScreen}
        component={StackRoute.MyWitnessesDetailScreen}
      />

      {/* Profile y configuración */}
      <Stack.Screen
        name={StackNav.PersonalDetails}
        component={StackRoute.PersonalDetails}
      />
      <Stack.Screen
        name={StackNav.RecuperationQR}
        component={StackRoute.RecuperationQR}
      />
      <Stack.Screen
        name={StackNav.Guardians}
        component={StackRoute.Guardians}
      />
      <Stack.Screen
        name={StackNav.GuardiansAdmin}
        component={StackRoute.GuardiansAdmin}
      />
      <Stack.Screen
        name={StackNav.AddGuardians}
        component={StackRoute.AddGuardians}
      />

      <Stack.Screen
        name={StackNav.SelectLanguage}
        component={StackRoute.SelectLanguage}
      />
      <Stack.Screen
        name={StackNav.PushNotification}
        component={StackRoute.PushNotification}
      />
      <Stack.Screen
        name={StackNav.HelpCenter}
        component={StackRoute.HelpCenter}
      />
      <Stack.Screen
        name={StackNav.FAQScreen}
        component={StackRoute.FAQScreen}
      />
      <Stack.Screen
        name={StackNav.PrivacyPolicies}
        component={StackRoute.PrivacyPolicies}
      />
      <Stack.Screen
        name={StackNav.ChangePinVerify}
        component={StackRoute.ChangePinVerify}
      />
      <Stack.Screen
        name={StackNav.ChangePinNew}
        component={StackRoute.ChangePinNew}
      />
      <Stack.Screen
        name={StackNav.ChangePinNewConfirm}
        component={StackRoute.ChangePinNewConfirm}
      />
      <Stack.Screen
        name={StackNav.TermsAndCondition}
        component={StackRoute.TermsAndCondition}
      />
      <Stack.Screen
        name={StackNav.Notification}
        component={StackRoute.Notification}
      />
      <Stack.Screen
        name={StackNav.NotificationDetails}
        component={StackRoute.NotificationDetails}
      />

      {/* Pantallas de cámara para votación */}
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={StackNav.PhotoReviewScreen}
        component={StackRoute.PhotoReviewScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={StackNav.PhotoConfirmationScreen}
        component={StackRoute.PhotoConfirmationScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={StackNav.SuccessScreen}
        component={StackRoute.SuccessScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}
