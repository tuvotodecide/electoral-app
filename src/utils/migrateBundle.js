import AsyncStorage from '@react-native-async-storage/async-storage';
import {getSecrets} from './Cifrate';
import {writeBundleAtomic} from './ensureBundle';
import {getBioFlag} from './BioFlag';
import * as Keychain from 'react-native-keychain';
import {JWT_KEY} from '../common/constants';
import {Platform} from 'react-native';
import { getJwt } from './Session';

const FLAG = 'BUNDLE_MIGRATED_v2';

export async function migrateIfNeeded() {
  if (await AsyncStorage.getItem(FLAG)) return;

  const stored = await getSecrets();
  if (!stored) return;

  const jwt = await getJwt();
  await writeBundleAtomic(JSON.stringify({...stored.payloadQr, jwt}));

  if (await getBioFlag()) {
    await Keychain.setGenericPassword(
      'bundle',
      JSON.stringify({stored: stored.payloadQr, jwt}),
      {
        service: 'walletBundle',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        accessControl:
          Platform.OS === 'ios'
            ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE
            : Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      },
    );
  }
  await AsyncStorage.setItem(FLAG, '1');
  console.log('sí');
  
}
