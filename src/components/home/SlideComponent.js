import {StyleSheet, View} from 'react-native';
import React from 'react';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

// custom import
import CText from '../common/CText';
import {styles} from '../../themes';
import {useSelector} from 'react-redux';
import {deviceWidth, moderateScale} from '../../common/constants';
import String from '../../i18n/String';

export default function SlideComponent(props) {
  const {endPoint, maxValue, onValuesChange} = props;
  const colors = useSelector(state => state.theme.theme);

  const customMarker = event => {
    return (
      <View style={localStyle.markerContainer}>
        <View
          style={[
            localStyle.sliderLength,
            {
              borderColor: colors.primary,
              backgroundColor: colors.inputBackground,
            },
          ]}
        />
      </View>
    );
  };
  return (
    <View style={{...styles.mb10, ...styles.mt20}}>
      <MultiSlider
        sliderLength={deviceWidth - moderateScale(40)}
        values={[endPoint]}
        min={0}
        max={maxValue}
        step={1}
        markerOffsetY={20}
        valuePrefix={100}
        onValuesChange={onValuesChange}
        selectedStyle={{backgroundColor: colors.primary}}
        trackStyle={[
          localStyle.sliderContainer,

          {
            backgroundColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}
        customMarker={customMarker}
      />
      <View style={localStyle.lowerTextStyle}>
        <CText type={'B16'}>{'0, 5 ' + String.gr}</CText>
        <CText type={'B16'}>{'1000 ' + String.gr}</CText>
      </View>
    </View>
  );
}

const localStyle = StyleSheet.create({
  sliderContainer: {
    height: moderateScale(2),
  },

  sliderLength: {
    height: moderateScale(24),
    width: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(3),
  },
  markerContainer: {
    height: moderateScale(55),
  },
  lowerTextStyle: {
    ...styles.rowSpaceBetween,
  },
});
