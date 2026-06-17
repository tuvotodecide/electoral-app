import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';
import CText from './CText';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moderateScale } from '../../common/constants';

const hexToRgba = (hex, opacity = 0.1) => {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
   
  const r = (bigint >> 16) & 255;
   
  const g = (bigint >> 8) & 255;
   
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function CBigAlert({
  icon,
  title = '',
  subttle = '',
  onPress = () => {},
  testID,
}) {
  const colors = useSelector(state => state.theme.theme);

  const bgColor = hexToRgba(colors.primary, 0.15);

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.container, {backgroundColor: bgColor}]}
      onPress={onPress}>
      { icon &&
        <MaterialCommunityIcons
          name={icon}
          size={moderateScale(45)}
          color={colors.primary}
        />
      }
      <View style={styles.textContainer}>
        <CText type="B20" color={colors.primary} style={styles.title}>
          {title}
        </CText>
        <CText type="B16" color={colors.textColor} style={styles.subtitle}>
          {subttle}
        </CText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: moderateScale(20),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: moderateScale(10)
  },
  subtitle: {
    textAlign: 'center'
  }
});
