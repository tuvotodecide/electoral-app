import {createPersistentPrivadoExpoClient} from '@privado-id/expo-sdk';
import {
  buildPrivadoConfig,
  buildPrivadoLockPolicy,
  getPrivadoIpfsGatewayUrl,
} from './privadoConfig';
import {VAULT_PIN_MIN_LENGTH, vaultUnlockProvider} from './vaultUnlock';

let sessionPromise;

/**
 * Sesión única del SDK de Privado ID: un cliente, un registro de circuitos y un
 * almacén de contextos JSON-LD compartidos por toda la app. La primera llamada
 * la crea e inicializa; las siguientes (aunque sean simultáneas) reciben la
 * misma. Si falla, la siguiente llamada vuelve a intentarlo.
 *
 * `client.init()` solo abre SQLite y SecureStore: no necesita red.
 */
export function getPrivadoSession() {
  sessionPromise ??= Promise.resolve()
    .then(() =>
      createPersistentPrivadoExpoClient({
        config: buildPrivadoConfig(),
        // Claves privadas y clave de las credenciales: vault con PIN o biometría.
        vaultUnlockProvider,
        lock: buildPrivadoLockPolicy(),
        pin: {minLength: VAULT_PIN_MIN_LENGTH},
        jsonLd: {ipfsGatewayUrl: getPrivadoIpfsGatewayUrl()},
        // Expo SDK 54: la API clásica de expo-file-system está en /legacy.
        modules: {fileSystem: require('expo-file-system/legacy')},
      }),
    )
    .then(async session => {
      await session.client.init();
      return session;
    })
    .catch(error => {
      sessionPromise = undefined;
      throw error;
    });
  return sessionPromise;
}

/** Cliente del SDK (`PrivadoExpoClient`) de la sesión única. */
export async function getPrivadoClient() {
  return (await getPrivadoSession()).client;
}

/**
 * Vault del SDK (`IdentityVault`): `unlock`, `lock`, `isUnlocked`,
 * `onStateChange`, `verifyPin`, `changePin` y la biometría.
 */
export async function getPrivadoVault() {
  return (await getPrivadoSession()).vault;
}
