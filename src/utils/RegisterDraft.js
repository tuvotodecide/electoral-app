import AsyncStorage from '@react-native-async-storage/async-storage';
import { DRAFT } from '../common/constants';
import { jsonSafe }   from './jsonSafe';

export const saveDraft   = data => AsyncStorage.setItem(DRAFT, jsonSafe(data));
export const getDraft    = async () => {
  const j = await AsyncStorage.getItem(DRAFT);
  return j ? JSON.parse(j) : null;
};
export const clearDraft  = () => AsyncStorage.removeItem(DRAFT);
