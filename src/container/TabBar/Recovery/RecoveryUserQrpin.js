// src/container/Auth/Recovery/RecoveryUserQrPin.js
import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

import CSafeAreaView   from '../../../components/common/CSafeAreaView';
import CHeader         from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import CText           from '../../../components/common/CText';
import CButton         from '../../../components/common/CButton';
import StepIndicator   from '../../../components/authComponents/StepIndicator';

import {styles}        from '../../../themes';
import typography      from '../../../themes/typography';
import {moderateScale} from '../../../common/constants';
import {AuthNav}       from '../../../navigation/NavigationKey';
import {getSecondaryTextColor} from '../../../utils/ThemeUtils';
import String          from '../../../i18n/String';

export default function RecoveryUserQrPin({navigation, route}) {
  // ───── params de navegación
  const {payload, reqId} = route.params;         // ← ahora recibes payload
  const colors = useSelector(state => state.theme.theme);

  // ───── estado & refs
  const [otp, setOtp] = useState('');
  const otpRef = useRef(null);

  // ───── handlers
  const onPressContinue = () => {
    navigation.navigate(AuthNav.RecoveryUserQrpin2, {
      originalPin: otp,
      payload,                // ← lo pasas a la siguiente
      reqId,
    });
  };

  // ───── enfocar al montar
  useEffect(() => {
    const t = setTimeout(() => otpRef.current?.focusField(0), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <CSafeAreaView>
      <StepIndicator step={8}/>
      <CHeader/>
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

            <OTPInputView
              ref={otpRef}
              pinCount={4}
              keyboardType="number-pad"
              autoFocusOnLoad
              secureTextEntry
              code={otp}
              onCodeChanged={setOtp}
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
          </View>

          <CButton
            title={String.btnContinue}
            disabled={otp.length !== 4}
            onPress={onPressContinue}
          />
        </View>
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}

/* ───────── estilos ───────── */
const local = StyleSheet.create({
  headerText: { ...styles.mt10 },
  mainContainer:{ ...styles.ph20, ...styles.justifyBetween, ...styles.flex },
  otpBox:{ ...styles.selfCenter, height:'20%', ...styles.mt30 },
  otpInput:{
    width: moderateScale(50),
    height: moderateScale(50),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
    textAlign:'center',
    color:'#000',               // bullets visibles en cualquier tema claro
    backgroundColor:'#FFF',     // contraste; ajusta si usas tema oscuro
  },
});
