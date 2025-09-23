// Mock para CustomModal
import React from 'react';

const CustomModal = ({ visible, onClose, type, title, message, buttonText, testID, ...props }) => {
  if (!visible) return null;
  
  return React.createElement('Modal', {}, [
    React.createElement('View', { key: 'backdrop' }, [
      React.createElement('View', { key: 'content' }, [
        React.createElement('View', { key: 'icon' }, [
          React.createElement('MockedIonicons', { key: 'modalIcon' })
        ]),
        React.createElement('Text', { key: 'title' }, title),
        React.createElement('Text', { key: 'message' }, message),
        React.createElement('View', { key: 'buttons' }, [
          React.createElement('TouchableOpacity', { 
            testID: 'customModalPrimaryButton',
            onPress: onClose,
            key: 'primaryButton'
          }, [
            React.createElement('Text', { key: 'buttonText' }, buttonText)
          ])
        ])
      ])
    ])
  ]);
};

export default CustomModal;
