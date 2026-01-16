import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import OTPInputView from '@twotalltotems/react-native-otp-input';

import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import {AuthNav, StackNav} from '../../navigation/NavigationKey';
import images from '../../assets/images';

import String from '../../i18n/String';
import {clearWallet, setSecrets} from '../../redux/action/walletAction';
import InfoModal from '../../components/modal/InfoModal';
import {incAttempts, isLocked, resetAttempts} from '../../utils/PinAttempts';
import {setAddresses} from '../../redux/slices/addressSlice';
import {clearAuth, setAuthenticated} from '../../redux/slices/authSlice';
import {SHA256} from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CButton from '../../components/common/CButton';
import {commonColor} from '../../themes/colors';
import {ensureBundle, writeBundleAtomic} from '../../utils/ensureBundle';
import {migrateIfNeeded} from '../../utils/migrateLegacy';
import wira from 'wira-sdk';
import {guardianApi} from '../../data/guardians';
import {
  BACKEND,
  BACKEND_BLOCKCHAIN,
  BACKEND_IDENTITY,
  BACKEND_RESULT,
  GATEWAY_BASE,
  BUNDLER,
  BUNDLER_MAIN,
  PROVIDER_NAME,
} from '@env';

const sharedSession = new wira.SharedSession(
  BACKEND_IDENTITY,
  PROVIDER_NAME
);

const EXTERNAL_ENDPOINTS = Object.fromEntries(
  Object.entries({
    BACKEND,
    BACKEND_BLOCKCHAIN,
    BACKEND_IDENTITY,
    BACKEND_RESULT,
    GATEWAY_BASE,
    BUNDLER,
    BUNDLER_MAIN,
  }).filter(([, value]) => typeof value === 'string' && value.trim().length),
);

const buildNetworkDebug = error => {
  if (!error) {
    return {};
  }

  const apiDebug = error?.apiDebug || {};
  const constructedUrl = (() => {
    if (apiDebug.url) return apiDebug.url;
    if (apiDebug.requestUrl) return apiDebug.requestUrl;
    if (apiDebug.failingUrl) return apiDebug.failingUrl;
    const cfg = error?.config;
    if (cfg?.url) {
      if (cfg.baseURL) {
        const combined = `${cfg.baseURL}${cfg.url}`;
        return combined || cfg.url || cfg.baseURL;
      }
      return cfg.url;
    }
    if (cfg?.baseURL) {
      return cfg.baseURL;
    }
    return null;
  })();

  return {
    errorMessage: error?.message,
    errorName: error?.name,
    failingUrl: constructedUrl,
    method: apiDebug.method ?? error?.config?.method ?? null,
    status: apiDebug.status ?? error?.response?.status ?? null,
    statusText: apiDebug.statusText ?? error?.response?.statusText ?? null,
    requestData:
      apiDebug.requestData ??
      (typeof error?.config?.data === 'string'
        ? error?.config?.data
        : error?.config?.data ?? null),
    responseData:
      apiDebug.responseData ??
      (typeof error?.response?.data === 'string'
        ? error?.response?.data
        : error?.response?.data ?? null),
    stack: error?.stack,
  };
};

const logNetworkIssue = (label, error, extra = {}) => {
  if (!__DEV__) {
    return;
  }

  const network = buildNetworkDebug(error);
  const failingUrl =
    network.failingUrl || extra.endpoint || extra.failingUrl || '(URL no disponible)';

  console.warn('[LoginUser] Error de red detectado', {
    label,
    failingUrl,
    externalEndpoints: EXTERNAL_ENDPOINTS,
    ...extra,
    network,
  });
};

