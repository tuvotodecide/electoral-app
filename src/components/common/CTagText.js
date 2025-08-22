import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import CText from './CText';
import {moderateScale} from '../../common/constants';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import {TouchableOpacity} from 'react-native-gesture-handler';

export default function CTagText({
  iconLeft = null,
  title = '',
  subtitle = '',
  iconRight = null,
  containerStyle,
  onPressRightIcon = null,
}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

      <View style={styles.textContainer}>
        <CText type="B14" color={getSecondaryTextColor(colors)}>
          {title}
        </CText>
        <CText type="R16" color={colors.textColor}>
          {subtitle}
        </CText>
      </View>
      {iconRight && (
        <TouchableOpacity
          onPress={onPressRightIcon}
          style={styles.iconRight}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          {iconRight}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  iconLeft: {
    marginRight: moderateScale(12),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  iconRight: {
    marginLeft: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
