import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import CText from './CText';
import {moderateScale} from '../../common/constants';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';

export default function CEtiqueta({
  title,
  text,
  icon = null,
  containerStyle,
  textStyle,
}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <View style={[localStyle.wrapper, containerStyle]}>
      <View style={localStyle.iconWrapper}>{icon}</View>
      <View>
        <CText
          type={'B14'}
          color={getSecondaryTextColor(colors)}
          style={[localStyle.text, textStyle]}>
          {title}
        </CText>
        <CText
          type={'B18'}
          color={getSecondaryTextColor(colors)}
          style={[localStyle.text, textStyle]}>
          {text}
        </CText>
      </View>
    </View>
  );
}

const localStyle = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: moderateScale(8),
  },
  iconWrapper: {
    marginRight: moderateScale(12),
    alignSelf: 'flex-start',
  },
  text: {
    flex: 1,
  },
});
