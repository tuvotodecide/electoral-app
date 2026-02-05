import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// custom import
import { moderateScale } from '../../../common/constants';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import String from '../../../i18n/String';
import { StackNav } from '../../../navigation/NavigationKey';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';


export default function ChangePinNew({navigation, route}) {
  const {oldPin} = route.params;
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');

  const onOtpChange = text => setOtp(text);
  const otpRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      otpRef.current?.focusField(0);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <CSafeAreaView testID="changePinNewContainer" addTabPadding={false}>
      <CHeader testID="changePinNewHeader" />
      <KeyBoardAvoidWrapper testID="changePinNewKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View testID="changePinNewMainContainer" style={localStyle.mainContainer}>
          <View testID="changePinNewContentContainer">
            <CText
              testID="changePinNewTitle"
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.pinAccessTitle}
            </CText>
            <CText
              testID="changePinNewSubtitle"
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.pinAccessDescription}
            </CText>
            <OTPTextInput
              testID="textInput"
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus={true}
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
          <View testID="changePinNewButtonContainer">
            <CButton
              testID="changePinNewContinueButton"
              disabled={otp.length !== 4}
              title={String.btnContinue}
              type={'B16'}
              onPress={() =>
                navigation.replace(StackNav.ChangePinNewConfirm, {
                  oldPin,
                  newPin:otp,
                })
              }
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
