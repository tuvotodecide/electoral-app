// Mock para CustomModal
import React from 'react';

const CustomModal = ({ visible, onClose, type, title, message, buttonText, testID, ...props }) => {
  return React.createElement('View', {
    testID: testID || 'unifiedTableScreenModal',
    visible,
    type,
    title,
    message,
    onClose,
    buttonText,
    ...props
  }, [
    visible && React.createElement('View', { key: 'backdrop' }, [
      React.createElement('View', { key: 'content' }, [
        React.createElement('View', { key: 'icon' }, [
          React.createElement('MockedIonicons', { key: 'modalIcon' })
        ]),
        React.createElement('Text', { 
          key: 'title',
          testID: `${testID || 'customModal'}Title`,
          children: title
        }),
        React.createElement('Text', { 
          key: 'message',
          testID: `${testID || 'customModal'}Message`,
          children: message
        }),
        React.createElement('View', { key: 'buttons' }, [
          React.createElement('TouchableOpacity', { 
            testID: `${testID || 'customModal'}CloseButton`,
            onPress: onClose,
            key: 'primaryButton'
          }, [
            React.createElement('Text', { key: 'buttonText', children: buttonText })
          ])
        ])
      ])
    ])
  ]);
};

export default CustomModal;
