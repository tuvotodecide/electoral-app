import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthNav} from '../NavigationKey';
import {AuthRoute} from '../NavigationRoute';

const Stack = createNativeStackNavigator();

export default function AuthNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={AuthNav.Connect}>
      <Stack.Screen name={AuthNav.Connect} component={AuthRoute.Connect} />
      <Stack.Screen
        name={AuthNav.OnBoarding}
        component={AuthRoute.OnBoarding}
      />
      <Stack.Screen name={AuthNav.Login} component={AuthRoute.Login} />
      <Stack.Screen name={AuthNav.SignUp} component={AuthRoute.SignUp} />
      <Stack.Screen
        name={AuthNav.RegisterUser1}
        component={AuthRoute.RegisterUser1}
      />
      <Stack.Screen
        name={AuthNav.RegisterUser2}
        component={AuthRoute.RegisterUser2}
      />
      <Stack.Screen
        name={AuthNav.RegisterUser3}
        component={AuthRoute.RegisterUser3}
      />
      <Stack.Screen
        name={AuthNav.RegisterUser4}
        component={AuthRoute.RegisterUser4}
      />

      <Stack.Screen
        name={AuthNav.RegisterUser5}
        component={AuthRoute.RegisterUser5}
      />

      <Stack.Screen
        name={AuthNav.RegisterUser6}
        component={AuthRoute.RegisterUser6}
      />

      <Stack.Screen
        name={AuthNav.RegisterUser7}
        component={AuthRoute.RegisterUser7}
      />

      <Stack.Screen
        name={AuthNav.RegisterUser8}
        component={AuthRoute.RegisterUser8}
      />

      <Stack.Screen
        name={AuthNav.RegisterUser9}
        component={AuthRoute.RegisterUser9}
      />

      <Stack.Screen
        name={AuthNav.RegisterUser10}
        component={AuthRoute.RegisterUser10}
      />
      <Stack.Screen
        name={AuthNav.RegisterUser11}
        component={AuthRoute.RegisterUser11}
      />
      <Stack.Screen
        name={AuthNav.FindMyUser}
        component={AuthRoute.FindMyUser}
      />
      <Stack.Screen
        name={AuthNav.RecoveryUser1Pin}
        component={AuthRoute.RecoveryUser1Pin}
      />
      <Stack.Screen
        name={AuthNav.RecoveryUser2Pin}
        component={AuthRoute.RecoveryUser2Pin}
      />
      <Stack.Screen
        name={AuthNav.MyGuardiansStatus}
        component={AuthRoute.MyGuardiansStatus}
      />
      <Stack.Screen
        name={AuthNav.RecoveryFinalize}
        component={AuthRoute.RecoveryFinalize}
      />

      <Stack.Screen name={AuthNav.LoginUser} component={AuthRoute.LoginUser} />

      <Stack.Screen
        name={AuthNav.SelectRecuperation}
        component={AuthRoute.SelectRecuperation}
      />

      <Stack.Screen
        name={AuthNav.AccountLock}
        component={AuthRoute.AccountLock}
      />

      <Stack.Screen
        name={AuthNav.ConditionsRegister}
        component={AuthRoute.ConditionsRegister}
      />

      <Stack.Screen
        name={AuthNav.SignUpWithMobileNumber}
        component={AuthRoute.SignUpWithMobileNumber}
      />
      <Stack.Screen name={AuthNav.OTPCode} component={AuthRoute.OTPCode} />
      <Stack.Screen
        name={AuthNav.CreateNewPassword}
        component={AuthRoute.CreateNewPassword}
      />
      <Stack.Screen
        name={AuthNav.SuccessfulPassword}
        component={AuthRoute.SuccessfulPassword}
      />
      <Stack.Screen
        name={AuthNav.FaceIdScreen}
        component={AuthRoute.FaceIdScreen}
      />
      <Stack.Screen
        name={AuthNav.FingerPrintScreen}
        component={AuthRoute.FingerPrintScreen}
      />
      <Stack.Screen
        name={AuthNav.SelectCountry}
        component={AuthRoute.SelectCountry}
      />
      <Stack.Screen
        name={AuthNav.SelectReason}
        component={AuthRoute.SelectReason}
      />
      <Stack.Screen name={AuthNav.CreatePin} component={AuthRoute.CreatePin} />
      <Stack.Screen
        name={AuthNav.UploadDocument}
        component={AuthRoute.UploadDocument}
      />
      <Stack.Screen
        name={AuthNav.UploadPhotoId}
        component={AuthRoute.UploadPhotoId}
      />
      <Stack.Screen
        name={AuthNav.SelfieWithIdCard}
        component={AuthRoute.SelfieWithIdCard}
      />
      <Stack.Screen
        name={AuthNav.VerifySuccess}
        component={AuthRoute.VerifySuccess}
      />
    </Stack.Navigator>
  );
}
