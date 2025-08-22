import AsyncStorage from '@react-native-async-storage/async-storage';
import {ON_BOARDING, THEME} from '../common/constants';
import {jsonSafe} from './jsonSafe';

const setOnBoarding = async v =>
  AsyncStorage.setItem(ON_BOARDING, JSON.stringify(v));

const initialStorageValueGet = async () => {
  const [[, themeRaw], [, onbRaw]] = await AsyncStorage.multiGet([
    THEME,
    ON_BOARDING,
  ]);
  let themeColor = null;
  let onBoardingValue = null;
  try {
    themeColor = themeRaw ? JSON.parse(themeRaw) : null;
  } catch (e) {
    themeColor = null;
  }
  try {
    onBoardingValue = onbRaw ? JSON.parse(onbRaw) : null;
  } catch (e) {
    onBoardingValue = null;
  }
  return {themeColor, onBoardingValue};
};

const setAsyncStorageData = async (k, v) =>
  AsyncStorage.setItem(k, jsonSafe(v));
const getAsyncStorageData = async k =>
  JSON.parse(await AsyncStorage.getItem(k));

export {
  setOnBoarding,
  initialStorageValueGet,
  setAsyncStorageData,
  getAsyncStorageData,
};
