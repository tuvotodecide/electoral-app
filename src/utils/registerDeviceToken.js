import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging     from '@react-native-firebase/messaging';
import axios         from 'axios';
import { BACKEND }   from '@env';
import { DEVICE_TOKEN, JWT_KEY, PENDING_DID } from '../common/constants';
import { setAsyncStorageData }   from './AsyncStorage';
import * as Keychain from 'react-native-keychain';
import { getJwt } from './Session';


export async function registerDeviceToken() {
  const token = await messaging().getToken();
  if (!token) return;

  await setAsyncStorageData(DEVICE_TOKEN, token);

  const jwt = await getJwt()
  
  const did = await AsyncStorage.getItem(PENDING_DID);
  if (!jwt && !did) return;          

  const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
  const body    = { token, platform: 'ANDROID', ...(jwt ? {} : { userDid: did }) };

  try {
    await axios.post(`${BACKEND}device-token`, body, { headers });
  } catch (err) {
  }
}
