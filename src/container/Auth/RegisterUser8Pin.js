import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// Custom imports
import { moderateScale } from '../../common/constants';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CButton from '../../components/common/CButton';
import CHeader from '../../components/common/CHeader';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import String from '../../i18n/String';
import { AuthNav } from '../../navigation/NavigationKey';
import { styles } from '../../themes';
import typography from '../../themes/typography';
import { getSecondaryTextColor } from '../../utils/ThemeUtils';


export default function RegisterUser8({navigation, route}) {
  const routeParams = route?.params ?? {};
  const {ocrData, useBiometry, dni} = routeParams;
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const onOtpChange = text => {
    setOtp(text);
  };
  const otpRef = useRef(null);
  const onPressContinue = () => {
    const params = {
      originalPin: otp,
      ocrData,
      useBiometry,
      dni,
    };
    navigation.navigate(AuthNav.RegisterUser9, params);
  };

  return (
    <CSafeAreaViewAuth testID="registerUser8PinContainer">
      <StepIndicator testID="registerUser8PinStepIndicator" step={8} />
      <CHeader testID="registerUser8PinHeader" />
      <KeyBoardAvoidWrapper testID="registerUser8PinKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View testID="registerUser8PinContentContainer">
            <CText
              testID="registerUser8PinTitle"
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.pinAccessTitle}
            </CText>
            <CText
              testID="registerUser8PinDescription"
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.pinAccessDescription}
            </CText>
            <OTPTextInput
              testID="registerUser8PinInput"
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus
              ref={otpRef}
              textInputStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              tintColor={colors.primary}
            />
          </View>
          <View testID="registerUser8PinButtonContainer">
            <CButton
              testID="registerUser8PinContinueButton"
              disabled={otp.length !== 4}
              title={String.btnContinue}
              type={'B16'}
              onPress={onPressContinue}
            />
          </View>
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  headerTextStyle: {
    ...styles.mt10,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
  otpInputViewStyle: {
    ...styles.selfCenter,
    height: '20%',
    ...styles.mt30,
  },
  underlineStyleBase: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
  },

  resendButton: {
    ...styles.mb20,
    ...styles.mt0,
  },
  diffPhoneNumberText: {
    ...styles.mt15,
  },
});
