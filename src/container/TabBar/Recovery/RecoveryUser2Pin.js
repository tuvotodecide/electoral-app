import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// Custom imports
import { moderateScale } from '../../../common/constants';
import StepIndicator from '../../../components/authComponents/StepIndicator';
import CAlert from '../../../components/common/CAlert';
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


export default function RecoveryUser2Pin({navigation, route}) {
  const {originalPin, recData} = route.params;

  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [showError, setShowError] = useState(false);

  const handleConfirmPin = () => {
    if (otp === originalPin) {
      navigation.navigate(AuthNav.RecoveryFinalize, {
        originalPin: otp,
        recData,
      });
    } else {
      setShowError(true);
      setOtp('');
    }
  };

  return (
    <CSafeAreaView>
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

            <OTPTextInput
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              handleTextChange={text => {
                setOtp(text);
                if (showError) {
                  setShowError(false);
                }
              }}
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

            {showError && (
              <View style={styles.mt10}>
                <CAlert status="error" message={String.incorrectPinError} />
              </View>
            )}
          </View>

          <View>
            <CButton
              disabled={otp.length !== 4}
              testID="changePinNewContinueButton"
              title={String.confirmPinButton}
              type={'B16'}
              onPress={handleConfirmPin}
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
});
