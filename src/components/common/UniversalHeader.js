import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from './CText';
import { moderateScale } from '../../common/constants';

const { width: screenWidth } = Dimensions.get('window');

// Responsive helper functions
const isTablet = screenWidth >= 768;
const isSmallPhone = screenWidth < 350;

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) return small;
  if (isTablet) return large;
  return medium;
};

const UniversalHeader = ({
  colors,
  onBack,
  title = 'Title',
  showNotification = true,
  onNotificationPress,
  customStyles = {},
}) => (
  <View
    style={[
      styles.header,
      customStyles.header,
      {
        paddingHorizontal: getResponsiveSize(12, 16, 24),
        paddingVertical: getResponsiveSize(8, 12, 16),
        minHeight: getResponsiveSize(56, 64, 72),
      },
    ]}>
    <TouchableOpacity
      onPress={onBack}
      style={[
        styles.backButton,
        customStyles.backButton,
        {
          padding: getResponsiveSize(6, 8, 12),
        },
      ]}
      testID="headerBackButton">
      <MaterialIcons
        name="keyboard-arrow-left"
        size={getResponsiveSize(32, 36, 44)}
        color={colors?.black || '#2F2F2F'}
      />
    </TouchableOpacity>
    <CText
      style={[
        styles.headerTitle,
        customStyles.headerTitle,
        {
          fontSize: getResponsiveSize(16, 20, 26),
          marginLeft: getResponsiveSize(4, 8, 12),
          flex: 1,
        },
      ]}>
      {title}
    </CText>
    {showNotification && (
      <TouchableOpacity
        style={[
          styles.disabledIcon,
          styles.bellIcon,
          customStyles.bellIcon,
          {
            padding: getResponsiveSize(6, 8, 12),
          },
        ]}
        disabled={true}
        testID="headerNotificationButtonDisabled">
        <Ionicons
          name="notifications-outline"
          size={getResponsiveSize(28, 32, 40)}
          color={colors?.text || '#cccccc'}
        />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#2F2F2F',
    textAlign: isTablet ? 'center' : 'left',
  },
  bellIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledIcon: {
    opacity: 0.6,
  },
});

export default UniversalHeader;
