import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {getPrivadoSession} from './privadoSession';

/**
 * Clave de AsyncStorage que marca que la app ya arrancó en este dispositivo.
 * Es la misma que usaba wira-sdk: al actualizar desde esa versión no se borra
 * nada. `clearAppLocalData` (utils/deleteAccount) la conserva.
 */
export const FIRST_LAUNCH_KEY = 'hasRunBefore';

/**
 * Si hay una cuenta en este dispositivo: identidad (DID) y vault. No abre el
 * vault.
 */
export async function hasLocalAccount() {
  const {client, vault} = await getPrivadoSession();
  const [holder, vaultExists] = await Promise.all([client.getHolderDid(), vault.exists()]);
  return Boolean(holder) && vaultExists;
}

/**
 * En iOS el Keychain (SecureStore, donde están el vault y la identidad)
 * sobrevive a la desinstalación, pero AsyncStorage y SQLite (las credenciales)
 * no. En el primer arranque tras instalar se borran esos restos con
 * `client.deleteLocalData()`, sin abrir el vault. En Android no hace falta: al
 * desinstalar se borra todo.
 */
export async function clearLocalDataOnFirstLaunch() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  if ((await AsyncStorage.getItem(FIRST_LAUNCH_KEY)) !== null) {
    return false;
  }
  const {client} = await getPrivadoSession();
  await client.deleteLocalData();
  await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
  return true;
}
