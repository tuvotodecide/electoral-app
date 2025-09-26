// Mock para react-native-vector-icons
import React from 'react';

const MockIcon = ({ name, size, color, style, onPress }) => {
  return React.createElement('Text', {
    testID: `icon-${name}`,
    style: [{ fontSize: size, color }, style],
    onPress,
    children: `Icon-${name}`,
  });
};

export const MaterialIcons = MockIcon;
export const Ionicons = MockIcon;
export const FontAwesome = MockIcon;
export const FontAwesome5 = MockIcon;
export const Feather = MockIcon;
export const AntDesign = MockIcon;

export default {
  MaterialIcons,
  Ionicons,
  FontAwesome,
  FontAwesome5,
  Feather,
  AntDesign,
};
