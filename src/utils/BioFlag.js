import AsyncStorage from "@react-native-async-storage/async-storage";

export const BIO_KEY = 'BIO_ENABLED';

export async function getBioFlag(){
  const v = await AsyncStorage.getItem(BIO_KEY);
  return v === 'true';
}

export async function setBioFlag(v) {
  await AsyncStorage.setItem(BIO_KEY, v ? 'true' : 'false');
}
