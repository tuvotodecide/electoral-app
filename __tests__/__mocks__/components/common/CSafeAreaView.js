// Mock para CSafeAreaView
import React from 'react';

const CSafeAreaView = ({ children, testID, style, ...props }) => {
  return React.createElement('SafeAreaView', { testID, style, ...props }, children);
};

export default CSafeAreaView;
