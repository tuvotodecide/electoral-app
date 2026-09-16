/**
 * Configuración de la cuenta de demostración.
 *
 * Estas credenciales son públicas: se declaran en las notas de revisión de
 * App Store Connect. Van embebidas a propósito. Leerlas de `@env` haría que
 * un build sin `.env` fallara — `babel.config.js` registra
 * react-native-dotenv con `allowUndefined: false` y `.env` no está versionado —
 * justo el fallo que este cambio existe para evitar.
 */

export const DEMO_DNI = '99999999';
export const DEMO_PIN = '2468';

/** Prefijo de todos los ids sintéticos creados por el modo demostración. */
export const DEMO_ID_PREFIX = 'demo_';

const isDemoDni = value => String(value ?? '').trim() === DEMO_DNI;

export const isDemoPin = value => String(value ?? '').trim() === DEMO_PIN;

/** La activación exige AMBOS valores. */
export const matchesDemoCredentials = (dni, pin) =>
  isDemoDni(dni) && isDemoPin(pin);

export const isDemoOwnedId = value =>
  String(value ?? '').startsWith(DEMO_ID_PREFIX);
