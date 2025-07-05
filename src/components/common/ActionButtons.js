import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import CText from './CText';
import {moderateScale} from '../../common/constants';

// Action Buttons Component
export const ActionButtons = ({buttons, style}) => (
  <View style={[styles.actionButtons, style]}>
    {buttons.map((button, index) => (
      <TouchableOpacity
        key={index}
        style={[styles.actionButton, button.style]}
        onPress={button.onPress}>
        <CText style={[styles.actionButtonText, button.textStyle]}>
          {button.text}
        </CText>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(32),
    gap: moderateScale(12),
  },
  actionButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default ActionButtons;
