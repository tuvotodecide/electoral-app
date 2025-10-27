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
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

export default function FingerPrintScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const onPressEnableFaceId = () => {
  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('FingerPrintScreen', true);
    navigation.navigate(AuthNav.SelectCountry);
  };
  const onPressSkipNow = () => {
    navigation.navigate(AuthNav.SelectCountry);
  };
  return (
    <CSafeAreaViewAuth testID="fingerPrintScreenContainer">
      <CHeader testID="fingerPrintScreenHeader" />
      <StepIndicator step={2} testID="fingerPrintScreenStepIndicator" />
      <View style={localStyle.mainContainer} testID="fingerPrintScreenMainContainer">
        <View />
        <View testID="fingerPrintScreenContentContainer">
          <Image
            testID="fingerprintImage"
            source={colors.dark ? images.FingerImage : images.Finger_lightImage}
            style={localStyle.imageContainer}
          />

          <CText testID="enableFingerprintTitle" type={'B24'} align={'center'}>
            {String.enableFingerprint}
          </CText>
          <CText
            testID="enableFingerprintDescription"
            type={'R14'}
            align={'center'}
            color={colors.grayScale500}
            style={localStyle.descriptionText}>
            {String.enableFingerprintDescription}
          </CText>
        </View>
        <View testID="fingerPrintScreenButtonsContainer">
          <CButton
            testID="enableFingerprintButton"
            title={String.enableFingerprint}
            type={'B16'}
            containerStyle={localStyle.btnStyle}
            onPress={onPressEnableFaceId}
          />
          <CButton
            testID="skipFingerprintButton"
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
