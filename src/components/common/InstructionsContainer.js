import React from 'react';
import {View, StyleSheet} from 'react-native';
import CText from './CText';
import {moderateScale} from '../../common/constants';

export const InstructionsContainer = ({text, style}) => (
  <View style={[styles.instructionsContainer, style]}>
    <CText style={styles.instructionsText}>{text}</CText>
  </View>
);

const styles = StyleSheet.create({
  instructionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  instructionsText: {
    fontSize: moderateScale(16),
    color: '#2F2F2F',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default InstructionsContainer;
