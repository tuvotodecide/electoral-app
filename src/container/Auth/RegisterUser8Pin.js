import {InteractionManager, StyleSheet, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// Custom imports
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';
import StepIndicator from '../../components/authComponents/StepIndicator';
import {getSecondaryTextColor} from '../../utils/ThemeUtils';
import String from '../../i18n/String';

export default function RegisterUser8({navigation, route}) {
  const {vc, offerUrl, useBiometry, dni} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');

  const onOtpChange = text => setOtp(text);
  const otpRef = useRef(null);
  const onPressContinue = () => {
    navigation.navigate(AuthNav.RegisterUser9, {
      originalPin: otp,
      vc,
      offerUrl,
      useBiometry,
      dni,
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      otpRef.current?.focusField(0);
    }, 350);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={8} />
      <CHeader />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View>
            <CText
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.pinAccessTitle}
            </CText>
            <CText
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.pinAccessDescription}
            </CText>
            <OTPInputView
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocusOnLoad={false}
              ref={otpRef}
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
          <View>
            <CButton
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
