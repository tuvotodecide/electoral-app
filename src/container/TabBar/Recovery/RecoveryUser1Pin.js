import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// custom import

import { moderateScale } from '../../../common/constants';
import StepIndicator from '../../../components/authComponents/StepIndicator';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import String from '../../../i18n/String';
import { AuthNav } from '../../../navigation/NavigationKey';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';


export default function RecoveryUser1Pin({navigation, route}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');

  
  const onOtpChange = text => setOtp(text);

  const onPressContinue = () => {
    navigation.navigate(AuthNav.RecoveryUser2Pin, {
      ...route.params,
      originalPin: otp,
    });
  };

  return (
    <CSafeAreaView addTabPadding={false}>
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
            <OTPTextInput
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={onOtpChange}
              secureTextEntry={true}
              editable
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus
              textInputStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              tintColor={colors.primary}
              offTintColor={colors.grayScale500}
            />
          </View>
          <View>
            <CButton
              disabled={otp.length !== 4}
              title={String.btnContinue}
              testID="changePinNewContinueButton"
              type={'B16'}
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
    height: moderateScale(55),
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
