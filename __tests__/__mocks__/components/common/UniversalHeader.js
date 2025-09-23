// Mock para UniversalHeader
import React from 'react';

const UniversalHeader = ({ title, onBack, testID, colors, ...props }) => {
  return React.createElement('View', { testID }, [
    React.createElement('View', { testID: `${testID}LeftSide`, key: 'left' }, [
      React.createElement('TouchableOpacity', { 
        testID: `${testID}BackButton`, 
        onPress: onBack,
        key: 'backButton'
      }, [
        React.createElement('MockedMaterialIcons', { key: 'backIcon' })
      ])
    ]),
    React.createElement('View', { testID: `${testID}CenterWrap`, key: 'center' }, [
      React.createElement('Text', { testID: `${testID}Title`, key: 'title' }, title)
    ]),
    React.createElement('View', { testID: `${testID}RightSide`, key: 'right' }, [
      React.createElement('TouchableOpacity', { 
        testID: `${testID}NotificationButton`,
        key: 'notificationButton'
      }, [
        React.createElement('MockedIonicons', { key: 'notificationIcon' })
      ])
    ])
  ]);
};

export default UniversalHeader;
