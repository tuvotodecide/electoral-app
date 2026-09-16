import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {IDENTITY_KEY} from '@env';

import {API} from '../api/http';
import {ON_BOARDING, THEME} from '../common/constants';
import store, {persistor} from '../redux/store';
import {clearWallet} from '../redux/action/walletAction';
import {clearAuth} from '../redux/slices/authSlice';
import {clearSession} from './Session';
import {discoverableHashFromDni} from './idHash';

// Preferencias del dispositivo, no son datos personales.
const PRESERVED_APP_KEYS = [THEME, ON_BOARDING];

// Claves propias de wira-sdk: las borra wira.deleteAllData()
// (Storage.deleteAllLocalData) y 'hasRunBefore' la usa
// wira.Storage.checkFirstLaunch. No se tocan antes de llamar a la librería.
const WIRA_KEYS = ['BIO_ENABLED', 'SALT', 'WIRA_MIGRATED', 'hasRunBefore'];
const WIRA_KEY_PREFIX = 'wira-sdk-';

const isPreservedKey = key =>
  PRESERVED_APP_KEYS.includes(key) ||
  WIRA_KEYS.includes(key) ||
  key.startsWith(WIRA_KEY_PREFIX);

/**
 * Solicita al backend de identidad la eliminación de la cuenta en la nube.
 * El backend notifica al `email` cuando la eliminación se completa.
 */
export async function requestAccountDeletion({dni, email}) {
  await API.post(
    '/registry/request-delete',
    {userHash: discoverableHashFromDni(dni), email},
    {headers: {'x-api-key': IDENTITY_KEY}},
  );
}

/**
 * Elimina todo lo que la app guarda localmente (sesión, redux persistido y
 * AsyncStorage), salvo preferencias del dispositivo y los datos de wira-sdk.
 */
export async function clearAppLocalData() {
  delete axios.defaults.headers.common.Authorization;
  store.dispatch(clearAuth());
  store.dispatch(clearWallet());
  await clearSession();
  await persistor.purge();

  const keys = (await AsyncStorage.getAllKeys()) || [];
  const removals = keys.filter(key => !isPreservedKey(key));
  if (removals.length) {
    await AsyncStorage.multiRemove(removals);
  }
}
