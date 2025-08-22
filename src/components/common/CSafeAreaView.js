import {StyleSheet, Dimensions} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import {styles} from '../../themes';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {moderateScale} from '../../common/constants';

const {width: screenWidth} = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 375;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

// Calculate TabNavigation height consistently
const getTabNavigationHeight = insets => {
  // Base tab bar height (responsive) + safe area bottom
  const baseTabHeight = getResponsiveSize(66, 72, 78); // Matches TabNavigation.js
  return baseTabHeight + insets.bottom;
};

export default CSafeAreaView = ({children, addTabPadding = true, ...props}) => {
  const colors = useSelector(state => state.theme.theme);
  const insets = useSafeAreaInsets();

  // Calculate bottom padding to ensure content is always above TabNavigation
  const bottomPadding = addTabPadding
    ? getTabNavigationHeight(insets) + getResponsiveSize(8, 12, 16)
    : 0;

  return (
    <SafeAreaView
      {...props}
      style={[localStyle(colors, props.style, bottomPadding).root]}>
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
