import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CText from '../../components/common/CText';
import String from '../../i18n/String';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {useNavigationLogger} from '../../hooks/useNavigationLogger';

export default function CreatePin({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  
  // Hook para logging de navegación
  const { logAction, logNavigation } = useNavigationLogger('CreatePin', true);

  const onOtpChange = text => {
    setOtp(text);
    logAction('OTP Changed', `Length: ${text ? text.length : 0}`);
  };

  const onPressContinue = () => {
    try {
      logNavigation('UploadDocument');
      navigation.navigate(AuthNav.UploadDocument);
    } catch (error) {
      console.warn('[CreatePin] Navigation failed', error);
    }
  };
  return (
    <CSafeAreaViewAuth testID="createPinContainer">
      <CHeader testID="createPinHeader" />
      <StepIndicator testID="createPinStepIndicator" step={5} />
      <KeyBoardAvoidWrapper testID="createPinKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View testID="createPinContentContainer">
            <CText testID="createPinTitle" type={'B24'} style={localStyle.headerTextStyle}>
              {String.createPIN}
            </CText>
            <CText testID="createPinDescription" type={'R14'} color={colors.grayScale500}>
              {String.createPINDescription}
            </CText>
            <OTPInputView
              testID="textInput"
              pinCount={5}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocusOnLoad={false}
              codeInputFieldStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.inputBackground,
                },
              ]}
              codeInputHighlightStyle={{borderColor: colors.primary}}
            />
          </View>
          <View testID="createPinButtonsContainer">
            <CButton
              testID="createPinButton"
              title={String.createPin}
              type={'B16'}
              onPress={onPressContinue}
            />
            <CButton
              testID="skipForNowButton"
              title={String.skipForNow}
              type={'B16'}
              containerStyle={localStyle.resendButton}
              bgColor={colors.dark ? colors.inputBackground : colors.primary50}
              color={colors.primary}
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
