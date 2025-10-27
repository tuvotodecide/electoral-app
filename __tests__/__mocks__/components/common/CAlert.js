import React from 'react';
const {View, Text} = require('react-native');

const CAlert = ({testID, status = 'info', message = ''}) => {
  return React.createElement(
    View,
    {testID: testID || 'alert', 'data-status': status},
    React.createElement(
      Text,
      {testID: testID ? `${testID}Icon` : 'alertIcon'},
      `Icon-${status}`,
    ),
    React.createElement(
      Text,
      {testID: testID ? `${testID}Text` : 'alertText'},
      message,
    ),
  );
};

export default CAlert;
