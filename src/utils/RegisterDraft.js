import AsyncStorage from '@react-native-async-storage/async-storage';
import { DRAFT } from '../common/constants';

export const saveDraft   = data => AsyncStorage.setItem(DRAFT, JSON.stringify(data));
export const getDraft    = async () => {
  const j = await AsyncStorage.getItem(DRAFT);
  return j ? JSON.parse(j) : null;
};
export const clearDraft  = () => AsyncStorage.removeItem(DRAFT);
