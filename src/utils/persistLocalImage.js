import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import BlobUtil from 'react-native-blob-util';

const guessExt = uri => {
  const m = uri.split('?')[0].match(/\.(\w+)$/);
  return m && m[1] ? m[1] : 'jpg';
};

export const persistLocalImage = async uri => {

  const ext = guessExt(uri);
  const destPath = `${RNFS.DocumentDirectoryPath}/acta-${Date.now()}.${ext}`;


  const isFile = uri.startsWith('file://');
  const isAndroidContent =
    Platform.OS === 'android' && uri.startsWith('content://');
  const isIOSAsset =
    Platform.OS === 'ios' &&
    (uri.startsWith('ph://') ||
      uri.startsWith('assets-library://') ||
      uri.startsWith('content://'));


  if (isFile) {
    const src = uri.replace('file://', '');
    await RNFS.copyFile(src, destPath);
  } else if (isAndroidContent || isIOSAsset) {
    const base64 = await BlobUtil.fs.readFile(uri, 'base64');
    await RNFS.writeFile(destPath, base64, 'base64');
  } else {
    const base64 = await BlobUtil.fs.readFile(uri, 'base64');
    await RNFS.writeFile(destPath, base64, 'base64');
  }

  return `file://${destPath}`;
};

export const removePersistedImage = async fileUri => {
  try {
    const path = fileUri.startsWith('file://') ? fileUri.slice(7) : fileUri;
    const exists = await RNFS.exists(path);
    if (exists) {
      await RNFS.unlink(path);
    }
  } catch (error) {
    console.error('[PERSIST-IMAGE] Error al eliminar imagen', {
      error: error.message,
    });
  }
};
