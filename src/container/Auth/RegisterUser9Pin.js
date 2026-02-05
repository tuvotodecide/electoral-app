import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

// Custom imports
import { moderateScale } from '../../common/constants';
import StepIndicator from '../../components/authComponents/StepIndicator';
import CAlert from '../../components/common/CAlert';
import CButton from '../../components/common/CButton';
import CHeader from '../../components/common/CHeader';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import String from '../../i18n/String';
import { AuthNav } from '../../navigation/NavigationKey';
import { styles } from '../../themes';
import typography from '../../themes/typography';
import { setTmpPin } from '../../utils/TempRegister';
import { getSecondaryTextColor } from '../../utils/ThemeUtils';

import CBigAlert from '../../components/common/CBigAlert';

export default function RegisterUser9({navigation, route}) {
  const {originalPin, ocrData, useBiometry, dni} = route.params;

  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [showError, setShowError] = useState(false);

  const handleConfirmPin = async () => {
    const matchesOriginal = otp === originalPin;
    if (matchesOriginal) {
      await setTmpPin(otp);
      const params = {
        originalPin: otp,
        ocrData,

        useBiometry,
        dni,
      };
      navigation.navigate(AuthNav.RegisterUser10, params);
    } else {
      setShowError(true);
      setOtp('');
    }
  };

  return (
    <CSafeAreaViewAuth testID="registerUser9PinContainer">
      <StepIndicator testID="registerUser9PinStepIndicator" step={9} />
      <CHeader testID="registerUser9PinHeader" />
      <KeyBoardAvoidWrapper testID="registerUser9PinKeyboardWrapper" contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View testID="registerUser9PinContentContainer">
            <CText
              testID="registerUser9PinTitle"
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.confirmPinTitle}
            </CText>
            <CText
              testID="registerUser9PinDescription"
              type={'R14'}
              color={getSecondaryTextColor(colors)}
              align={'center'}>
              {String.confirmPinDescription}
            </CText>

            <OTPTextInput
              testID="registerUser9PinInput"
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
            />

            {showError && (
              <View testID="registerUser9PinErrorContainer" style={styles.mt10}>
                <CAlert testID="registerUser9PinErrorAlert" status="error" message={String.incorrectPinError} />
              </View>
            )}

            <CBigAlert
              icon='information-outline'
              title='Recomendación'
              subttle='Al concluir, NO OLVIDE registrar al menos un guardián para poder recuperar su cuenta en caso de olvidar el pin.'
            />
          </View>

          <View testID="registerUser9PinButtonContainer">
            <CButton
              testID="registerUser9PinConfirmButton"
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
