import AsyncStorage from '@react-native-async-storage/async-storage';
import {getPrivadoClient} from './privadoSession';

/**
 * Respaldo de la cuenta en el registro (backend-identity).
 *
 * El respaldo está cifrado con el PIN e incluye todas las credenciales del
 * dispositivo, así que hay que volver a subirlo cada vez que se guarda una
 * credencial nueva (p. ej. la de voto). Si la subida falla, queda la marca
 * `REGISTRY_BACKUP_PENDING_KEY` y se reintenta la próxima vez que el usuario
 * escriba su PIN (crear el respaldo necesita el PIN).
 */
export const REGISTRY_BACKUP_PENDING_KEY = 'privado.registryBackupPending';

const markPending = () =>
  AsyncStorage.setItem(REGISTRY_BACKUP_PENDING_KEY, '1').catch(() => undefined);

/** Quita la marca de respaldo pendiente (p. ej. tras cambiar el PIN, que ya lo sube). */
export const clearRegistryBackupPending = () =>
  AsyncStorage.removeItem(REGISTRY_BACKUP_PENDING_KEY).catch(() => undefined);

export async function isRegistryBackupPending() {
  try {
    return (await AsyncStorage.getItem(REGISTRY_BACKUP_PENDING_KEY)) === '1';
  } catch {
    return false;
  }
}

/**
 * Crea el respaldo con `pin` (debe ser el PIN del vault) y reemplaza el del
 * registro. Si falla, deja la marca de pendiente y relanza el error.
 */
export async function uploadRegistryBackup(pin) {
  try {
    const client = await getPrivadoClient();
    const backup = await client.createBackup(String(pin));
    await client.updateRegistryProfile({backup});
  } catch (error) {
    await markPending();
    throw error;
  }
  await clearRegistryBackupPending();
}

/**
 * Si hay un respaldo pendiente, lo sube con `pin`. No lanza: devuelve si quedó
 * subido (`true`), si no había nada pendiente (`false`) o el error (`{error}`).
 */
export async function syncPendingRegistryBackup(pin) {
  if (!(await isRegistryBackupPending())) {
    return false;
  }
  try {
    await uploadRegistryBackup(pin);
    return true;
  } catch (error) {
    return {error};
  }
}
