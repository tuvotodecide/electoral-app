import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
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
