import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {moderateScale} from '../../common/constants';

export const PhotoContainer = ({photoUri}) => (
  <View style={styles.photoContainer}>
    <Image source={{uri: photoUri}} style={styles.photo} resizeMode="contain" />
    <View style={[styles.cornerBorder, styles.topLeftCorner]} />
    <View style={[styles.cornerBorder, styles.topRightCorner]} />
    <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
    <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
  </View>
);

const styles = StyleSheet.create({
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: moderateScale(200),
    borderRadius: moderateScale(4),
  },
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderColor: '#2F2F2F',
    borderWidth: 2,
  },
  topLeftCorner: {
    top: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});

export default PhotoContainer;
