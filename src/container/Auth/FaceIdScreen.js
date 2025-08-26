import {StyleSheet, View, Image} from 'react-native';
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

export default function FaceIdScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const onPressEnableFaceId = () => {
    navigation.navigate(AuthNav.FingerPrintScreen);
  };
  const onPressSkipNow = () => {
    navigation.navigate(AuthNav.FingerPrintScreen);
  };

  return (
    <CSafeAreaViewAuth testID="faceIdScreenContainer">
      <CHeader testID="faceIdScreenHeader" />
      <StepIndicator testID="faceIdScreenStepIndicator" step={1} />
      <View style={localStyle.mainContainer}>
        <View />
        <View testID="faceIdScreenContentContainer">
          <Image
            testID="faceIdImage"
            source={colors.dark ? images.FaceIdImage : images.FaceId_lightImage}
            style={localStyle.imageContainer}
          />

          <CText testID="enableFaceIdTitle" type={'B24'} align={'center'}>
            {String.enableFaceID}
          </CText>
          <CText
            testID="enableFaceIdDescription"
            type={'R14'}
            align={'center'}
            color={colors.grayScale500}
            style={localStyle.descriptionText}>
            {String.enableFaceIdDescription}
          </CText>
        </View>
        <View testID="faceIdScreenButtonsContainer">
          <CButton
            testID="enableFaceIdButton"
            title={String.enableFaceID}
            type={'B16'}
            onPress={onPressEnableFaceId}
          />
          <CButton
            testID="skipFaceIdButton"
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
