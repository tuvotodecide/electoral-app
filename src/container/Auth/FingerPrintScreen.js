import {Image, StyleSheet, View} from 'react-native';
import React from 'react';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CText from '../../components/common/CText';
import images from '../../assets/images';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CButton from '../../components/common/CButton';
import String from '../../i18n/String';
import {AuthNav} from '../../navigation/NavigationKey';

export default function FingerPrintScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const onPressEnableFaceId = () => {
    navigation.navigate(AuthNav.SelectCountry);
  };
  const onPressSkipNow = () => {
    navigation.navigate(AuthNav.SelectCountry);
  };
  return (
    <CSafeAreaViewAuth>
      <CHeader />
      <StepIndicator step={2} />
      <View style={localStyle.mainContainer}>
        <View />
        <View>
          <Image
            source={colors.dark ? images.FingerImage : images.Finger_lightImage}
            style={localStyle.imageContainer}
          />

          <CText type={'B24'} align={'center'}>
            {String.enableFingerprint}
          </CText>
          <CText
            type={'R14'}
            align={'center'}
            color={colors.grayScale500}
            style={localStyle.descriptionText}>
            {String.enableFingerprintDescription}
          </CText>
        </View>
        <View>
          <CButton
            title={String.enableFingerprint}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            onPress={onPressEnableFaceId}
          />
          <CButton
            title={String.skipForNow}
            type={'B16'}
            containerStyle={localStyle.skipBtn}
            bgColor={colors.dark ? colors.inputBackground : colors.primary50}
            color={colors.primary}
            onPress={onPressSkipNow}
          />
        </View>
      </View>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.flex,
    ...styles.justifyBetween,
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(120),
    width: moderateScale(120),
  },
  descriptionText: {
    width: '80%',
    ...styles.selfCenter,
  },

  skipBtn: {
    ...styles.mb20,
    ...styles.mt0,
  },
});
