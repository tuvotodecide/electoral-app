import React from 'react';
import {View, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import CText from './CText';
import {moderateScale} from '../../common/constants';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375; // Increased from 350

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

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
    marginBottom: getResponsiveSize(16, 32, 40),
    gap: getResponsiveSize(8, 12, 16),
  },
  actionButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(10, 14, 18),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActionButtons;
