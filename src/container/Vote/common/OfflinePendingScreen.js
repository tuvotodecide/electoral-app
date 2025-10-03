import React from 'react';
import {View, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from '../../../components/common/CText';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import {CommonActions} from '@react-navigation/native';
import {StackNav, TabNav} from '../../../navigation/NavigationKey';

const {width} = Dimensions.get('window');

export default function OfflinePendingScreen({navigation}) {
  return (
    <CSafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={72} color="#2563eb" />
        <CText style={styles.title}>No tienes conexión a Internet.</CText>
        <CText style={styles.body}>
          El acta se guardará y se publicará automáticamente cuando vuelvas a
          conectarte. En ese momento recibirás tu NFT.
        </CText>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.dispatch(
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
            )
          }>
          <CText style={styles.buttonText}>Volver al inicio</CText>
        </TouchableOpacity>
      </View>
    </CSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F8F9'},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: width * 0.82,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontWeight: '700'},
});
