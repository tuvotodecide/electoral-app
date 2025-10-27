// Mock para CText
const React = require('react');
const {Text} = require('react-native');

const CText = ({children, testID, style, ...props}) => {
  return React.createElement(Text, {testID, style, ...props}, children);
};

module.exports = CText;
module.exports.default = CText;
module.exports.__esModule = true;
