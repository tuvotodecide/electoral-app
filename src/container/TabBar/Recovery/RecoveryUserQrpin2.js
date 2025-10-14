// src/container/Auth/Recovery/RecoveryUserQrPin2.js
import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

import CSafeAreaViewAuth from '../../../components/common/CSafeAreaViewAuth';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../components/common/CText';
import CButton from '../../../components/common/CButton';
import CAlert from '../../../components/common/CAlert';
import StepIndicator from '../../../components/authComponents/StepIndicator';

import {styles} from '../../../themes';
import {moderateScale} from '../../../common/constants';
import typography from '../../../themes/typography';
import {AuthNav} from '../../../navigation/NavigationKey';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import String from '../../../i18n/String';

import {setSecrets} from '../../../redux/action/walletAction';
import {setAddresses} from '../../../redux/slices/addressSlice';
import {setAuthenticated} from '../../../redux/slices/authSlice';
import {startSession} from '../../../utils/Session';
import {useNavigationLogger} from '../../../hooks/useNavigationLogger';
import wira from 'wira-sdk';
import {PROVIDER_NAME, BACKEND_IDENTITY} from '@env';
import LoadingModal from '../../../components/modal/LoadingModal';

const recoveryService = new wira.RecoveryService();

export default function RecoveryUserQrPin2({navigation, route}) {
  const {originalPin, payload} = route.params;
  const colors = useSelector(state => state.theme.theme);

  const [otp, setOtp] = useState('');
  const [showError, setShowError] = useState(false);
  const dispatch = useDispatch();
  const otpRef = useRef(null);
  const {logAction, logNavigation} = useNavigationLogger(
    'RecoveryUserQrpin2',
    true,
  );
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
  });

  useEffect(() => {
    const t = setTimeout(() => otpRef.current?.focusField(0), 350);
    logAction('RecoveryPinScreenLoaded');
    return () => clearTimeout(t);
  }, []);

  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 50));

  const finish = async () => {
    setModal({
      visible: true,
      message: String.recoveringData,
      isLoading: true,
    });

    await yieldUI();
    try {
      logAction('RecoveryPinFinishAttempt');
      if(payload.legacyData) {
        navigation.navigate(
          AuthNav.RegisterUser10,
          {
            ocrData: payload.legacyData,
            dni: payload.data.dni,
            originalPin,
            useBiometry: false,
            isMigration: true,
          }
        )
        return;
      }

      await recoveryService.saveQrData(payload.data, otp.trim(), PROVIDER_NAME, BACKEND_IDENTITY);

      dispatch(setSecrets(payload));
      dispatch(
        setAddresses({
          account: payload.account,
          guardian: payload.guardian ?? null,
        }),
      );
      dispatch(setAuthenticated(true));
      await startSession(null);

      setModal({
        visible: false,
        message: '',
        isLoading: false,
      })

      logNavigation(AuthNav.LoginUser);
      navigation.reset({index: 0, routes: [{name: AuthNav.LoginUser}]});
      logAction('RecoveryPinFinishSuccess');
    } catch (err) {
      logAction('RecoveryPinFinishError', {message: err?.message});
      setModal({
        visible: true,
        message: 'Error: ' + err.message,
        isLoading: false,
      })
    }
  };

  const handleConfirmPin = () => {
    const matchesOriginal = otp === originalPin;
    logAction('RecoveryPinConfirmAttempt', {
      matchesOriginal,
      length: otp.length,
    });
    if (matchesOriginal) finish();
    else {
      setShowError(true);
      setOtp('');
      logAction('RecoveryPinMismatch');
    }
  };

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

            <OTPInputView
              ref={otpRef}
              pinCount={4}
              code={otp}
              onCodeChanged={text => {
                setOtp(text);
                if (showError) setShowError(false);
              }}
              secureTextEntry
              keyboardType="number-pad"
              autoFocusOnLoad={false}
              style={local.otpBox}
              codeInputFieldStyle={[
                local.otpInput,
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
        onClose={() =>
          navigation.navigate(AuthNav.RecoveryQr)
        }
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
