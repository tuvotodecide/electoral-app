import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import CText from './CText';
import {moderateScale} from '../../common/constants';

export default function CIconText({
  text,
  icon = null,
  textType = 'R16',
  color = null,
  containerStyle,
  textStyle,
  testID,
}) {
  const colors = useSelector(state => state.theme.theme);
  const finalColor = color || colors.white;

  const isTextString = typeof text === 'string' || typeof text === 'number';

  return (
    <View testID={testID} style={[localStyle.wrapper, containerStyle]}>
      <View style={localStyle.iconWrapper}>{icon}</View>
      <View style={[localStyle.text, textStyle]}>
        {isTextString ? (
          <CText type={textType} color={finalColor}>
            {text}
          </CText>
        ) : (
          text
        )}
      </View>
    </View>
  );
}

const localStyle = StyleSheet.create({
  wrapper: {
    width: '70%',
    flexDirection: 'row',
    alignSelf: 'center',
    marginVertical: moderateScale(8),
  },
  iconWrapper: {
    marginRight: moderateScale(12),
    alignSelf: 'center',
  },
  text: {
    flex: 1,
  },
});
