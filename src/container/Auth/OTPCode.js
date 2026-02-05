import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// custom import
import { moderateScale } from '../../common/constants';
import CButton from '../../components/common/CButton';
import CHeader from '../../components/common/CHeader';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import String from '../../i18n/String';
import { AuthNav } from '../../navigation/NavigationKey';
import { styles } from '../../themes';
import typography from '../../themes/typography';


export default function OTPCode({route, navigation}) {
  const title = route?.params?.title;
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const onOtpChange = text => setOtp(text);

  const onPressResendCode = () => {
    alert('Otp Resend');
  };

  const onPressContinue = () => {
    if (!!title) {
      navigation.navigate(AuthNav.CreateNewPassword);
    } else {
      navigation.navigate(AuthNav.FaceIdScreen);
    }
  };
  return (
    <CSafeAreaViewAuth testID="otpCodeContainer">
      <CHeader testID="otpCodeHeader" />
      <KeyBoardAvoidWrapper testID="otpCodeKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View testID="otpCodeContentContainer">
            <CText testID="authCodeTitle" type={'B24'} style={localStyle.headerTextStyle}>
              {String.authenticationCode}
            </CText>
            <CText testID="otpDescription" type={'R14'} color={colors.grayScale500}>
              {String.otpDescription}
            </CText>
            <OTPTextInput
              testID="otpInput"
              inputCount={5}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus={false}
              textInputStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.inputBackground,
                },
              ]}
              tintColor={colors.primary}
            />
            <TouchableOpacity testID="differentPhoneNumberButton">
              <CText testID="differentPhoneNumberText" type={'B14'} style={localStyle.diffPhoneNumberText}>
                {String.useDifferentPhoneNumber}
              </CText>
            </TouchableOpacity>
          </View>
        </View>
        <CButton
          testID="continueButton"
          title={String.continue}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          onPress={onPressContinue}
        />
        <CButton
          testID="resendCodeButton"
          title={String.resendCode}
          type={'B16'}
          containerStyle={localStyle.resendButton}
          bgColor={colors.dark ? colors.inputBackground : colors.primary50}
          color={colors.primary}
          onPress={onPressResendCode}
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  headerTextStyle: {
    ...styles.mt20,
  },
  mainContainer: {
    ...styles.ph20,
    ...styles.flex,
    ...styles.justifyBetween,
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
  btnStyle: {
    ...styles.selfCenter,
    width: '90%',
  },
  resendButton: {
    ...styles.selfCenter,
    width: '90%',
    ...styles.mb20,
    ...styles.mt0,
  },
  diffPhoneNumberText: {
    ...styles.mt15,
    ...styles.ml5,
  },
});
