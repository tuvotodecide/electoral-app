import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {memo} from 'react';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';

// Custom Imports
import {moderateScale} from '../../common/constants';
import CText from './CText';
import {styles} from '../../themes';

const CHeader = props => {
  const {
    title,
    onPressBack,
    rightIcon,
    isHideBack,
    isLeftIcon,
    color,
    textColor,
  } = props;
  const navigation = useNavigation();
  const colors = useSelector(state => state.theme.theme);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[localStyles.container, !!isHideBack && styles.pr10]}>
      <View style={[styles.rowStart, styles.flex]}>
        {!isHideBack && navigation.canGoBack() && (
          <TouchableOpacity style={styles.pr10} onPress={onPressBack || goBack}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(24)}
              style={styles.ml5}
              color={color ? color : colors.textColor}
            />
          </TouchableOpacity>
        )}
        {!!isLeftIcon && isLeftIcon}

        <CText
          numberOfLines={1}
          style={[styles.flex, styles.mr20]}
          align={'center'}
          color={textColor ? textColor : colors.textColor}
          type={'B22'}>
          {title}
        </CText>
      </View>
      {!!rightIcon && rightIcon}
    </View>
  );
};

export default memo(CHeader);

const localStyles = StyleSheet.create({
  container: {
    ...styles.rowSpaceBetween,
    ...styles.ph20,
    ...styles.pv15,
    ...styles.center,
    ...styles.mt10,
  },
});
