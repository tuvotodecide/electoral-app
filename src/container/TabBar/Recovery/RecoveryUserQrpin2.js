// src/container/Auth/Recovery/RecoveryUserQrPin2.js
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

import StepIndicator from '../../../components/authComponents/StepIndicator';
import CAlert from '../../../components/common/CAlert';
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


import { BACKEND_IDENTITY, PROVIDER_NAME } from '@env';
import wira from 'wira-sdk';
import LoadingModal from '../../../components/modal/LoadingModal';
import { resetAttempts } from '../../../utils/PinAttempts';

const recoveryService = new wira.RecoveryService();

export default function RecoveryUserQrPin2({navigation, route}) {
  const {originalPin, payload} = route.params;
  const colors = useSelector(state => state.theme.theme);

  const [otp, setOtp] = useState('');
  const [showError, setShowError] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
  });

  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 50));

  const finish = async () => {
    setModal({
      visible: true,
      message: String.recoveringData,
      isLoading: true,
    });

    await yieldUI();
    try {
      if(payload.legacyData) {
        navigation.navigate(
          AuthNav.RegisterUser10,
          {
            ocrData: payload.legacyData,
            dni: payload.data.dni,
            originalPin,
            useBiometry: await wira.Biometric.getBioFlag(),
            isMigration: true,
          }
        )
        return;
      }

      await recoveryService.saveBackupData(payload.data, otp.trim(), PROVIDER_NAME, BACKEND_IDENTITY);
      await resetAttempts();

      setModal({
        visible: false,
        message: '',
        isLoading: false,
      })

      navigation.reset({index: 0, routes: [{name: AuthNav.LoginUser}]});
    } catch (err) {
      setModal({
        visible: true,
        message: 'Error: ' + err.message,
        isLoading: false,
      })
    }
  };

  const handleConfirmPin = () => {
    const matchesOriginal = otp === originalPin;
    if (matchesOriginal) finish();
    else {
      setShowError(true);
      setOtp('');
    }
  };

  const handleRetry = () => {
    navigation.reset({
      index: 1,
      routes: [
        {name: AuthNav.Connect},
        {name: AuthNav.RecoveryQr},
      ],
    })
  }

  return (
    <CSafeAreaViewAuth>
      <StepIndicator step={9} />
      <CHeader />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={local.mainContainer}>
          <View>
            <CText type="B24" align="center" style={local.headerText}>
              {String.confirmPinTitle}
            </CText>
            <CText
              type="R14"
              align="center"
              color={getSecondaryTextColor(colors)}>
              {String.confirmPinDescription}
            </CText>

            <OTPTextInput
              inputCount={4}
              handleTextChange={text => {
                setOtp(text);
                if (showError) setShowError(false);
              }}
              secureTextEntry
              keyboardType="number-pad"
              autoFocus
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

            {showError && (
              <View style={styles.mt10}>
                <CAlert status="error" message={String.incorrectPinError} />
              </View>
            )}
          </View>

          <CButton
            title={String.confirmPinButton}
            testID="changePinNewContinueButton"
            disabled={otp.length !== 4}
            onPress={handleConfirmPin}
          />
        </View>
      </KeyBoardAvoidWrapper>
      <LoadingModal
        {...modal}
        buttonText={String.retryRecovery}
        onClose={handleRetry}
      />
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
    height: moderateScale(50),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
    textAlign: 'center',
    color: '#000', // se verá siempre
    backgroundColor: '#FFF',
  },
});
