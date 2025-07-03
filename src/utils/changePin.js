
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {JWT_KEY}          from '../common/constants';
import {checkPin, getSecrets, saveSecrets} from './Cifrate';
import {resetAttempts}    from './PinAttempts';
import {getBioFlag}       from './BioFlag';


export async function changePin(oldPin , newPin ) {
  if (!(await checkPin(oldPin))) {
    throw new Error('PIN actual incorrecto');
  }

  const stored = await getSecrets();
  if (!stored) throw new Error('No se encontraron datos cifrados');

  await saveSecrets(newPin.trim(), stored.payloadQr, await getBioFlag());

  if (await getBioFlag()) {
    const jwt = await AsyncStorage.getItem(JWT_KEY);
    await Keychain.setGenericPassword(
      'bundle',
      JSON.stringify({stored, jwt}),
      {
        service: 'walletBundle',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        accessible : Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
  }

  await resetAttempts();
}
