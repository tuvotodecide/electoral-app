import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from './CText';
import {moderateScale} from '../../common/constants';

const UniversalHeader = ({
  colors,
  onBack,
  title = 'Título',
  showNotification = true,
  onNotificationPress,
  customStyles = {},
}) => (
  <View style={[styles.header, customStyles.header]}>
    <TouchableOpacity
      onPress={onBack}
      style={[styles.backButton, customStyles.backButton]}>
      <MaterialIcons
        name="keyboard-arrow-left"
        size={moderateScale(36)}
        color={colors?.black || '#2F2F2F'}
      />
    </TouchableOpacity>
    <CText style={[styles.headerTitle, customStyles.headerTitle]}>
      {title}
    </CText>
    <View style={styles.headerSpacer} />
    {/* {showNotification && (
      <TouchableOpacity
        style={[styles.bellIcon, customStyles.bellIcon]}
        onPress={onNotificationPress}>
        <Ionicons
          name="notifications-outline"
          size={moderateScale(34)}
          color={colors?.text || '#2F2F2F'}
        />
      </TouchableOpacity>
    )} */}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  backButton: {
    padding: moderateScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: '#2F2F2F',
    marginLeft: moderateScale(8),
  },
  headerSpacer: {
    flex: 1,
  },
  bellIcon: {
    padding: moderateScale(8),
  },
});

export default UniversalHeader;
