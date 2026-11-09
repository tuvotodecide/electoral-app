import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Biometría del sistema para la interfaz (confirmar que el usuario puede usar
 * su huella o rostro). No protege datos: las claves y credenciales las abre el
 * vault del SDK (`vault.enableBiometrics()` / `vault.unlock({type: 'biometrics'})`).
 */

/** Tipo de biometría disponible: 'face', 'fingerprint', 'iris' o null. */
const biometryTypeFrom = types => {
  const {AuthenticationType} = LocalAuthentication;
  if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(AuthenticationType.IRIS)) {
    return 'iris';
  }
  return null;
};

/**
 * Estado de la biometría del dispositivo:
 * - `hasHardware`: hay sensor.
 * - `enrolled`: hay al menos una huella o rostro registrado.
 * - `biometryType`: el tipo, para los textos.
 */
export async function getBiometryStatus() {
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return {
      hasHardware: Boolean(hasHardware),
      enrolled: Boolean(enrolled),
      biometryType: biometryTypeFrom(types ?? []),
    };
  } catch {
    return {hasHardware: false, enrolled: false, biometryType: null};
  }
}

/**
 * Muestra el aviso biométrico del sistema. Solo biometría: sin la opción de
 * usar el código del dispositivo. Devuelve `{ok, cancelled, error}`.
 */
export async function authenticateWithBiometrics(promptMessage) {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
    if (result.success) {
      return {ok: true, cancelled: false, error: null};
    }
    const cancelled = ['user_cancel', 'system_cancel', 'app_cancel'].includes(result.error);
    return {ok: false, cancelled, error: result.error ?? null};
  } catch (error) {
    return {ok: false, cancelled: false, error: error?.message ?? String(error)};
  }
}
