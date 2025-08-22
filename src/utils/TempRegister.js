// utils/TempRegister.js
import * as Keychain from 'react-native-keychain';

const SERVICE_TMP = 'tmpRegister';
const SERVICE_PIN = 'tmpRegisterPin';

export async function setTmpRegister(bundle) {
  await Keychain.setGenericPassword('tmp', JSON.stringify({ ...bundle, createdAt: Date.now() }), {
    service: SERVICE_TMP,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
export async function getTmpRegister() {
  const creds = await Keychain.getGenericPassword({ service: SERVICE_TMP });
  if (!creds) return null;
  try { return JSON.parse(creds.password); } catch { return null; }
}
export async function clearTmpRegister() {
  try { await Keychain.resetGenericPassword({ service: SERVICE_TMP }); } catch {}
}

// NUEVO: PIN efímero
export async function setTmpPin(pin) {
  await Keychain.setGenericPassword('tmpPin', JSON.stringify({ pin, createdAt: Date.now() }), {
    service: SERVICE_PIN,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}
export async function getTmpPin() {
  const creds = await Keychain.getGenericPassword({ service: SERVICE_PIN });
  if (!creds) return null;
  try { return JSON.parse(creds.password)?.pin || null; } catch { return null; }
}
export async function clearTmpPin() {
  try { await Keychain.resetGenericPassword({ service: SERVICE_PIN }); } catch {}
}
