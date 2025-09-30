// Mock para CSafeAreaView
const React = require('react');
const {View} = require('react-native');

const CSafeAreaView = ({children, testID = 'SafeAreaView', style, ...props}) => {
  return React.createElement(View, {testID, style, ...props}, children);
};

module.exports = CSafeAreaView;