export default function LoginUser({navigation, route}) {
  const { sharedSessionId, sharedSessionSalt, isCIRecovery = false } = route.params ?? {};

  const colors = useSelector(state => state.theme.theme);
  const [otp, setOtp] = useState('');
  const [locked, setLocked] = useState(null);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(String.loading);
  const [modal, setModal] = useState({visible: false, msg: '', btn: String.understand, onClose: null});
  const hideModal = () => setModal({visible: false, msg: '', btn: String.understand, onClose: null});

  const otpRef = useRef(null);

  async function unlock(payload, _jwt, pin) {
    try {
      if (payload?.vc?.vc && !payload?.vc?.credentialSubject) {
        payload.vc = payload.vc.vc;
      }
    } catch {}
    dispatch(setSecrets(payload));

    dispatch(
      setAddresses({
        account: payload.account,
        guardian: payload.guardian ?? null,
      }),
    );
    dispatch(setAuthenticated(true));
    await resetAttempts();
    try {
      const safe = {
        cipherHex: payload.cipherHex,
        saltHex: payload.saltHex,
        account: payload.account,
        guardian: payload.guardian,
        salt: payload.salt,
      };
      if (payload.streamId) safe.streamId = payload.streamId;
      if (safe.cipherHex && safe.saltHex) {
        await writeBundleAtomic(JSON.stringify(safe));
      }
    } catch (e) {}

    const exists = await AsyncStorage.getItem('FINLINE_FLAGS');
    if (!exists && typeof pin === 'string' && pin.length) {
      await AsyncStorage.setItem(
        'FINLINE_FLAGS',
        JSON.stringify({
          PIN_HASH: SHA256(pin.trim()).toString(),
          BIO_ENABLED: await wira.Biometric.getBioFlag(),
          HAS_WALLET: true,
        }),
      );
    }

    navigation.reset({index: 0, routes: [{name: StackNav.TabNavigation}]});
  }

  const onPressLoginUser1 = () => {
    navigation.navigate(AuthNav.SelectRecuperation);
  };

  async function verifyPin(code) {
    try {
      if(sharedSessionId && sharedSessionSalt) {
        await sharedSession.signInWithSharedSession(
          sharedSessionId,
          sharedSessionSalt,
          code.trim()
        );
      }

      let signInOptions = null;
      if(isCIRecovery) {
        signInOptions = {
          registryUrl: BACKEND_IDENTITY,
          sharedSessionSchema: PROVIDER_NAME,
        };
      }

      const hasUserData = await wira.Storage.checkUserData();
      if (hasUserData) {
        const userData = await wira.signIn(code.trim(), isCIRecovery, signInOptions);

        try {
          await guardianApi.deviceToken({
            token: await wira.DeviceId.getDeviceId(),
            platform: Platform.OS.toUpperCase(),
            userDid: userData.did,
          });
        } catch (apiError) {
          logNetworkIssue('guardianApi.deviceToken', apiError, {
            stage: 'verifyPin',
            context: 'deviceToken',
          });
        }
        return {ok: true, payload: userData, jwt: null};
      }

      setLoadingMessage(String.migratingOnLogin);
      const mig = await migrateIfNeeded(code.trim());
      setLoadingMessage(String.loading);
      if (mig.ok) {
        const hasUserData = await wira.Storage.checkUserData();
        if(!hasUserData) {
          return {ok: false, type: 'unexpected'};
        }
        const userData = await wira.signIn(code.trim(), isCIRecovery, signInOptions);
        return {ok: true, payload: userData, jwt: null};
      }

      const reason = mig.reason || 'unknown';
      if (reason === 'bad_pin') {
        return {ok: false, type: 'bad_pin'};
      }

      
      if (reason === 'no_local_secrets') {
        logNetworkIssue('migrateIfNeeded:no_local', null, {
          stage: 'verifyPin',
          reason,
        });
        return {ok: false, type: 'no_local_secrets'};
      }

      logNetworkIssue('migrateIfNeeded_failed', mig.error ?? null, {
        stage: 'verifyPin',
        reason,
      });

      return {
        ok: false,
        type: 'migrate_failed',
        reason,
        error: mig.error ?? null,
      };
    } catch (err) {
      logNetworkIssue('verifyPin', err, {
        stage: 'verifyPin',
        attemptCode: code,
      });
      if (err?.message.includes('Invalid PIN')) {
        return {ok: false, type: 'bad_pin'};
      }
      return {ok: false, type: 'unexpected', error: err};
    }
  }

  const onCodeFilled = async code => {
    if (code.length !== 4) return;

    if (await isLocked()) {
      navigation.replace(AuthNav.AccountLock);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      verifyPin(code.trim())
      .then(async (res) => {
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
                ? 'Has agotado tus 5 intentos.\n¿Olvidaste tu PIN?, Recupera tu cuenta.'
                : `PIN incorrecto.\nTe quedan ${5 - n} intentos.`,
            onClose: n >= 5
              ? () => navigation.replace(AuthNav.SelectRecuperation, {disableCI: true})
              : undefined
          });
          if (n >= 5) {
            dispatch(clearWallet());
            dispatch(clearAuth());
          }
          return;
        }

        if (res.type === 'migrate_failed') {
          logNetworkIssue('migrate_failed', res.error ?? null, {
            reason: res.reason,
          });
          setModal({
            visible: true,
            msg:
              'No pudimos migrar tu credencial desde el servidor antiguo.\n' +
              'Intenta de nuevo cuando tengas conexión o vuelve a registrarte.',
            onClose: hideModal,
          });
          return;
        }

        if (res.type === 'no_local_secrets') {
          logNetworkIssue('no_local_secrets', null, {
            message: 'No se encontraron datos locales de billetera.',
          });
          setModal({
            visible: true,
            msg: String.notRegistered,
            btn: String.ok,
            onClose: () => {
              hideModal();
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: StackNav.AuthNavigation,
                    params: {screen: AuthNav.RegisterUser1},
                  },
                ],
              });
            },
          });
          return;
        }

        logNetworkIssue('unexpected_verify_result', res.error ?? null, {
          resultType: res.type,
        });
        setModal({
          visible: true,
          msg: 'Ocurrió un error inesperado al verificar tu credencial. Intenta de nuevo en unos minutos.',
          onClose: hideModal,
        });
      })
        .catch(err => {
          logNetworkIssue('verifyPin:catch', err, {stage: 'onCodeFilled'});
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 10)
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
      setLoading(true);
      try {
        const {error, userData} = await wira.checkBiometricAuth();

        if (!userData) {
          if (error === 'No credentials stored') {
            await ensureBundle();
            setLoading(false);
            setModal({
              visible: true,
              msg: String.noBiometricData,
              btn: String.understand,
            });
            return;
          } else {
            setLoading(false);
            return;
          }
        }

        await unlock(userData, null, '');
        setLoading(false);
      } catch (e) {
        console.error(e);
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
    <CSafeAreaViewAuth testID="loginUserSafeArea">
      <View
        testID="loginUserBackground"
        style={[localStyle.ovalBackground, {backgroundColor: colors.primary}]}
      />

      <CHeader color={colors.white} isHideBack testID="loginUserHeader" />
      <View style={localStyle.imageContainer} testID="loginUserLogoContainer">
        <Image source={images.logoImg} style={localStyle.imageStyle} />
      </View>
      <KeyBoardAvoidWrapper
        contentContainerStyle={styles.flexGrow1}
        testID="loginUserKeyboardContainer">
        <View
          style={localStyle.mainContainer}
          testID="loginUserContentContainer">
          <View>
            <CText
              type={'B24'}
              style={localStyle.headerTextStyle}
              align={'center'}
              testID="loginUserTitle">
              {String.login}
            </CText>

            <OTPInputView
              testID="textInput"
              pinCount={4}
              style={localStyle.otpInputViewStyle}
              code={otp}
              keyboardType="number-pad"
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
      <View style={localStyle.bottomButtons} testID="loginUserActions">
        <CButton
          onPress={onPressLoginUser1}
          title={String.connectBtnForgot}
          type={'B16'}
          containerStyle={localStyle.btnStyle}
          color={colors.white}
          bgColor={commonColor.gradient2}
          testID="loginUserForgotPasswordButton"
        />
      </View>
      {loading && (
        <View style={localStyle.loadingOverlay} testID="loginUserLoading">
          <ActivityIndicator size="large" color={colors.white} />
          <CText type="B16" color={colors.white} style={styles.mt10}>
            {loadingMessage}
          </CText>
        </View>
      )}
      <InfoModal
        testID="loginUserInfoModal"
        visible={modal.visible}
        title={String.walletAccess}
        message={modal.msg}
        buttonText={modal.btn}
        closeCornerBtn={true}
        onClose={modal.onClose || hideModal}
        onCloseCorner={hideModal}
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
