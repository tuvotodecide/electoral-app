import { BACKEND, BACKEND_BLOCKCHAIN, BACKEND_IDENTITY, BACKEND_RESULT, PRIVADO_RPC_URL } from '@env';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useDispatch, useSelector } from 'react-redux';

import images from '../../assets/images';
import { moderateScale } from '../../common/constants';
import CHeader from '../../components/common/CHeader';
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CText from '../../components/common/CText';
import KeyBoardAvoidWrapper from '../../components/common/KeyBoardAvoidWrapper';
import { AuthNav, StackNav } from '../../navigation/NavigationKey';
import { styles } from '../../themes';
import typography from '../../themes/typography';


import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHA256 } from 'crypto-js';
import { UserDataBackupError, VaultError } from '@privado-id/expo-sdk';
import { getPrivadoVault } from '../../services/privado/privadoSession';
import { syncPendingRegistryBackup } from '../../services/privado/registryBackupSync';
import {
  IdentityCredentialMissingError,
  IdentityNotFoundError,
  loadIdentityPayload,
} from '../../services/privado/identityPayload';
import {
  RegistryBackupMissingError,
  RegistryBackupUnsupportedError,
  restoreRegistryBackup,
} from '../../services/privado/registryRestore';
import { getBiometryStatus } from '../../services/biometrics';
import CButton from '../../components/common/CButton';
import InfoModal from '../../components/modal/InfoModal';
import String from '../../i18n/String';
import { clearWallet, setSecrets } from '../../redux/action/walletAction';
import { setAddresses } from '../../redux/slices/addressSlice';
import { clearAuth, setAuthenticated } from '../../redux/slices/authSlice';
import { commonColor } from '../../themes/colors';
import { incAttempts, isLocked, resetAttempts } from '../../utils/PinAttempts';
import { captureError } from '../../config/sentry';
import {startLocalSession} from '../../utils/Session';
import {consumePendingNotificationNavigation} from '../../notifications';
import {isDemoPin} from '../../features/demo/demoConfig';
import {isDemoActive} from '../../features/demo/demoSession';
import {activateDemoSession} from '../../features/demo/demoLifecycle';
import {describeNav, notifNavLog} from '../../utils/notifNavDebug';
import {markHomeEntryFromLogin} from '../../utils/homeEntry';

let loginUserInstanceCounter = 0;

/** Cancelar o fallar la biometría no es un error: queda el PIN. */
const BIOMETRIC_SOFT_FAILURES = new Set([
  'BIOMETRICS_CANCELLED',
  'BIOMETRICS_FAILED',
  'BIOMETRICS_UNAVAILABLE',
  'BIOMETRICS_NOT_ENABLED',
]);

const BIOMETRICS_INVALIDATED_MESSAGE =
  'La biometría de tu dispositivo cambió, así que se desactivó el ingreso con huella o rostro. Ingresa tu PIN para continuar.';

const RECOVERY_MISSING_MESSAGE =
  'No encontramos el respaldo de tu cuenta en este dispositivo. Vuelve a recuperarla con tu carnet.';

const RECOVERY_FAILED_MESSAGE =
  'No pudimos restaurar el respaldo de tu cuenta. Vuelve a intentar la recuperación más tarde.';

/**
 * Tras la recuperación con carnet: restaura el respaldo descargado con el PIN.
 * `restored`: el vault quedó creado y abierto. `no_backup`: no hay respaldo
 * (p. ej. ya se restauró en un intento anterior).
 */
async function restoreFromRegistry(pin) {
  try {
    await restoreRegistryBackup(pin);
    return { type: 'restored' };
  } catch (error) {
    if (error instanceof UserDataBackupError && error.code === 'INVALID_BACKUP_PASSWORD') {
      return { ok: false, type: 'bad_pin' };
    }
    if (error instanceof RegistryBackupMissingError) {
      return { type: 'no_backup' };
    }
    if (
      error instanceof RegistryBackupUnsupportedError ||
      (error instanceof UserDataBackupError && error.code === 'INVALID_BACKUP')
    ) {
      return { ok: false, type: 'recovery_failed', error };
    }
    throw error;
  }
}

/**
 * Datos de la cuenta con el vault ya abierto. Si faltan la identidad o la
 * credencial, vuelve a bloquearlo: no hay sesión que iniciar.
 */
async function loadPayloadOrLock(vault) {
  try {
    return { ok: true, payload: await loadIdentityPayload(), jwt: null };
  } catch (error) {
    vault.lock();
    if (error instanceof IdentityNotFoundError) {
      return { ok: false, type: 'no_local_secrets' };
    }
    if (error instanceof IdentityCredentialMissingError) {
      return { ok: false, type: 'credential_missing', error };
    }
    throw error;
  }
}

