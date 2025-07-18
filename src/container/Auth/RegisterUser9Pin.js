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
import CAlert from '../../components/common/CAlert';
import String from '../../i18n/String';

export default function RegisterUser9({navigation, route}) {
  const {originalPin, vc, offerUrl, useBiometry, dni} = route.params;

  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [showError, setShowError] = useState(false);

  const otpRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      otpRef.current?.focusField(0);
    }, 350);
    return () => clearTimeout(timeout);
  }, []);

  const handleConfirmPin = () => {
    if (otp === originalPin) {
      navigation.navigate(AuthNav.RegisterUser10, {
        originalPin: otp,
        vc,
        offerUrl,
        useBiometry,
        dni,
      });
    } else {
      setShowError(true);
      setOtp('');
    }
  };

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={9} />
      <CHeader />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View>
            <CText
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.confirmPinTitle}
            </CText>
            <CText
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.confirmPinDescription}
            </CText>

            <OTPInputView
              ref={otpRef}
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={text => {
                setOtp(text);
                if (showError) {
                  setShowError(false);
                }
              }}
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
                  borderColor: colors.grayScale500,
                },
              ]}
              codeInputHighlightStyle={{borderColor: colors.primary}}
            />

            {showError && (
              <View style={styles.mt10}>
                <CAlert status="error" message={String.incorrectPinError} />
              </View>
            )}
          </View>

          <View>
            <CButton
              disabled={otp.length !== 4}
              title={String.confirmPinButton}
              type={'B16'}
              onPress={handleConfirmPin}
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
});
