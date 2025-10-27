import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';

export default function CIconButton({name, onPress, size = 24, color, style = {}}) {
  const colors = useSelector(state => state.theme.theme);
  const [icon, setIcon] = useState(name);
  const [disabled, setDisabled] = useState(false);

  const handlePress = async () => {
    if (onPress) {
      setIcon('dots-horizontal');
      setDisabled(true);
      try {
        await onPress();
        setIcon('check');
        setTimeout(() => {
          setIcon(name);
          setDisabled(false);
        }, 1500);
      } catch {
        setIcon('close');
        setTimeout(() => {
          setIcon(name);
          setDisabled(false);
        }, 1500);
      }
    }
  }

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled}>
      <Icon
        name={icon}
        size={size}
        color={color || colors.textColor}
        style={style}
      />
    </TouchableOpacity>
    
  );
}
