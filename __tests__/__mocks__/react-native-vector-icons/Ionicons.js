// Mock para react-native-vector-icons/Ionicons
import React from 'react';

const MockIonicons = ({ name, size, color, style, onPress, ...props }) => {
  return React.createElement('Text', {
    testID: `ionicon-${name}`,
    style: [{ fontSize: size, color }, style],
    onPress,
    ...props,
  }, `Ionicons-${name}`);
};

export default MockIonicons;