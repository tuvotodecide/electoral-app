import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import CameraScreen from '../../container/Vote/UploadRecord/CameraScreen';

const VoteStack = createStackNavigator();

export default function VoteStackNavigation() {
  return (
    <VoteStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      //   initialRouteName={StackNav.UploadRecord}>
      //   <VoteStack.Screen
      //     name={StackNav.UploadRecord}
      //     component={StackRoute.UploadRecord}
      //   />
      initialRouteName={StackNav.ElectoralLocations}>
      <VoteStack.Screen
        name={StackNav.ElectoralLocations}
        component={StackRoute.ElectoralLocations}
      />
      <VoteStack.Screen
        name={StackNav.OfflinePendingScreen}
        component={StackRoute.OfflinePendingScreen}
        options={{headerShown: false}}
      />
      <VoteStack.Screen
        name={StackNav.SearchTable}
        component={StackRoute.SearchTable}
      />
      <VoteStack.Screen
        name={StackNav.TableDetail}
        component={StackRoute.TableDetail}
      />
      <VoteStack.Screen
        name={StackNav.WitnessRecord}
        component={StackRoute.WitnessRecord}
      />
      <VoteStack.Screen
        name={StackNav.WhichIsCorrectScreen}
        component={StackRoute.WhichIsCorrectScreen}
      />
      <VoteStack.Screen
        name={StackNav.RecordReviewScreen}
        component={StackRoute.RecordReviewScreen}
      />
      <VoteStack.Screen
        name={StackNav.RecordCertificationScreen}
        component={StackRoute.RecordCertificationScreen}
      />
      <VoteStack.Screen
        name={StackNav.AnnounceCount}
        component={StackRoute.AnnounceCount}
      />
      <VoteStack.Screen
        name={StackNav.MyWitnesses}
        component={StackRoute.MyWitnesses}
      />
      <VoteStack.Screen
        name={StackNav.MyWitnessesListScreen}
        component={StackRoute.MyWitnessesListScreen}
      />
      <VoteStack.Screen
        name={StackNav.MyWitnessesDetailScreen}
        component={StackRoute.MyWitnessesDetailScreen}
      />
      <VoteStack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{headerShown: false}}
      />
      <VoteStack.Screen
        name="PhotoReviewScreen"
        component={StackRoute.PhotoReviewScreen}
        options={{headerShown: false}}
      />
    </VoteStack.Navigator>
  );
}
