// src/container/Auth/Recovery/RecoveryUserQrPin.js
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

import StepIndicator from '../../../components/authComponents/StepIndicator';
import CButton from '../../../components/common/CButton';
import CHeader from '../../../components/common/CHeader';
import CSafeAreaViewAuth from '../../../components/common/CSafeAreaViewAuth';
import CText from '../../../components/common/CText';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';

import { moderateScale } from '../../../common/constants';
import String from '../../../i18n/String';
import { AuthNav } from '../../../navigation/NavigationKey';
import { styles } from '../../../themes';
import typography from '../../../themes/typography';
import { getSecondaryTextColor } from '../../../utils/ThemeUtils';

export default function RecoveryUserQrPin({navigation, route}) {
  // ───── params de navegación
  const {payload} = route.params; // ← ahora recibes payload
  const colors = useSelector(state => state.theme.theme);

  // ───── estado & refs
  const [otp, setOtp] = useState('');

  // ───── handlers
  const onPressContinue = () => {
    navigation.navigate(AuthNav.RecoveryUserQrpin2, {
      originalPin: otp,
      payload, // ← lo pasas a la siguiente
    });
  };

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={8} />
      <CHeader />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={local.mainContainer}>
          <View>
            <CText type="B24" align="center" style={local.headerText}>
              {String.pinAccessTitle}
            </CText>
            <CText
              type="R14"
              align="center"
              color={getSecondaryTextColor(colors)}>
              {String.pinAccessDescription}
            </CText>

            <OTPTextInput
              inputCount={4}
              keyboardType="number-pad"
              autoFocus
              secureTextEntry
              handleTextChange={setOtp}
              containerStyle={local.otpBox}
              textInputStyle={[
                local.otpInput,
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

          <CButton
            title={String.btnContinue}
            testID="changePinNewContinueButton"
            disabled={otp.length !== 4}
            onPress={onPressContinue}
          />
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaViewAuth>
  );
}

/* ───────── estilos ───────── */
const local = StyleSheet.create({
  headerText: {...styles.mt10},
  mainContainer: {...styles.ph20, ...styles.justifyBetween, ...styles.flex},
  otpBox: {...styles.selfCenter, height: '20%', ...styles.mt30},
  otpInput: {
    width: moderateScale(50),
    height: moderateScale(55),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    textAlign: 'center',
    color: '#000', // bullets visibles en cualquier tema claro
    backgroundColor: '#FFF', // contraste; ajusta si usas tema oscuro
  },
});
