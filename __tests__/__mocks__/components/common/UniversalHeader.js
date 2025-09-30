// Mock para UniversalHeader
const React = require('react');
const {View, TouchableOpacity, Text} = require('react-native');

const UniversalHeader = ({title, onBack, testID = 'UniversalHeader'}) => {
  return React.createElement(
    View,
    {testID},
    React.createElement(
      View,
      {testID: `${testID}LeftSide`},
      React.createElement(
        TouchableOpacity,
        {testID: `${testID}BackButton`, onPress: onBack},
        React.createElement(Text, {testID: `${testID}BackIcon`}, 'Back'),
      ),
    ),
    React.createElement(
      View,
      {testID: `${testID}CenterWrap`},
      React.createElement(Text, {testID: `${testID}Title`}, title),
    ),
    React.createElement(
      View,
      {testID: `${testID}RightSide`},
      React.createElement(
        TouchableOpacity,
        {testID: `${testID}NotificationButton`},
        React.createElement(Text, {testID: `${testID}NotificationIcon`}, 'Bell'),
      ),
    ),
  );
};

module.exports = UniversalHeader;
