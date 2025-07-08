import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import CameraScreen from '../../container/Voto/UploadRecord/CameraScreen';

const VotoStack = createStackNavigator();

export default function VotoStackNavigation() {
  return (
    <VotoStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      //   initialRouteName={StackNav.UploadRecord}>
      //   <VotoStack.Screen
      //     name={StackNav.UploadRecord}
      //     component={StackRoute.UploadRecord}
      //   />
      initialRouteName={StackNav.SearchTable}>
      <VotoStack.Screen
        name={StackNav.SearchTable}
        component={StackRoute.SearchTable}
      />
      <VotoStack.Screen
        name={StackNav.TableDetail}
        component={StackRoute.TableDetail}
      />
      <VotoStack.Screen
        name={StackNav.WitnessRecord}
        component={StackRoute.WitnessRecord}
      />
      <VotoStack.Screen
        name={StackNav.WhichIsCorrectScreen}
        component={StackRoute.WhichIsCorrectScreen}
      />
      <VotoStack.Screen
        name={StackNav.ActaReviewScreen}
        component={StackRoute.ActaReviewScreen}
      />
      <VotoStack.Screen
        name={StackNav.ActaCertificationScreen}
        component={StackRoute.ActaCertificationScreen}
      />
      <VotoStack.Screen
        name={StackNav.AnnounceCount}
        component={StackRoute.AnnounceCount}
      />
      <VotoStack.Screen
        name={StackNav.MyWitnesses}
        component={StackRoute.MyWitnesses}
      />
      <VotoStack.Screen
        name={StackNav.MyWitnessesListScreen}
        component={StackRoute.MyWitnessesListScreen}
      />
      <VotoStack.Screen
        name={StackNav.MyWitnessesDetailScreen}
        component={StackRoute.MyWitnessesDetailScreen}
      />
      <VotoStack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{headerShown: false}}
      />
      <VotoStack.Screen
        name="PhotoReviewScreen"
        component={StackRoute.PhotoReviewScreen}
        options={{headerShown: false}}
      />
    </VotoStack.Navigator>
  );
}
