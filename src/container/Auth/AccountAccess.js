import React, {useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, StyleSheet, View} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import {useDispatch, useSelector} from 'react-redux';

import {moderateScale} from '../../common/constants';
import CAlert from '../../components/common/CAlert';
import CButton from '../../components/common/CButton';
import CHeader from '../../components/common/CHeader';
import CInput from '../../components/common/CInput';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import InfoModal from '../../components/modal/InfoModal';
import {captureError} from '../../config/sentry';
import {matchesDemoCredentials} from '../../features/demo/demoConfig';
import {activateDemoSession} from '../../features/demo/demoLifecycle';
import String from '../../i18n/String';
import {AuthNav} from '../../navigation/NavigationKey';
import {styles} from '../../themes';
import typography from '../../themes/typography';

/**
 * Acceso con cédula + PIN.
 *
 * Solo se alcanza cuando el dispositivo NO tiene billetera local (Connect.js
 * mantiene su comprobación `wira.Storage.checkUserData()`). Para las
 * credenciales de demostración activa el modo demostración; para cualquier otra
 * cédula explica que no hay datos en el dispositivo y lleva a recuperación,
 * que es lo único que puede hacer un usuario real en esta situación.
 *
 * No se conecta con `incAttempts`/`isLocked`: esas claves pertenecen al PIN de
 * la billetera real.
 */
export default function AccountAccess({navigation, route}) {
  const {resumeDemo = false} = route?.params ?? {};

  const colors = useSelector(state => state.theme.theme);
  const dispatch = useDispatch();

  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFoundVisible, setNotFoundVisible] = useState(false);
  const otpRef = useRef(null);

  const isFormValid = dni.trim().length > 0 && pin.trim().length === 4;

  const onPressRecover = () => {
    setNotFoundVisible(false);
    navigation.navigate(AuthNav.SelectRecuperation);
  };

  const onPressSubmit = async () => {
    if (!isFormValid || loading) {
      return;
    }

    if (!matchesDemoCredentials(dni, pin)) {
      otpRef.current?.clear();
      setPin('');
      setNotFoundVisible(true);
      return;
    }

    setLoading(true);
    try {
      await activateDemoSession({dispatch, navigation});
    } catch (error) {
      captureError(error, {
        flow: 'AccountAccess',
        step: 'activateDemoSession',
        critical: true,
      });
      setLoading(false);
    }
  };

  return (
    <CSafeAreaViewAuth testID="accountAccessContainer">
      <CHeader testID="accountAccessHeader" />
      <KeyBoardAvoidWrapper
        contentContainerStyle={styles.flexGrow1}
        testID="accountAccessKeyboardWrapper">
        <View style={localStyle.mainContainer}>
          <View>
            <CText
              type={'B24'}
              align={'center'}
              style={styles.mb10}
              testID="accountAccessTitle">
              {String.accountAccessTitle}
            </CText>

            <CText
              type={'R16'}
              align={'center'}
              style={styles.mb20}
              testID="accountAccessSubtitle">
              {String.accountAccessSubtitle}
            </CText>

            {resumeDemo ? (
              <CAlert
                testID="accountAccessResumeAlert"
                status="info"
                message={String.accountAccessResume}
              />
            ) : null}

            <CInput
              _value={dni}
              testID="accountAccessDniInput"
              label={String.accountAccessDniLabel}
              typeText="B14"
              labelTextColor={colors.textColor}
              toGetTextFieldValue={setDni}
              placeHolder={String.accountAccessDniPlaceholder}
              keyBoardType="number-pad"
              _editable={!loading}
              input
            />

            <CText
              type={'B14'}
              color={colors.textColor}
              style={styles.mt10}
              testID="accountAccessPinLabel">
              {String.accountAccessPinLabel}
            </CText>

            <OTPTextInput
              testID="accountAccessPinInput"
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              keyboardType="number-pad"
              handleTextChange={setPin}
              secureTextEntry={true}
              editable={!loading}
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocus={false}
              ref={otpRef}
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
        </View>
      </KeyBoardAvoidWrapper>

      <View style={localStyle.bottomButtons} testID="accountAccessActions">
        <CButton
          testID="accountAccessSubmitButton"
          disabled={!isFormValid || loading}
          title={String.accountAccessSubmit}
          type={'B16'}
          onPress={onPressSubmit}
          containerStyle={localStyle.btnStyle}
        />
      </View>

      {loading && (
        <View style={localStyle.loadingOverlay} testID="accountAccessLoading">
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}

      <InfoModal
        testID="accountAccessNotFoundModal"
        visible={notFoundVisible}
        title={String.accountAccessNotFoundTitle}
        message={String.accountAccessNotFound}
        buttonText={String.accountAccessRecover}
        closeCornerBtn={true}
        onClose={onPressRecover}
        onCloseCorner={() => setNotFoundVisible(false)}
      />
    </CSafeAreaViewAuth>
  );
}

const {width, height} = Dimensions.get('window');

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
  otpInputViewStyle: {
    ...styles.selfCenter,
    ...styles.mt10,
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
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
  bottomButtons: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(16),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
