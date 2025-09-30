const React = require('react');
const {View} = require('react-native');

module.exports = ({FooterComponent, HeaderComponent, ...props}) =>
  React.createElement(
    View,
    {testID: props?.testID || 'mockImageViewing'},
    HeaderComponent ? React.createElement(HeaderComponent) : null,
    FooterComponent ? React.createElement(FooterComponent) : null,
  );
