import AsyncStorage from '@react-native-async-storage/async-storage';
import {randomBytes} from 'react-native-quick-crypto';
import {DEVICE_ID_KEY} from '../common/constants';

function bytesToUuid(buf) {
  const hex = Array.from(buf)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return (
    hex.substr(0, 8) +
    '-' +
    hex.substr(8, 4) +
    '-' +
    hex.substr(12, 4) +
    '-' +
    hex.substr(16, 4) +
    '-' +
    hex.substr(20, 12)
  ).toLowerCase();
}

export async function getDeviceId() {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!id) {
      // Genera 16 bytes aleatorios y pásalos a UUID v4
      const buf = randomBytes(16);
      // Ajusta los bits para que sea un UUID v4 válido
      buf[6] = (buf[6] & 0x0f) | 0x40; // versión 4
      buf[8] = (buf[8] & 0x3f) | 0x80; // variante RFC4122

      id = bytesToUuid(buf);
 

      await AsyncStorage.setItem(DEVICE_ID_KEY, id);

      const verify = await AsyncStorage.getItem(DEVICE_ID_KEY);

    }

    return id;
  } catch (e) {
    throw e;
  }
}
