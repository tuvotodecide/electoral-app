

import {SHA256} from 'crypto-js';
import * as Keychain from 'react-native-keychain';
import {checkPin, createBundleFromPrivKey, getSecrets, saveSecrets} from './Cifrate';
import {resetAttempts}    from './PinAttempts';
import {getBioFlag}       from './BioFlag';
import { getJwt } from './Session';
import { writeBundleAtomic } from './ensureBundle';


export async function changePin(oldPin , newPin ) {
  const ok = await checkPin(oldPin);
  if (!ok) throw new Error('PIN actual incorrecto');

  const stored = await getSecrets();
  if (!stored) throw new Error('No se encontraron datos cifrados');

  const payload = stored.payloadQr;
  const bundle  = await createBundleFromPrivKey(newPin.trim(), payload.privKey);
  const pinHash = SHA256(newPin.trim()).toString();
  
  await saveSecrets(newPin.trim(), payload, await getBioFlag(), bundle, pinHash);
  const jwt = await getJwt();
  await writeBundleAtomic(JSON.stringify({ ...bundle, ...payload, jwt }));

  if (await getBioFlag()) {
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
