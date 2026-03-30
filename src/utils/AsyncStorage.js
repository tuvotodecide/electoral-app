import { StorageService as AsyncStorage } from '../services/StorageService';
import {ON_BOARDING, THEME} from '../common/constants';
import {jsonSafe} from './RegisterDraft';

const setOnBoarding = async v =>
  AsyncStorage.setItem(ON_BOARDING, JSON.stringify(v));

// Interface Segregation Principle (ISP): 
// Métodos segregados para no obligar al cliente a descargar todo
const getThemeColor = async () => {
  const themeRaw = await AsyncStorage.getItem(THEME);
  try { return themeRaw ? JSON.parse(themeRaw) : null; } catch (e) { return null; }
};

const getOnBoardingValue = async () => {
  const onbRaw = await AsyncStorage.getItem(ON_BOARDING);
  try { return onbRaw ? JSON.parse(onbRaw) : null; } catch (e) { return null; }
};

const initialStorageValueGet = async () => {
  const themeColor = await getThemeColor();
  const onBoardingValue = await getOnBoardingValue();
  return {themeColor, onBoardingValue};
};
const toStoredString = v =>
  v == null
    ? '' 
    : typeof v === 'string'
    ? v
    : JSON.stringify(v);

const setAsyncStorageData = async (k, v) =>
  AsyncStorage.setItem(k, toStoredString(v));

const getAsyncStorageData = async k => {
  const raw = await AsyncStorage.getItem(k);
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};
export {
  setOnBoarding,
  getThemeColor,
  getOnBoardingValue,
  initialStorageValueGet,
  setAsyncStorageData,
  getAsyncStorageData,
};
