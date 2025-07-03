import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';

export default function Icono({name, size = 24, color, style = {}}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <Icon
      name={name}
      size={size}
      color={color || colors.textColor}
      style={style}
    />
  );
}
