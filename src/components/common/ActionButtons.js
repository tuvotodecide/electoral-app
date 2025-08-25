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
        key={`action-button-${index}`} // Usar key más específica
        style={[styles.actionButton, button.style]}
        onPress={button.onPress}
        testID={button.testID}
        >
        <CText style={[styles.actionButtonText, button.textStyle]}>
          {button.text}
        </CText>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'column', // Cambio de 'row' a 'column' para apilar verticalmente
    marginBottom: getResponsiveSize(16, 32, 40),
    gap: getResponsiveSize(8, 12, 16),
  },
  actionButton: {
    width: '100%', // Ocupar todo el ancho disponible
    paddingVertical: getResponsiveSize(12, 16, 20), // Aumentar padding vertical
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: getResponsiveSize(14, 16, 18), // Hacer texto responsivo
    fontWeight: '600',
  },
});

export default ActionButtons;
