import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';

// custom import
import CText from '../common/CText';
import Icons from 'react-native-vector-icons/EvilIcons';
import {moderateScale} from '../../common/constants';
import {styles} from '../../themes';
import typography from '../../themes/typography';

export default function CommonTextInput({
  title,
  image,
  labelTitle,
  onPressSelect,
  borderColor,
  placeholderText,
  placeholderTextColor,
}) {
  const colors = useSelector(state => state.theme.theme);
  const [searchText, setSearchText] = useState('');

  const onChangeTextSearch = item => {
    setSearchText(item);
  };
  return (
    <TouchableOpacity
      onPress={onPressSelect}
      style={[
        localStyle.inputBox,
        {
          backgroundColor: colors.inputBackground,
          borderColor,
        },
      ]}>
      <View>
        <CText
          type={'S12'}
          style={localStyle.fromText}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
          {title}
        </CText>
        <TextInput
          onChangeText={onChangeTextSearch}
          placeholder={placeholderText ? placeholderText : '$'}
          value={searchText}
          maxLength={10}
          autoCapitalize={'none'}
          keyboardType={'numeric'}
          placeholderTextColor={
            placeholderTextColor
              ? placeholderTextColor
              : colors.dark
              ? colors.grayScale500
              : colors.grayScale400
          }
          style={[
            localStyle.innerInput,
            {
              color: colors.textColor,
            },
          ]}
        />
      </View>
      <TouchableOpacity
        style={[
          localStyle.rightLabel,
          {
            backgroundColor: colors.dark
              ? colors.grayScale700
              : colors.backgroundColor,
          },
        ]}>
        <Image source={image} style={localStyle.imageStyle} />
        <CText type={'S12'}>{labelTitle}</CText>
        <Icons
          name={'chevron-right'}
          size={moderateScale(20)}
          style={styles.ml10}
          color={colors.grayScale500}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const localStyle = StyleSheet.create({
  inputBox: {
    width: '100%',
    ...styles.mt20,
    borderWidth: moderateScale(1),
    height: moderateScale(64),
    borderRadius: moderateScale(12),
    ...styles.ph10,
    ...styles.selfCenter,
    ...styles.rowSpaceBetween,
  },
  innerInput: {
    ...typography.fontSizes.f18,
    ...typography.fontWeights.Bold,
    ...styles.ml5,
  },
  rightLabel: {
    height: moderateScale(40),
    width: moderateScale(92),
    ...styles.ph10,
    ...styles.flexRow,
    ...styles.center,
    borderRadius: moderateScale(8),
  },
  imageStyle: {
    ...styles.mh5,
    height: moderateScale(20),
    width: moderateScale(20),
  },
  fromText: {
    ...styles.mt5,
    ...styles.ml5,
  },
});
