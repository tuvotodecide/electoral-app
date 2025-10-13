import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import BlobUtil from 'react-native-blob-util';

const guessExt = uri => {
  const m = uri.split('?')[0].match(/\.(\w+)$/);
  return m && m[1] ? m[1] : 'jpg';
};

export const persistLocalImage = async uri => {
/*   console.log('[💾 PERSIST-IMAGE] 📸 Iniciando persistencia de imagen local', {
    uri,
    timestamp: new Date().toISOString(),
  }); */
  const ext = guessExt(uri);
  const destPath = `${RNFS.DocumentDirectoryPath}/acta-${Date.now()}.${ext}`;
/*   console.log('[💾 PERSIST-IMAGE] 📁 Ruta de destino generada', {
    destPath,
    extension: ext,
  }); */

  const isFile = uri.startsWith('file://');
  const isAndroidContent =
    Platform.OS === 'android' && uri.startsWith('content://');
  const isIOSAsset =
    Platform.OS === 'ios' &&
    (uri.startsWith('ph://') ||
      uri.startsWith('assets-library://') ||
      uri.startsWith('content://'));

/*   console.log('[💾 PERSIST-IMAGE] 🔍 Tipo de URI detectado', {
    isFile,
    isAndroidContent,
    isIOSAsset,
    platform: Platform.OS,
  }); */

  if (isFile) {
    //console.log('[💾 PERSIST-IMAGE] 📋 Copiando archivo file://');
    const src = uri.replace('file://', '');
    await RNFS.copyFile(src, destPath);
  } else if (isAndroidContent || isIOSAsset) {
    //console.log('[💾 PERSIST-IMAGE] 📱 Procesando content:// o asset (Android/iOS)');
    const base64 = await BlobUtil.fs.readFile(uri, 'base64');
    await RNFS.writeFile(destPath, base64, 'base64');
  } else {
    //console.log('[💾 PERSIST-IMAGE] 📦 Procesando URI genérico');
    const base64 = await BlobUtil.fs.readFile(uri, 'base64');
    await RNFS.writeFile(destPath, base64, 'base64');
  }

/*   console.log('[💾 PERSIST-IMAGE] ✅ Imagen persistida exitosamente', {
    finalPath: `file://${destPath}`,
  }); */
  return `file://${destPath}`;
};

export const removePersistedImage = async fileUri => {
/*   console.log('[💾 PERSIST-IMAGE] 🗑️ Intentando eliminar imagen persistida', {
    fileUri,
  }); */
  try {
    const path = fileUri.startsWith('file://') ? fileUri.slice(7) : fileUri;
    const exists = await RNFS.exists(path);
/*     console.log('[💾 PERSIST-IMAGE] 🔍 Verificación de existencia', {
      path,
      exists,
    }); */
    if (exists) {
      await RNFS.unlink(path);
      //console.log('[💾 PERSIST-IMAGE] ✅ Imagen eliminada exitosamente');
    } else {
      //console.log('[💾 PERSIST-IMAGE] ⚠️ Archivo no existe, nada que eliminar');
    }
  } catch (error) {
/*     console.error('[💾 PERSIST-IMAGE] ❌ Error al eliminar imagen', {
      error: error.message,
    }); */
  }
};
