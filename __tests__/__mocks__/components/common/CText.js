// Mock para CText
import React from 'react';

const CText = ({ children, testID, style, ...props }) => {
  return React.createElement('Text', { testID, style, ...props }, children);
};

export default CText;
