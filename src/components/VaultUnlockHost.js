import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import {useDispatch, useSelector} from 'react-redux';
import {VaultError} from '@privado-id/expo-sdk';

import CText from './common/CText';
import {moderateScale} from '../common/constants';
import typography from '../themes/typography';
import {styles} from '../themes';
import {getPrivadoVault} from '../services/privado/privadoSession';
import {
  VaultUnlockCancelledError,
  VaultUnlockUnavailableError,
  setVaultUnlockPrompter,
} from '../services/privado/vaultUnlock';
import {getBiometryStatus} from '../services/biometrics';
import {incAttempts, resetAttempts} from '../utils/PinAttempts';
import {clearWallet} from '../redux/action/walletAction';
import {clearAuth} from '../redux/slices/authSlice';
import {navigationRef} from '../navigation/RootNavigation';
import {AuthNav, StackNav} from '../navigation/NavigationKey';

/** Mismo límite que LoginUser: al quinto PIN incorrecto se cierra la sesión. */
export const MAX_PIN_ATTEMPTS = 5;
const PIN_LENGTH = 4;

const DEFAULT_REASON = 'Ingresa tu PIN para continuar.';
const BIOMETRICS_INVALIDATED_MESSAGE =
  'La biometría de tu dispositivo cambió, así que se desactivó el ingreso con huella o rostro. Ingresa tu PIN.';

const HIDDEN = {visible: false, reason: '', biometrics: false, busy: false, error: ''};

/** Un error del vault que solo significa "no se usó la biometría": queda el PIN. */
const isSoftBiometricFailure = error =>
  error instanceof VaultError &&
  ['BIOMETRICS_CANCELLED', 'BIOMETRICS_FAILED', 'BIOMETRICS_UNAVAILABLE', 'BIOMETRICS_NOT_ENABLED'].includes(
    error.code,
  );

function resetToRecovery() {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.reset({
    index: 0,
    routes: [
      {
        name: StackNav.AuthNavigation,
        params: {screen: AuthNav.SelectRecuperation},
      },
    ],
  });
}

/**
 * Modal de desbloqueo del vault. Se registra como prompter de `vaultUnlock`: cuando
 * una operación del SDK necesita el vault y está bloqueado (inactividad o segundo
 * plano), lo pide con biometría (si está activada) o con el PIN.
 *
 * El modal abre el vault él mismo (`vault.unlock`), así un PIN incorrecto se puede
 * reintentar sin que falle la operación; cuenta los intentos con PinAttempts y al
 * quinto cierra la sesión como LoginUser. Cerrar el modal cancela la operación con
 * `VaultUnlockCancelledError`. Solo con la sesión iniciada: antes del login el vault
 * se abre en LoginUser.
 */
