import {StyleSheet} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import {styles} from '../../themes';
import { SafeAreaView } from 'react-native-safe-area-context';

export default CSafeAreaView = ({children, ...props}) => {
  const colors = useSelector(state => state.theme.theme);
  return (
    <SafeAreaView {...props} style={[localStyle(colors, props.style).root]}>
      {children}
    </SafeAreaView>
  );
};

const localStyle = (colors, style) =>
  StyleSheet.create({
    root: {
      ...styles.flex,
      backgroundColor: colors.backgroundColor,
      ...style,
    
    },
  });
