import React from 'react';
import {View, StyleSheet} from 'react-native';
import {screenShortSide} from '../../common/constants';
import CText from './CText';

// Responsive helper functions
const isTablet = screenShortSide >= 768;
const isSmallPhone = screenShortSide < 375; // Increased from 350

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

export const InstructionsContainer = ({testID = "instructionsContainer", text, style}) => (
  <View testID={testID} style={[styles.instructionsContainer, style]}>
    <CText testID={`${testID}Text`} style={styles.instructionsText}>{text}</CText>
  </View>
);

const styles = StyleSheet.create({
  instructionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveSize(8, 16, 20),
    paddingBottom: getResponsiveSize(6, 12, 16),
  },
  instructionsText: {
    fontSize: 17,
    color: '#2F2F2F',
    fontWeight: '700',
    textAlign: 'start',
  },
});

export default InstructionsContainer;
