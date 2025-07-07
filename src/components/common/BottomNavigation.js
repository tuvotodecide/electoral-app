import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CText from './CText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../common/constants';
import {StackNav} from '../../navigation/NavigationKey';

// Bottom Navigation Component
export const BottomNavigation = ({colors}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() =>
          navigation.navigate(StackNav.TabNavigation, {
            screen: 'HomeScreen',
          })
        }>
        <Ionicons
          name="home-outline"
          size={moderateScale(24)}
          color={colors.primary || '#459151'}
        />
        <CText style={styles.navText}>Inicio</CText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate(StackNav.Profile)}>
        <Ionicons
          name="person-outline"
          size={moderateScale(24)}
          color={colors.text || '#868686'}
        />
        <CText style={styles.navText}>Perfil</CText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: moderateScale(10),
  },
  navItem: {
    alignItems: 'center',
    padding: moderateScale(8),
  },
  navText: {
    fontSize: moderateScale(12),
    color: '#868686',
    marginTop: moderateScale(4),
  },
});

export default BottomNavigation;