const EXTERNAL_ENDPOINTS = Object.fromEntries(
  Object.entries({
    BACKEND,
    BACKEND_BLOCKCHAIN,
    BACKEND_IDENTITY,
    BACKEND_RESULT,
    PRIVADO_RPC_URL,
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

export default function LoginUser({ navigation, route }) {
  const { isCIRecovery = false } = route.params ?? {};

  const colors = useSelector(state => state.theme.theme);
  const [locked, setLocked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, msg: '', btn: String.understand, onClose: null });

  const hideModal = () => setModal({ visible: false, msg: '', btn: String.understand, onClose: null });
  const dispatch = useDispatch();

  const otpRef = useRef(null);
  const instanceIdRef = useRef(null);
  if (instanceIdRef.current === null) {
    loginUserInstanceCounter += 1;
    instanceIdRef.current = loginUserInstanceCounter;
  }

  useEffect(() => {
    const instance = instanceIdRef.current;
    notifNavLog('LoginUser', `MOUNT instance #${instance}`, {
      routeKey: route?.key ?? null,
      params: route?.params ?? null,
      current: describeNav(),
    });
    return () => {
      notifNavLog('LoginUser', `UNMOUNT instance #${instance}`, {
        routeKey: route?.key ?? null,
        current: describeNav(),
      });
    };
  }, []);

  async function unlock(payload, _jwt, pin) {
    notifNavLog('LoginUser', `unlock() instance #${instanceIdRef.current}`, {
      viaBiometric: !pin,
    });
    try {
      if (payload?.vc?.vc && !payload?.vc?.credentialSubject) {
        payload.vc = payload.vc.vc;
      }
    } catch { }
    dispatch(setSecrets(payload));

    dispatch(
      setAddresses({
        account: payload.account,
      }),
    );
    dispatch(setAuthenticated(true));
    await startLocalSession();
    await resetAttempts();

    const exists = await AsyncStorage.getItem('FINLINE_FLAGS');
    if (!exists && typeof pin === 'string' && pin.length) {
      await AsyncStorage.setItem(
        'FINLINE_FLAGS',
        JSON.stringify({
          PIN_HASH: SHA256(pin.trim()).toString(),
          BIO_ENABLED: await (await getPrivadoVault()).isBiometricsEnabled(),
          HAS_WALLET: true,
        }),
      );
    }

    markHomeEntryFromLogin();
    navigation.reset({
      index: 0,
      routes: [
        {
          name: StackNav.TabNavigation,
        },
      ],
    });
    await consumePendingNotificationNavigation('LoginUser.unlock');
  }

  const onPressLoginUser1 = () => {
    navigation.navigate(AuthNav.SelectRecuperation);
  };

  async function verifyPin(code) {
    try {
      const vault = await getPrivadoVault();

      // Recuperación con carnet: el respaldo descargado en RegisterUser4 se
      // restaura con el PIN y reemplaza los datos del dispositivo.
      if (isCIRecovery) {
        const restore = await restoreFromRegistry(code.trim());
        if (restore.type === 'restored') {
          // Las banderas locales eran de la cuenta anterior: unlock() las reescribe.
          await AsyncStorage.removeItem('FINLINE_FLAGS');
          return await loadPayloadOrLock(vault);
        }
        if (restore.type !== 'no_backup') {
          return restore;
        }
        if (!(await vault.exists())) {
          return { ok: false, type: 'recovery_missing' };
        }
        // Sin respaldo pero con vault: ya se restauró antes; ingreso normal.
      }

      const hasUserData = await vault.exists();

      // Red de seguridad para un dispositivo que registre una billetera real
      // después de activar la demo. Va condicionado a !hasUserData: si no,
      // eclipsaría el PIN de un usuario registrado que use el mismo número.
      if (!hasUserData && isDemoActive() && isDemoPin(code)) {
        return { ok: true, demo: true };
      }

      if (!hasUserData) {
        return { ok: false, type: 'no_local_secrets' };
      }

      try {
        await vault.unlock({ type: 'pin', pin: code.trim() });
      } catch (error) {
        if (error instanceof VaultError && error.code === 'INVALID_PIN') {
          return { ok: false, type: 'bad_pin' };
        }
        captureError(error, {
          flow: 'LoginUser',
          step: 'verifyPin.vaultUnlock',
          critical: true,
          code: error?.code,
        });
        return { ok: false, type: 'unexpected', error };
      }
      // Si una subida del respaldo al registro falló antes (p. ej. tras
      // reclamar una credencial de voto), se reintenta con este PIN. En
      // segundo plano: no retrasa ni bloquea el ingreso.
      syncPendingRegistryBackup(code.trim()).then(result => {
        if (result?.error) {
          captureError(result.error, {
            flow: 'LoginUser',
            step: 'syncPendingRegistryBackup',
            critical: false,
          });
        }
      });
      return await loadPayloadOrLock(vault);
    } catch (err) {
      captureError(err, {
        flow: 'LoginUser',
        step: 'verifyPin',
        critical: true,
      });
      logNetworkIssue('verifyPin', err, {
        stage: 'verifyPin',
        attemptCode: code,
      });
      return { ok: false, type: 'unexpected', error: err };
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
          // No pasa por unlock(): ese escribe FINLINE_FLAGS con el hash del PIN
          // y consulta el flag biométrico de la billetera real.
          if (res.demo) {
            await activateDemoSession({dispatch, navigation});
            return;
          }
          if (res.ok) {
            await unlock(res.payload, res.jwt, code.trim());
            return;
          }
          otpRef.current?.clear();
          if (res.type === 'bad_pin') {
            const n = await incAttempts();

            setModal({
              visible: true,
              msg:
                n >= 5
                  ? 'Has agotado tus 5 intentos.\n¿Olvidaste tu PIN?, Recupera tu cuenta.'
                  : `PIN incorrecto.\nTe quedan ${5 - n} intentos.`,
              onClose: n >= 5
                ? () => navigation.replace(AuthNav.SelectRecuperation)
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

          if (res.type === 'recovery_missing') {
            setModal({
              visible: true,
              msg: RECOVERY_MISSING_MESSAGE,
              onClose: () => {
                hideModal();
                navigation.replace(AuthNav.SelectRecuperation);
              },
            });
            return;
          }

          if (res.type === 'recovery_failed') {
            captureError(res.error, {
              flow: 'login',
              step: 'restore_registry_backup',
              critical: true,
            });
            setModal({
              visible: true,
              msg: RECOVERY_FAILED_MESSAGE,
              onClose: hideModal,
            });
            return;
          }

          if (res.type === 'credential_missing') {
            captureError(res.error, {
              flow: 'login',
              step: 'load_identity_credential',
              critical: true,
            });
            setModal({
              visible: true,
              msg: String.noBiometricData,
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
                      params: { screen: AuthNav.RegisterUser1 },
                    },
                  ],
                });
              },
            });
            return;
          }

          captureError(res.error ?? new Error('Unexpected verifyPin result'), {
            flow: 'login',
            step: 'verify_pin',
            critical: false,
          });

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
          logNetworkIssue('verifyPin:catch', err, { stage: 'onCodeFilled' });
          captureError(err, {
            flow: 'login',
            step: 'verify_pin',
            critical: false,
          });
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
      notifNavLog('LoginUser', `isLocked instance #${instanceIdRef.current}`, {blocked});
      setLocked(blocked);
      if (blocked) {
        navigation.replace(AuthNav.AccountLock);
      }
    })();
  }, []);

  useEffect(() => {
    if (locked === false) {
      const t = setTimeout(() => otpRef.current?.inputs?.[0]?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [locked]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const vault = await getPrivadoVault();
        const enabled = (await vault.exists()) && (await vault.isBiometricsEnabled());
        notifNavLog('LoginUser', `biometricUnlock instance #${instanceIdRef.current}`, {
          enabled,
        });
        if (!enabled || isCIRecovery) {
          setLoading(false);
          return;
        }

        const { biometryType } = await getBiometryStatus();
        try {
          await vault.unlock({
            type: 'biometrics',
            prompt: biometryType === 'face' ? 'Escanea tu rostro' : 'Escanea tu huella dactilar',
          });
        } catch (error) {
          setLoading(false);
          if (error instanceof VaultError && BIOMETRIC_SOFT_FAILURES.has(error.code)) {
            return;
          }
          if (error instanceof VaultError && error.code === 'BIOMETRICS_INVALIDATED') {
            setModal({
              visible: true,
              msg: BIOMETRICS_INVALIDATED_MESSAGE,
              btn: String.understand,
            });
            return;
          }
          throw error;
        }

        const res = await loadPayloadOrLock(vault);
        if (!res.ok) {
          setLoading(false);
          if (res.type === 'credential_missing') {
            captureError(res.error, {
              flow: 'login',
              step: 'load_identity_credential',
              critical: true,
            });
          }
          setModal({
            visible: true,
            msg: String.noBiometricData,
            btn: String.understand,
          });
          return;
        }

        await unlock(res.payload, null, '');
        setLoading(false);
      } catch (e) {
        captureError(e, {
          flow: 'login',
          step: 'biometric_auth',
          critical: false,
        });
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
        style={[localStyle.ovalBackground, { backgroundColor: colors.primary }]}
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

            <OTPTextInput
              testID="textInput"
              inputCount={4}
              containerStyle={localStyle.otpInputViewStyle}
              keyboardType="number-pad"
              handleTextChange={code => {
                if (code.length === 4) {
                  onCodeFilled(code);
                }
              }}
              secureTextEntry={true}
              editable={!locked}
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
            {String.loading}
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

const { width, height } = Dimensions.get('window');

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
    height: moderateScale(55),
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.26,
    shadowRadius: 3.5,
  },
});