export default function VaultUnlockHost() {
  const colors = useSelector(state => state.theme.theme);
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const dispatch = useDispatch();
  const [view, setView] = useState(HIDDEN);
  const pendingRef = useRef(null);
  const authRef = useRef(isAuthenticated);
  const otpRef = useRef(null);

  const settle = useCallback(outcome => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setView(HIDDEN);
    if (!pending) return;
    if (outcome.error) pending.reject(outcome.error);
    else pending.resolve(outcome.method);
  }, []);

  const tryBiometrics = useCallback(async () => {
    setView(current => ({...current, busy: true, error: ''}));
    try {
      const [vault, {biometryType}] = await Promise.all([getPrivadoVault(), getBiometryStatus()]);
      const prompt = biometryType === 'face' ? 'Escanea tu rostro' : 'Escanea tu huella dactilar';
      await vault.unlock({type: 'biometrics', prompt});
      await resetAttempts();
      settle({method: {type: 'biometrics', prompt}});
    } catch (error) {
      if (error instanceof VaultError && error.code === 'BIOMETRICS_INVALIDATED') {
        setView(current => ({
          ...current,
          busy: false,
          biometrics: false,
          error: BIOMETRICS_INVALIDATED_MESSAGE,
        }));
        return;
      }
      if (isSoftBiometricFailure(error)) {
        setView(current => ({...current, busy: false}));
        return;
      }
      settle({error});
    }
  }, [settle]);

  useEffect(() => {
    authRef.current = isAuthenticated;
    // Al cerrar la sesión ya no hay a quién pedirle el desbloqueo.
    if (!isAuthenticated && pendingRef.current) {
      settle({error: new VaultUnlockCancelledError()});
    }
  }, [isAuthenticated, settle]);

  useEffect(
    () =>
      setVaultUnlockPrompter(request => {
        if (!authRef.current || request?.purpose !== 'unlock') {
          throw new VaultUnlockUnavailableError(request);
        }
        if (pendingRef.current) {
          return pendingRef.current.promise;
        }
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        pendingRef.current = {resolve, reject, promise};
        setView({
          visible: true,
          reason: request.reason || DEFAULT_REASON,
          biometrics: Boolean(request.biometricsEnabled),
          busy: false,
          error: '',
        });
        if (request.biometricsEnabled) {
          tryBiometrics();
        }
        return promise;
      }),
    [tryBiometrics],
  );

  const submitPin = async code => {
    if (code.length !== PIN_LENGTH || view.busy || !pendingRef.current) return;
    setView(current => ({...current, busy: true, error: ''}));
    try {
      const vault = await getPrivadoVault();
      await vault.unlock({type: 'pin', pin: code});
      await resetAttempts();
      settle({method: {type: 'pin', pin: code}});
    } catch (error) {
      otpRef.current?.clear();
      if (!(error instanceof VaultError) || error.code !== 'INVALID_PIN') {
        settle({error});
        return;
      }
      const attempts = await incAttempts();
      if (attempts >= MAX_PIN_ATTEMPTS) {
        settle({
          error: new VaultUnlockCancelledError(
            'PIN_ATTEMPTS_EXHAUSTED',
            'Se agotaron los intentos de PIN.',
          ),
        });
        dispatch(clearWallet());
        dispatch(clearAuth());
        resetToRecovery();
        return;
      }
      setView(current => ({
        ...current,
        busy: false,
        error: `PIN incorrecto. Te quedan ${MAX_PIN_ATTEMPTS - attempts} intentos.`,
      }));
    }
  };

  const cancel = () => settle({error: new VaultUnlockCancelledError()});

  return (
    <Modal
      testID="vaultUnlockModal"
      visible={view.visible}
      animationType="fade"
      transparent
      onRequestClose={cancel}>
      <View style={[local.overlay, {backgroundColor: colors?.modalBackground ?? 'rgba(0,0,0,0.6)'}]}>
        <View style={[local.container, {backgroundColor: colors?.backgroundColor ?? '#FFFFFF'}]}>
          <CText type="B18" align="center" style={styles.mb10}>
            Desbloquea tu cuenta
          </CText>
          <CText testID="vaultUnlockReason" type="M16" align="center">
            {view.reason}
          </CText>

          <OTPTextInput
            testID="vaultUnlockPinInput"
            ref={otpRef}
            inputCount={PIN_LENGTH}
            containerStyle={local.otp}
            keyboardType="number-pad"
            secureTextEntry
            editable={!view.busy}
            handleTextChange={code => {
              if (code.length === PIN_LENGTH) submitPin(code);
            }}
            textInputStyle={[
              local.otpInput,
              {
                backgroundColor: colors?.inputBackground,
                color: colors?.textColor,
                borderColor: colors?.grayScale500,
              },
            ]}
            tintColor={colors?.primary}
            offTintColor={colors?.grayScale500}
          />

          {view.error ? (
            <CText testID="vaultUnlockError" type="M14" align="center" style={local.error}>
              {view.error}
            </CText>
          ) : null}
          {view.busy ? <ActivityIndicator testID="vaultUnlockBusy" style={styles.mt10} /> : null}

          <View style={local.actions}>
            {view.biometrics ? (
              <TouchableOpacity
                testID="vaultUnlockBiometricsButton"
                disabled={view.busy}
                onPress={tryBiometrics}
                style={local.action}>
                <CText type="M16" color={colors?.primary}>
                  Usar biometría
                </CText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              testID="vaultUnlockCancelButton"
              disabled={view.busy}
              onPress={cancel}
              style={local.action}>
              <CText type="M16">Cancelar</CText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const local = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
  },
  otp: {
    marginTop: moderateScale(16),
  },
  otpInput: {
    width: moderateScale(50),
    height: moderateScale(55),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    ...typography.fontWeights.Bold,
    ...typography.fontSizes.f26,
    ...styles.mh5,
  },
  error: {
    marginTop: moderateScale(10),
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: moderateScale(24),
    marginTop: moderateScale(16),
  },
  action: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(8),
  },
});
