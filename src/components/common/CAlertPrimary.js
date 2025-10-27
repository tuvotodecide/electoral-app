import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';
import CText from './CText';

const hexToRgba = (hex, opacity = 0.1) => {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  // eslint-disable-next-line no-bitwise
  const r = (bigint >> 16) & 255;
  // eslint-disable-next-line no-bitwise
  const g = (bigint >> 8) & 255;
  // eslint-disable-next-line no-bitwise
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function CAlertPrimary({
  icon,
  iconRiaght,
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
      <View style={styles.iconLeft}>{icon}</View>
      <View style={styles.textContainer}>
        <CText type="B15" color={colors.textColor}>
          {title}
        </CText>
        <CText type="R14" color={colors.textColor}>
          {subttle}
        </CText>
      </View>
      <View style={styles.iconRight}>{iconRiaght}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  iconLeft: {
    width: 30,
    alignItems: 'center',
  },
  iconRight: {
    width: 30,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
