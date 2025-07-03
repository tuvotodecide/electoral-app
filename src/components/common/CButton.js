//Library Imports
import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {useSelector} from 'react-redux';
import Color from 'color'; // <- importante para aplicar opacidad

//Local Imports
import {getHeight, moderateScale} from '../../common/constants';
import CText from './CText';
import {styles} from '../../themes';

export default function CButton({
  title,
  type,
  color,
  onPress,
  containerStyle,
  style,
  icon = null,
  frontIcon = null,
  bgColor = null,
  children,
  opt2 = false,
  disabled = false,
  variant = 'default',
  sinMargen = false,
  ...props
}) {
  const colors = useSelector(state => state.theme.theme);

  const isOutlined = variant === 'outlined';

  const backgroundColor = isOutlined
    ? colors.paper
    : disabled
    ? Color(bgColor || colors.primary)
        .alpha(0.5)
        .string()
    : bgColor || colors.primary;

  const textColor = isOutlined
    ? colors.primary
    : disabled
    ? Color(color || colors.white)
        .alpha(0.5)
        .string()
    : color || colors.white;

  const borderStyle = isOutlined
    ? {
        borderWidth: 1,
        borderColor: colors.primary,
      }
    : {};

  return (
    <TouchableOpacity
      onPress={disabled ? null : onPress}
      activeOpacity={0.7}
      disabled={disabled}
      {...props}
      style={[
        localStyle.btnContainer,
        styles.rowCenter,
        opt2 && localStyle.btnOpt2,
        !sinMargen && styles.mv15, // 👈 aplica margen solo si sinMargen es false
        containerStyle,
        {backgroundColor},
        borderStyle,
      ]}>
      {frontIcon}
      <CText type={type} style={style} color={textColor}>
        {title}
      </CText>
      {icon}
      {children}
    </TouchableOpacity>
  );
}

const localStyle = StyleSheet.create({
  btnContainer: {
    height: getHeight(56),
    borderRadius: moderateScale(12),
    width: '100%',
  },
  btnOpt2: {
    width: 'auto',
    alignSelf: 'flex-end',
    paddingHorizontal: moderateScale(20),
    borderWidth: 1,
  },
});
