import {StyleSheet} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import {styles} from '../../themes';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale} from '../../common/constants';

export default CSafeAreaView = ({children, addTabPadding = true, ...props}) => {
  const colors = useSelector(state => state.theme.theme);
  const insets = useSafeAreaInsets();
  
  // Calcular padding inferior automáticamente para el TabNavigation
  const bottomPadding = addTabPadding ? moderateScale(100) : 0;
  
  return (
    <SafeAreaView 
      {...props} 
      style={[
        localStyle(colors, props.style, bottomPadding).root
      ]}>
      {children}
    </SafeAreaView>
  );
};

const localStyle = (colors, style, bottomPadding) =>
  StyleSheet.create({
    root: {
      ...styles.flex,
      backgroundColor: colors.backgroundColor,
      paddingBottom: bottomPadding,
      ...style,
    },
  });
