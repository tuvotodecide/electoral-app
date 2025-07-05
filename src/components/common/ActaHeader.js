import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import CText from './CText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {moderateScale} from '../../common/constants';

export const ActaHeader = ({onBack, title, colors}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <MaterialIcons
        name="keyboard-arrow-left"
        size={moderateScale(36)}
        color={colors.black || '#2F2F2F'}
      />
    </TouchableOpacity>
    <CText style={styles.headerTitle}>{title}</CText>
    <View style={styles.headerSpacer} />
    <TouchableOpacity style={styles.bellIcon}>
      <Ionicons
        name="notifications-outline"
        size={moderateScale(36)}
        color={colors.text || '#2F2F2F'}
      />
    </TouchableOpacity>
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

export default ActaHeader;
