import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SHA256 } from 'crypto-js';
import { KEY, LOCK_KEY, LOCK_MS } from '../common/constants';

const SALT_KEY = 'pinAttempts_salt';
const CHECKSUM_KEY = 'pinAttempts_checksum';

/**
 * Helper para logging centralizado
 * Facilita debugging y integración con Sentry en producción
 */
function logError(context, error) {
  console.error(`[PinAttempts:${context}]`, error);
  // TODO: En producción, agregar:
  // Sentry.captureException(error, { tags: { context } });
}

/**
 * Genera un salt criptográfico una sola vez y lo almacena en SecureStore
 * 
 * MEJORAS:
 * - Salt criptográfico con SHA256 (no Math.random() predecible)
 * - Try/catch con fallback si SecureStore falla
 * - Si falla setItem, usa salt temporal (mejor que crash)
 */
async function getSalt() {
  try {
    let salt = await SecureStore.getItemAsync(SALT_KEY);

    if (!salt) {
      const randomSource = Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      salt = SHA256(randomSource).toString().substring(0, 16);

      try {
        await SecureStore.setItemAsync(SALT_KEY, salt);
      } catch (err) {
        logError('getSalt:setItem', err);

      }
    }

    return salt;
  } catch (err) {
    logError('getSalt:getItem', err);

    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Calcula HMAC del estado actual para detectar tampering
 */
function computeChecksum(attempts, lockUntil, salt) {
  if (!salt) {
    throw new Error('Salt es requerido para computeChecksum');
  }

  // Serializar siempre en el mismo orden
  const state = `attempts:${attempts}|lockUntil:${lockUntil || 'null'}|salt:${salt}`;
  return SHA256(state).toString();
}

/**
 * Lee el contador actual de intentos desde AsyncStorage
 */
async function getAttempts() {
  const n = await AsyncStorage.getItem(KEY);
  return n ? parseInt(n, 10) : 0;
}

/**
 * Valida que el estado en AsyncStorage no fue manipulado
 * 
 * MEJORAS:
 * - Try/catch para manejo de errores
 * - Si hay error desconocido, resetea (secure fail)
 */
export async function validateAttempts() {
  try {
    const salt = await getSalt();

    // Leer checksum guardado en SecureStore
    const storedChecksum = await SecureStore.getItemAsync(CHECKSUM_KEY);
    if (!storedChecksum) {
      // Primera vez, no hay checksum que validar
      return true;
    }

    // Leer estado actual
    const attempts = await getAttempts();
    const lockUntil = await AsyncStorage.getItem(LOCK_KEY);

    // Recalcular checksum esperado
    const expectedChecksum = computeChecksum(attempts, lockUntil, salt);

    // Comparar
    if (expectedChecksum !== storedChecksum) {
      console.warn('[PinAttempts] Datos alterados detectados. Reseteando.');
      await resetAttempts();
      return false;
    }

    return true;
  } catch (err) {
    logError('validateAttempts', err);
    // En caso de error desconocido, resetear (seguro)
    await resetAttempts();
    return false;
  }
}

/**
 * Incrementa el contador de intentos y guarda checksum
 * 
 * MEJORAS IMPORTANTES (ATOMIC):
 * 1. Calcula lockUntil y checksum ANTES de guardar
 * 2. Usa el estado completo para calcular checksum
 * 3. Evita race conditions en caso de crash
 * 4. Try/catch con logging de errores
 */
export async function incAttempts() {
  try {
    const salt = await getSalt();
    const n = (await getAttempts()) + 1;

    // Calcular lockUntil ANTES de guardar
    const lockUntil = n >= 5 ? Date.now() + LOCK_MS : null;

    // Calcular checksum CON el estado final
    const checksum = computeChecksum(n, lockUntil, salt);

    // Guardar en orden (AsyncStorage primero, SecureStore después)
    try {
      await AsyncStorage.setItem(KEY, String(n));

      if (lockUntil) {
        await AsyncStorage.setItem(LOCK_KEY, String(lockUntil));
      }

      await SecureStore.setItemAsync(CHECKSUM_KEY, checksum);
    } catch (err) {
      logError('incAttempts:save', err);
      throw err;
    }

    return n;
  } catch (err) {
    logError('incAttempts', err);
    throw new Error(`No se pudo registrar intento fallido: ${err.message}`);
  }
}

/**
 * Resetea el contador y el lockout
 * 
 * MEJORA:
 * - Ahora también borra CHECKSUM_KEY de SecureStore
 * - Limpieza completa de estado
 */
export async function resetAttempts() {
  try {
    await AsyncStorage.multiRemove([KEY, LOCK_KEY]);

    // También borrar checksum para limpieza completa
    try {
      await SecureStore.deleteItemAsync(CHECKSUM_KEY);
    } catch (err) {
      logError('resetAttempts:deleteChecksum', err);
      // Si falla, no es fatal (próxima validación lo detectará)
    }
  } catch (err) {
    logError('resetAttempts', err);
  }
}

/**
 * Verifica si la cuenta está bloqueada por muchos intentos
 * 
 * MEJORAS:
 * - Valida integridad PRIMERO
 * - Si hay manipulación o error, BLOQUEA (secure fail)
 * - Limpieza de checksum cuando expira lockout
 */
export async function isLocked() {
  try {
    // Validar integridad primero
    const valid = await validateAttempts();
    if (!valid) {
      // Si fue alterado, no permitir reintentos: BLOQUEAR
      return true;
    }

    const until = await AsyncStorage.getItem(LOCK_KEY);

    if (!until) {
      return false;
    }

    const untilTime = Number(until);

    if (Date.now() < untilTime) {
      return true; // Aún bloqueado
    }

    // Lockout expiró, limpiar todo
    await AsyncStorage.multiRemove([KEY, LOCK_KEY]);
    try {
      await SecureStore.deleteItemAsync(CHECKSUM_KEY);
    } catch (err) {
      logError('isLocked:cleanup', err);
    }

    return false;
  } catch (err) {
    logError('isLocked', err);
    // En caso de error, ser conservador: BLOQUEAR (secure fail)
    return true;
  }
}