import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {useSelector} from 'react-redux';

export default function Icono({name, size = 24, color, style = {}, ...props}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color || colors.textColor}
      style={style}
      {...props}
    />
  );
}
