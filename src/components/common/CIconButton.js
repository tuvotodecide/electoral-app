import React, { useEffect, useState } from 'react';
import { Animated, Easing, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';

export default function CIconButton({name, onPress, size = 24, color, style = {}, rotate = false}) {
  const colors = useSelector(state => state.theme.theme);
  const [icon, setIcon] = useState(name);
  const [disabled, setDisabled] = useState(false);
  const rotation = useState(new Animated.Value(0))[0];

  const handlePress = async () => {
    if (onPress) {
      setIcon('dots-horizontal');
      setDisabled(true);

      try {
        await onPress();
        setIcon('check');
      } catch {
        setIcon('close');
      } finally {
        setTimeout(() => {
          setIcon(name);
          setDisabled(false);
        }, 1500);
      }
    }
  };

  useEffect(() => {
    if (rotate) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotation.stopAnimation();
      rotation.setValue(0);
    }
  }, [rotate]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = rotate
    ? { transform: [{ rotate: rotateInterpolate }] }
    : {};

  return (
    <TouchableOpacity onPress={handlePress} disabled={disabled}>
      <Animated.View style={animatedStyle}>
        <Icon
          name={icon}
          size={size}
          color={color || colors.textColor}
          style={style}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
