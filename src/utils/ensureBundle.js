import {NativeModules, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {DocumentDirectoryPath, moveFile, writeFile} from 'react-native-fs';

const {IdentityBridge} = NativeModules;
const PATH =
  Platform.OS === 'android'
    ? `${RNFS.DocumentDirectoryPath}/bundle_secure.json`
    : null;


export async function ensureBundle() {
  if (!PATH) return false;
  try {
    const ok = await RNFS.exists(PATH);
    if (ok) {
      const st = await RNFS.stat(PATH);
      if (st.size > 0) return true;
    }
  } catch (e) {
    
  }

  try {
    
    return await IdentityBridge.requestBundle();
  } catch (e) {

    return false;
  }
}

export async function writeBundleAtomic(data) {
  try {
    const dir = DocumentDirectoryPath;
    const tmp = `${dir}/bundle_secure.tmp`;
    const dst = `${dir}/bundle_secure.json`;

    await writeFile(tmp, data, 'utf8');
    await moveFile(tmp, dst);

    const {size} = await RNFS.stat(dst);

  } catch (e) {
  }
}

export async function readBundleFile() {
  if (!PATH) return null;
  try {
    const ok = await RNFS.exists(PATH);
    if (!ok) return null;
    const raw = await RNFS.readFile(PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;          
  }
}
