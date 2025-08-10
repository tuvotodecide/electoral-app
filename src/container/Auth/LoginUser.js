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
import * as Keychain from 'react-native-keychain';

import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {JWT_KEY, moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import {AuthNav, StackNav} from '../../navigation/NavigationKey';
import images from '../../assets/images';
import RNFS from 'react-native-fs';

import String from '../../i18n/String';
import {checkPin, getSecrets} from '../../utils/Cifrate';
import {clearWallet, setSecrets} from '../../redux/action/walletAction';
import {clearSession, startSession} from '../../utils/Session';
import InfoModal from '../../components/modal/InfoModal';
import {incAttempts, isLocked, resetAttempts} from '../../utils/PinAttempts';
import {buildSiweAuthSig} from '../../utils/siweRn';
import {BACKEND} from '@env';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import {setAddresses} from '../../redux/slices/addressSlice';
import {
  clearAuth,
  setAuthenticated,
  setPendingNav,
} from '../../redux/slices/authSlice';
import store from '../../redux/store';
import {navigate} from '../../navigation/RootNavigation';
import {SHA256} from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {biometricLogin, biometryAvailability} from '../../utils/Biometry';
import {getBioFlag} from '../../utils/BioFlag';
import CButton from '../../components/common/CButton';
import {commonColor} from '../../themes/colors';
import {registerDeviceToken} from '../../utils/registerDeviceToken';
import {ensureBundle, writeBundleAtomic} from '../../utils/ensureBundle';

function classifyKycError(error, resp) {
  const code = error?.code || '';
  const msg = resp?.data?.error || error?.message || '';
  const msgLower = (msg || '').toString().toLowerCase();

  if (code === 'ERR_NETWORK' || msgLower.includes('network error')) {
    return {kind: 'server_down', detail: msg};
  }

  if (
    msgLower.includes('timeout error while loading cid') ||
    msgLower.includes('context deadline exceeded') ||
    msgLower.includes('timeout error while loading') ||
    msgLower.includes('loading cid') ||
    msgLower.includes('ipfs') ||
    (resp && resp.data && resp.data.ok === false && msgLower.includes('cid'))
  ) {
    return {kind: 'vc_missing', detail: msg};
  }

  if (resp && resp.data && resp.data.ok === false) {
    return {kind: 'server_error', detail: msg};
  }

  return {kind: 'unknown', detail: msg};
}

export default function LoginUser({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [locked, setLocked] = useState(null);
  const [skipBiometricsOnce, setSkipBiometricsOnce] = useState(false);
  const dispatch = useDispatch();
  const bioUnlocked = useRef(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({visible: false, msg: '', onClose: null});
  const hideModal = () => setModal({visible: false, msg: '', onClose: null});

  const otpRef = useRef(null);

  const toastError = msg => setModal({visible: true, msg});

  async function unlock(payload, jwt, pin) {
    dispatch(setSecrets(payload));

    dispatch(
      setAddresses({
        account: payload.account,
        guardian: payload.guardian ?? null,
      }),
    );
    dispatch(setAuthenticated(true));

    await resetAttempts();
    await startSession(jwt);
    await registerDeviceToken();
    messaging().onTokenRefresh(registerDeviceToken);

    try {
      await writeBundleAtomic(JSON.stringify({...payload, jwt}));
    } catch (e) {}

    const exists = await AsyncStorage.getItem('FINLINE_FLAGS');
    if (!exists && typeof pin === 'string' && pin.length) {
      await AsyncStorage.setItem(
        'FINLINE_FLAGS',
        JSON.stringify({
          PIN_HASH: SHA256(pin.trim()).toString(),
          BIO_ENABLED: await getBioFlag(),
          HAS_WALLET: true,
        }),
      );
    }
    const pending = store.getState().auth.pendingNav;
    if (!pending) {
      navigation.reset({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    }
  }

  const onPressLoginUser1 = () => {
    navigation.navigate(AuthNav.SelectRecuperation);
  };

  async function verifyPin(code) {
    await ensureBundle();
    try {
      const pinOk = await checkPin(code);

      if (!pinOk) return {ok: false, type: 'bad_pin'};
      const stored = await getSecrets();
      if (!stored) return {ok: false, type: 'no_local_secrets'};

      const {streamId, privKey} = stored.payloadQr;

      let load;
      try {
        load = await axios.post(
          `${BACKEND}kyc/load`,
          {streamId},
          {withCredentials: true},
        );
      } catch (err) {
        const classified = classifyKycError(err, null);

        return {ok: false, type: 'server', ...classified};
      }

      if (!load.data?.ok) {
        const classified = classifyKycError(null, load);

        const result = {ok: false, type: 'server', ...classified};

        return result;
      }

      const {dataHash} = load.data.data;

      let dec;
      try {
        const authSig = await buildSiweAuthSig(privKey, dataHash);
        dec = await axios.post(
          `${BACKEND}kyc/decrypt`,
          {streamId, authSig},
          {withCredentials: true},
        );
      } catch (e) {
        const classified = classifyKycError(e, null);

        return {ok: false, type: 'server', ...classified};
      }

      if (!dec.data?.ok) {
        const classified = classifyKycError(null, dec);

        return {ok: false, type: 'server', ...classified};
      }

      const {vc, jwt} = dec.data;
      return {ok: true, payload: {...stored.payloadQr, vc}, jwt};
    } catch (err) {
      const classified = classifyKycError(err, null);

      return {ok: false, type: 'server', ...classified};
    }
  }

  const onCodeFilled = async code => {
    if (code.length !== 4) return;

    if (await isLocked()) {
      setModal({
        visible: true,
        msg: 'Has agotado tus 5 intentos.\nEspera 15 minutos o recupera tu cuenta con tus guardianes.',
      });
      navigation.replace(AuthNav.AccountLock);
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPin(code.trim());

      if (res.ok) {
        await unlock(res.payload, res.jwt, code.trim());
        return;
      }
      setOtp('');
      if (res.type === 'bad_pin') {
        const n = await incAttempts();

        setModal({
          visible: true,
          msg:
            n >= 5
              ? 'Has agotado tus 5 intentos.\nRecupera tu cuenta con tus guardianes.'
              : `PIN incorrecto.\nTe quedan ${5 - n} intentos.`,
          onClose: hideModal,
        });
        if (n >= 5) {
          await clearSession();
          dispatch(clearWallet());
          dispatch(clearAuth());
        }
        return;
      }

      if (res.kind === 'vc_missing') {
        setModal({
          visible: true,
          msg:
            'No pudimos cargar tu credencial (VC).\n' +
            'Es probable que el servidor de credenciales se haya reiniciado o se haya perdido el stream.\n\n' +
            'Necesitas volver a registrarte para emitir una nueva credencial.',
          onClose: () => {
            hideModal();
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: StackNav.AuthNavigation,
                  params: {screen: AuthNav.RegisterUser2},
                },
              ],
            });
          },
        });
        return;
      }

      if (res.kind === 'server_down' || res.kind === 'server_error') {
        setModal({
          visible: true,
          msg:
            'No se pudo conectar al servidor.\n' +
            'Revisa tu conexión o intenta más tarde.\n\n' +
            '(Tu PIN no fue contado como intento fallido.)',
          onClose: hideModal,
        });
        return;
      }
      if (res.type === 'no_local_secrets') {
        setModal({
          visible: true,
          msg:
            'No se encontraron datos locales de tu billetera.\n' +
            'Debes volver a registrarte para emitir una nueva credencial.',
          onClose: () => {
            hideModal();
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: StackNav.AuthNavigation,
                  params: {screen: AuthNav.RegisterUser2},
                },
              ],
            });
          },
        });
        return;
      }

      setModal({
        visible: true,
        msg: 'Ocurrió un error inesperado al verificar tu credencial. Intenta de nuevo en unos minutos.',
        onClose: hideModal,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const blocked = await isLocked();
      setLocked(blocked);
      if (blocked) {
        navigation.replace(AuthNav.AccountLock);
      }
    })();
  }, []);

  useEffect(() => {
    if (locked === false) {
      const t = setTimeout(() => otpRef.current?.focusField(0), 350);
      return () => clearTimeout(t);
    }
  }, [locked]);

  useEffect(() => {
    (async () => {
      const enabled = await getBioFlag();
      if (!enabled) {
        return;
      }

      const {available, biometryType} = await biometryAvailability();

      if (!available || !biometryType) return;

      const ok = await biometricLogin(
        biometryType === 'FaceID'
          ? 'Escanea tu rostro'
          : 'Escanea tu huella dactilar',
      );

      if (!ok) {
        setSkipBiometricsOnce(true);
        return;
      }
      setLoading(true);

      bioUnlocked.current = true;
      try {
        const creds = await Keychain.getGenericPassword({
          service: 'walletBundle',
        });
        if (!creds) {
          await ensureBundle();
          setLoading(false);
          return;
        }

        const {stored} = JSON.parse(creds.password);

        let load;
        try {
          load = await axios.post(
            `${BACKEND}kyc/load`,
            {streamId: stored.streamId},
            {withCredentials: true},
          );
        } catch (e) {
          const klass = classifyKycError(e, null);
          if (klass.kind === 'server_down') {
            setModal({
              visible: true,
              msg: 'No se pudo conectar al servidor. Intenta más tarde.',
            });
          }
          setLoading(false);
          return;
        }

        if (!load.data?.ok) {
          const klass = classifyKycError(null, load);
          if (klass.kind === 'vc_missing') {
            setModal({
              visible: true,
              msg:
                'No pudimos cargar tu credencial (VC).\n' +
                'Parece que el servidor se reinició. Debes volver a registrarte.',
            });
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: StackNav.AuthNavigation,
                  params: {screen: AuthNav.RegisterUser2},
                },
              ],
            });
            setLoading(false);
            return;
          }
          setLoading(false);
          return;
        }

        const {dataHash} = load.data.data;
        const authSig = await buildSiweAuthSig(stored.privKey, dataHash);

        let dec;
        try {
          dec = await axios.post(
            `${BACKEND}kyc/decrypt`,
            {streamId: stored.streamId, authSig},
            {withCredentials: true},
          );
        } catch (e) {
          const klass = classifyKycError(e, null);
          if (klass.kind === 'server_down') {
            setModal({
              visible: true,
              msg: 'No se pudo conectar al servidor. Intenta más tarde.',
              onClose: hideModal,
            });
          }
          setLoading(false);
          return;
        }

        if (!dec.data?.ok) {
          const klass = classifyKycError(null, dec);
          if (klass.kind === 'vc_missing') {
            setModal({
              visible: true,
              msg:
                'No pudimos descifrar tu credencial.\n' +
                'Parece que el servidor se reinició. Debes volver a registrarte.',
              onClose: () => {
                hideModal();
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: StackNav.AuthNavigation,
                      params: {screen: AuthNav.RegisterUser2},
                    },
                  ],
                });
              },
            });

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: StackNav.AuthNavigation,
                  params: {screen: AuthNav.RegisterUser2},
                },
              ],
            });
            setLoading(false);
            return;
          }
          setLoading(false);
          return;
        }

        const {vc: newVc, jwt: newJwt} = dec.data;
        await unlock({...stored, vc: newVc}, newJwt);
      } catch {
        setLoading(false);
      }
    })();
  }, []);

  if (locked === null) {
    return (
      <View style={localStyle.loadingOverlay}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return (
    <CSafeAreaViewAuth>
      <View
        style={[localStyle.ovalBackground, {backgroundColor: colors.primary}]}
      />

      <CHeader color={colors.white} isHideBack />
      <View style={localStyle.imageContainer}>
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>
      <KeyBoardAvoidWrapper contentContainerStyle={styles.flexGrow1}>
        <View style={localStyle.mainContainer}>
          <View>
            <CText
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}>
              {String.login}
            </CText>

            <OTPInputView
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              onCodeChanged={setOtp}
              onCodeFilled={onCodeFilled}
              secureTextEntry={true}
              editable={!locked}
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
      <View style={localStyle.bottomButtons}>
        <CButton
          onPress={onPressLoginUser1}
          title={String.connectBtnForgot}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          color={colors.white}
          bgColor={commonColor.gradient2}
        />
      </View>
      {loading && (
        <View style={localStyle.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <CText type="B16" color={colors.white} style={styles.mt10}>
            {String.loading}
          </CText>
        </View>
      )}
      <InfoModal
        visible={modal.visible}
        title={String.walletAccess}
        message={modal.msg}
        buttonText={String.understand}
        onClose={modal.onClose || hideModal}
      />
    </CSafeAreaViewAuth>
  );
}

const {width, height} = Dimensions.get('window');

const localStyle = StyleSheet.create({
  bottomButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(16),
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTextStyle: {
    ...styles.mt10,
    ...styles.mb10,
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.26,
    shadowRadius: 3.5,
  },
});
