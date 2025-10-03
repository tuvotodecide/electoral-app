// src/container/Auth/Recovery/RecoveryUserQrPin2.js
import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View, Alert, InteractionManager} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import {SHA256} from 'crypto-js';

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

import {createBundleFromPrivKey, saveSecrets} from '../../../utils/Cifrate';
import {setSecrets} from '../../../redux/action/walletAction';
import {setAddresses} from '../../../redux/slices/addressSlice';
import {setAuthenticated} from '../../../redux/slices/authSlice';
import {startSession} from '../../../utils/Session';
import { resetAttempts } from '../../../utils/PinAttempts';

export default function RecoveryUserQrPin2({navigation, route}) {
  const {originalPin, payload} = route.params;
  const colors = useSelector(state => state.theme.theme);

  const [otp, setOtp] = useState('');
  const [showError, setShowError] = useState(false);
  const dispatch = useDispatch();
  const otpRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => otpRef.current?.focusField(0), 350);
    return () => clearTimeout(t);
  }, []);

  const finish = async () => {
    try {
      const bundle = await createBundleFromPrivKey(otp, payload.privKey);
      const pinHash = SHA256(otp.trim()).toString();

      await saveSecrets(otp, payload, false, bundle, pinHash);

      dispatch(setSecrets(payload));
      dispatch(
        setAddresses({
          account: payload.account,
          guardian: payload.guardian ?? null,
        }),
      );
      dispatch(setAuthenticated(true));
      await startSession(null);
      await resetAttempts();

      navigation.reset({index: 0, routes: [{name: AuthNav.LoginUser}]});
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleConfirmPin = () => {
    if (otp === originalPin) finish();
    else {
      setShowError(true);
      setOtp('');
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
            disabled={otp.length !== 4}
            onPress={handleConfirmPin}
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
