import {getPrivadoVault} from './privadoSession';
import {
  VaultUnlockCancelledError,
  VaultUnlockUnavailableError,
  isUnlockCancelCoolingDown,
  withVaultUnlockReason,
} from './vaultUnlock';

/**
 * Abre el vault si está bloqueado, pidiéndolo con el modal de desbloqueo
 * (`reason` es el texto que muestra). Devuelve `true` si quedó abierto y
 * `false` si no hay vault, si el usuario canceló (o canceló hace menos de un
 * minuto) o si ahora no se puede pedir. Para las tareas en segundo plano: no
 * lanza por una cancelación.
 */
export async function ensureVaultUnlocked({reason} = {}) {
  const vault = await getPrivadoVault();
  if (vault.isUnlocked()) {
    return true;
  }
  if (isUnlockCancelCoolingDown() || !(await vault.exists())) {
    return false;
  }
  try {
    await withVaultUnlockReason(reason, () => vault.unlock());
    return vault.isUnlocked();
  } catch (error) {
    if (
      error instanceof VaultUnlockCancelledError ||
      error instanceof VaultUnlockUnavailableError
    ) {
      return false;
    }
    throw error;
  }
}

/** Como mucho un aviso de actividad cada 15 s: el bloqueo por inactividad es en minutos. */
export const VAULT_TOUCH_THROTTLE_MS = 15 * 1000;
let lastTouchAt = 0;

/**
 * Cuenta un toque del usuario como uso del vault, para que el bloqueo por
 * inactividad (PRIVADO_IDLE_TIMEOUT_MINUTES) cuente los minutos sin usar la
 * app y no solo sin operaciones del SDK. No abre un vault bloqueado.
 */
export function touchVaultActivity() {
  const now = Date.now();
  if (now - lastTouchAt < VAULT_TOUCH_THROTTLE_MS) {
    return;
  }
  lastTouchAt = now;
  getPrivadoVault()
    .then(vault => vault.touch())
    .catch(() => undefined);
}

/** Solo para tests. */
export function __resetVaultActivityForTests() {
  lastTouchAt = 0;
}
