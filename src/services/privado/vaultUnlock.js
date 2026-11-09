/**
 * Desbloqueo del vault del SDK de Privado ID.
 *
 * El vault guarda las claves privadas y la clave de las credenciales. Está
 * cifrado con el PIN del usuario y, si se activa, también puede abrirse con la
 * biometría del dispositivo. Cuando una operación del SDK lo necesita y está
 * bloqueado, el SDK llama a `vaultUnlockProvider` con
 * `{purpose: 'create' | 'unlock', biometricsEnabled}`.
 *
 * - Los flujos que ya tienen el PIN envuelven la llamada al SDK en
 *   `withVaultPin(pin, () => client.algo())`. Con `purpose: 'create'` (primera
 *   clave privada) ese PIN pasa a ser el PIN del vault.
 * - Si no hay PIN en curso, se delega en el prompter registrado con
 *   `setVaultUnlockPrompter`: un modal que pide el PIN o la biometría y
 *   devuelve `{type: 'pin', pin}` o `{type: 'biometrics', prompt}`.
 * - Sin ninguno de los dos, la operación falla con `VaultUnlockUnavailableError`.
 * - Si el usuario cancela el modal, la operación falla con
 *   `VaultUnlockCancelledError` y durante `UNLOCK_CANCEL_COOLDOWN_MS` las
 *   siguientes solicitudes se rechazan sin volver a mostrarlo (para que las
 *   tareas en segundo plano no lo abran una y otra vez).
 */

/** Longitud mínima del PIN del vault. */
export const VAULT_PIN_MIN_LENGTH = 4;

/** Tras una cancelación, tiempo en que no se vuelve a pedir el desbloqueo. */
export const UNLOCK_CANCEL_COOLDOWN_MS = 60 * 1000;

const scopes = [];
const reasons = [];
let prompter = null;
let lastCancelledAt = 0;
let now = () => Date.now();

export class VaultUnlockUnavailableError extends Error {
  constructor(request) {
    super(`No hay forma de desbloquear el vault (purpose: ${request?.purpose}).`);
    this.name = 'VaultUnlockUnavailableError';
    this.code = 'VAULT_UNLOCK_UNAVAILABLE';
    this.request = request;
  }
}

/** El usuario cerró el modal de desbloqueo, o agotó los intentos de PIN. */
export class VaultUnlockCancelledError extends Error {
  constructor(code = 'VAULT_UNLOCK_CANCELLED', message = 'Se canceló el desbloqueo.') {
    super(message);
    this.name = 'VaultUnlockCancelledError';
    this.code = code;
  }
}

/**
 * Ejecuta `operation` con `pin` disponible para abrir (o crear) el vault. Las
 * llamadas pueden anidarse o solaparse: se usa la más reciente en curso.
 */
export async function withVaultPin(pin, operation) {
  const scope = {pin: String(pin)};
  scopes.push(scope);
  try {
    return await operation();
  } finally {
    const index = scopes.indexOf(scope);
    if (index >= 0) {
      scopes.splice(index, 1);
    }
  }
}

/**
 * Registra la función que pide el desbloqueo al usuario cuando no hay un PIN
 * en curso. Recibe `{purpose, biometricsEnabled}` y devuelve el método de
 * desbloqueo, o lanza para cancelar. Devuelve la función que la desregistra.
 */
export function setVaultUnlockPrompter(fn) {
  prompter = fn;
  return () => {
    if (prompter === fn) {
      prompter = null;
    }
  };
}

/**
 * Ejecuta `operation` con `reason` como texto del modal si necesita
 * desbloquear el vault (p. ej. "Tienes actas pendientes de publicar").
 */
export async function withVaultUnlockReason(reason, operation) {
  const entry = {reason};
  reasons.push(entry);
  try {
    return await operation();
  } finally {
    const index = reasons.indexOf(entry);
    if (index >= 0) {
      reasons.splice(index, 1);
    }
  }
}

/** Si hace menos de `UNLOCK_CANCEL_COOLDOWN_MS` que el usuario canceló. */
export const isUnlockCancelCoolingDown = () =>
  lastCancelledAt > 0 && now() - lastCancelledAt < UNLOCK_CANCEL_COOLDOWN_MS;

/** `VaultUnlockProvider` que recibe `createPersistentPrivadoExpoClient`. */
export async function vaultUnlockProvider(request) {
  const scope = scopes[scopes.length - 1];
  if (scope) {
    return {type: 'pin', pin: scope.pin};
  }
  if (!prompter) {
    throw new VaultUnlockUnavailableError(request);
  }
  if (isUnlockCancelCoolingDown()) {
    throw new VaultUnlockCancelledError();
  }
  try {
    return await prompter({...request, reason: reasons[reasons.length - 1]?.reason});
  } catch (error) {
    if (error instanceof VaultUnlockCancelledError) {
      lastCancelledAt = now();
    }
    throw error;
  }
}

/** Solo para tests: reloj y estado de cancelación. */
export function __resetVaultUnlockForTests({clock} = {}) {
  lastCancelledAt = 0;
  now = clock ?? (() => Date.now());
  scopes.length = 0;
  reasons.length = 0;
  prompter = null;
}
