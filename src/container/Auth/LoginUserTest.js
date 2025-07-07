import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

// Custom imports
import CSafeAreaView from '../../components/common/CSafeAreaView';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import {StackNav} from '../../navigation/NavigationKey';
import images from '../../assets/images';
import String from '../../i18n/String';
import {setSecrets} from '../../redux/action/walletAction';
import {startSession} from '../../utils/Session';
import InfoModal from '../../components/modal/InfoModal';
import {resetAttempts} from '../../utils/PinAttempts';
import {setAddresses} from '../../redux/slices/addressSlice';
import {setAuthenticated} from '../../redux/slices/authSlice';
import {
  TEST_CONFIG,
  testLog,
  isValidTestPin,
  getMockUser,
  getMockJWT,
} from '../../config/testConfig';

export default function LoginUserTest({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({visible: false, msg: ''});
  const [attempts, setAttempts] = useState(0);

  const otpRef = useRef(null);

  async function unlockTest(payload, jwt) {
    testLog('Desbloqueando con datos simulados...');
    testLog('Account:', payload.account);
    testLog('Guardian:', payload.guardian);

    dispatch(setSecrets(payload));
    dispatch(
      setAddresses({
        account: payload.account,
        guardian: payload.guardian,
      }),
    );
    dispatch(setAuthenticated(true));

    await resetAttempts();
    await startSession(jwt);

    testLog('Login exitoso, navegando a TabNavigation...');
    navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
  }

  async function verifyPinTest(code) {
    testLog('Verificando PIN:', code);

    // Simular delay de verificación
    await new Promise(resolve =>
      setTimeout(resolve, TEST_CONFIG.SIMULATE_LOADING_DELAY),
    );

    // Verificar si el PIN es válido
    if (isValidTestPin(code)) {
      testLog('PIN correcto, cargando datos de usuario...');
      const mockUser = getMockUser();
      const mockJWT = getMockJWT();
      await unlockTest({...mockUser.payloadQr, vc: mockUser.vc}, mockJWT);
      return true;
    } else {
      testLog('PIN incorrecto');
      return false;
    }
  }

  const onCodeFilled = async code => {
    if (code.length !== 4) return;

    testLog('PIN ingresado:', code);
    setLoading(true);

    try {
      const ok = await verifyPinTest(code.trim());

      if (!ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setOtp('');
        setModal({
          visible: true,
          msg: `PIN incorrecto.\nPINs válidos para test: ${TEST_CONFIG.VALID_TEST_PINS.join(
            ', ',
          )}\nIntentos: ${newAttempts}/${TEST_CONFIG.MAX_PIN_ATTEMPTS}`,
        });

        if (newAttempts >= TEST_CONFIG.MAX_PIN_ATTEMPTS) {
          setModal({
            visible: true,
            msg: 'Has agotado tus intentos.\nReinicia la app para intentar de nuevo.',
          });
        }
      }
    } catch (error) {
      testLog('Error en verificación:', error);
      setOtp('');
      setModal({
        visible: true,
        msg: 'Error en la verificación del PIN. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-focus en el primer campo de PIN
    const timer = setTimeout(() => otpRef.current?.focusField(0), 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CSafeAreaView>
      <View
        style={[localStyle.ovalBackground, {backgroundColor: colors.primary}]}
      />

      <CHeader color={colors.white} />
      <View style={localStyle.imageContainer}>
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>

      {/* Indicador de modo test */}
      {TEST_CONFIG.SHOW_TEST_INDICATORS && (
        <View style={localStyle.testIndicator}>
          <CText type={'R12'} style={localStyle.testText}>
            Modo Test - PINs válidos: {TEST_CONFIG.VALID_TEST_PINS.join(', ')}
          </CText>
        </View>
      )}

      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View>
            <CText
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.login}
            </CText>

            <CText
              type={'R14'}
              style={localStyle.subtitleStyle}
              align={'center'}
              color={colors.grayScale500}>
              Ingresa tu PIN de 4 dígitos
            </CText>

            <OTPInputView
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={setOtp}
              onCodeFilled={onCodeFilled}
              secureTextEntry={true}
              editable={!loading}
              keyboardAppearance={'dark'}
              placeholderTextColor={colors.textColor}
              autoFocusOnLoad={false}
              ref={otpRef}
              codeInputFieldStyle={[
                localStyle.underlineStyleBase,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.textColor,
                  borderColor: colors.grayScale500,
                },
              ]}
              codeInputHighlightStyle={{borderColor: colors.primary}}
            />
          </View>
        </View>
      </KeyBoardAvoidWrapper>

      {loading && (
        <View style={localStyle.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <CText type="B16" color={colors.white} style={styles.mt10}>
            Verificando PIN...
          </CText>
        </View>
      )}

      <InfoModal
        visible={modal.visible}
        title="Login Test"
        message={modal.msg}
        buttonText="Entendido"
        onClose={() => setModal({visible: false, msg: ''})}
      />
    </CSafeAreaView>
  );
}

const {width, height} = Dimensions.get('window');

const localStyle = StyleSheet.create({
  headerTextStyle: {
    ...styles.mt10,
    ...styles.mb10,
  },
  subtitleStyle: {
    ...styles.mb20,
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
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  imageStyle: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  testIndicator: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  testText: {
    color: '#F57C00',
    textAlign: 'center',
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
  ovalBackground: {
    position: 'absolute',
    top: -height * 0.45,
    left: -width * 0.25,
    width: width * 1.5,
    height: height * 0.6,
    borderRadius: height,
    zIndex: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
});
