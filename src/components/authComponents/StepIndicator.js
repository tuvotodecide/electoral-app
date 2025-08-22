import {SafeAreaView, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import React from 'react';
import {deviceWidth, moderateScale} from '../../common/constants';

export default function StepIndicator({step, style, totalSteps = 10}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <SafeAreaView style={[localStyle.viewStyle, style]}>
      <View style={localStyle.wrapper}>
        {Array.from({length: totalSteps}).map((_, index) => (
          <View
            key={index}
            style={[
              localStyle.step,
              {
                backgroundColor:
                  index < step ? colors.primary : colors.stepBackgroundColor,
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  viewStyle: {
    width: deviceWidth,
  },
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(2),
    marginVertical: moderateScale(2),
  },
  step: {
    flex: 1,
    height: moderateScale(5),
    marginHorizontal: moderateScale(0),
    borderRadius: 2,
  },
});
