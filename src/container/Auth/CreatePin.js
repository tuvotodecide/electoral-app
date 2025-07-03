import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// custom import
import CSafeAreaView from '../../components/common/CSafeAreaView';
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

export default function CreatePin({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');

  const onOtpChange = text => setOtp(text);

  const onPressContinue = () => {
    navigation.navigate(AuthNav.UploadDocument);
  };
  return (
    <CSafeAreaView>
      <CHeader />
      <StepIndicator step={5} />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View>
            <CText type={'B24'} style={localStyle.headerTextStyle}>
              {String.createPIN}
            </CText>
            <CText type={'R14'} color={colors.grayScale500}>
              {String.createPINDescription}
            </CText>
            <OTPInputView
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
          <View>
            <CButton
              title={String.createPin}
              type={'B16'}
              onPress={onPressContinue}
            />
            <CButton
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
    </CSafeAreaView>
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
