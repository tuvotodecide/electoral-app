import {Alert, StyleSheet, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import typography from '../../../themes/typography';
import CButton from '../../../components/common/CButton';
import {AuthNav, StackNav} from '../../../navigation/NavigationKey';
import StepIndicator from '../../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import String from '../../../i18n/String';
import {checkPin} from '../../../utils/Cifrate';
import InfoModal from '../../../components/modal/InfoModal';

export default function ChangePinVerify({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [modal, setModal] = useState({visible: false, msg: ''});
  const onOtpChange = text => setOtp(text);
  const otpRef = useRef(null);

  const verify = async code => {
    if (code.length !== 4) return;
    if (!(await checkPin(code))) {
      setOtp('');
      return setModal({
        visible: true,
        msg: 'PIN actual incorrecto',
      });
    }
    navigation.replace(StackNav.ChangePinNew, {oldPin: code});
  };
  useEffect(() => {
    const timeout = setTimeout(() => {
      otpRef.current?.focusField(0);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <CSafeAreaView testID="changePinVerifyContainer">
      <CHeader testID="changePinVerifyHeader" />
      <KeyBoardAvoidWrapper testID="changePinVerifyKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="changePinVerifyMainContainer" style={localStyle.mainContainer}>
          <View testID="changePinVerifyContentContainer">
            <CText
              testID="changePinVerifyTitle"
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.pinChangeAccessTitle}
            </CText>
            <CText
              testID="changePinVerifySubtitle"
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.pinChange}
            </CText>
            <OTPInputView
              testID="changePinVerifyOtpInput"
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={onOtpChange}
              onCodeFilled={verify}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocusOnLoad={true}
              codeInputFieldStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              codeInputHighlightStyle={{borderColor: colors.primary}}
            />
          </View>
          <View testID="changePinVerifySpacerContainer"></View>
        </View>
      </KeyBoardAvoidWrapper>
      <InfoModal
        testID="changePinVerifyErrorModal"
        visible={modal.visible}
        title="Error"
        message={modal.msg}
        onClose={() => setModal({visible: false, msg: ''})}
      />
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
