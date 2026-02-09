import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import BlobUtil from 'react-native-blob-util';

const isHttp = uri => /^https?:\/\//i.test(String(uri || ''));

const guessExt = (uri, contentType) => {
  // 1) Si viene Content-Type, úsalo
  if (contentType) {
    const ct = String(contentType).toLowerCase();
    if (ct.includes('png')) return 'png';
    if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
    if (ct.includes('webp')) return 'webp';
    if (ct.includes('heic')) return 'heic';
  }

  // 2) Si el uri termina con extensión, úsala
  const m = String(uri || '').split('?')[0].match(/\.(\w+)$/);
  if (m && m[1]) return m[1].toLowerCase();

  // 3) Default
  return 'jpg';
};

export const persistLocalImage = async uri => {
  const safeUri = typeof uri === 'string' ? uri : '';
  if (!safeUri) {
    throw new Error('[persistLocalImage] uri vacío o no-string');
  }
  if (isHttp(safeUri)) {
    // 1) Primero pide headers para inferir Content-Type (opcional)
    const head = await BlobUtil.fetch('HEAD', safeUri).catch(() => null);
    const ct =
      head?.respInfo?.headers?.['Content-Type'] ||
      head?.respInfo?.headers?.['content-type'] ||
      '';

    const ext = guessExt(safeUri, ct);
    const destPath = `${RNFS.DocumentDirectoryPath}/acta-${Date.now()}.${ext}`;

    // 2) DESCARGA A DISCO (fileCache true) y además escribe directo a destPath
    const res = await BlobUtil.config({
      fileCache: true,
      path: destPath,     // escribe aquí directamente
      appendExt: ext,     // por si el FS necesita extensión
    }).fetch('GET', safeUri);

    const savedPath = res?.path();


    // 3) Validación fuerte
    if (!savedPath) {
      throw new Error('[persistLocalImage] Descarga HTTP sin path (fileCache falló).');
    }

    // Si BlobUtil respetó "path", savedPath suele ser destPath. Si no, asegúralo:
    if (savedPath !== destPath) {
      await RNFS.copyFile(savedPath, destPath);
      try { await RNFS.unlink(savedPath); } catch (e) { }
    }

    return `file://${destPath}`;
  }

  const ext = guessExt(safeUri);
  const destPath = `${RNFS.DocumentDirectoryPath}/acta-${Date.now()}.${ext}`;

  const isFile = safeUri.startsWith('file://');
  const isAndroidContent = Platform.OS === 'android' && safeUri.startsWith('content://');
  const isIOSAsset =
    Platform.OS === 'ios' &&
    (safeUri.startsWith('ph://') ||
      safeUri.startsWith('assets-library://') ||
      safeUri.startsWith('content://'));

  if (isFile) {
    const src = safeUri.replace('file://', '');
    await RNFS.copyFile(src, destPath);
  } else if (isAndroidContent || isIOSAsset) {
    const base64 = await BlobUtil.fs.readFile(safeUri, 'base64');
    await RNFS.writeFile(destPath, base64, 'base64');
  } else {
    const base64 = await BlobUtil.fs.readFile(safeUri, 'base64');
    await RNFS.writeFile(destPath, base64, 'base64');
  }

  return `file://${destPath}`;
};


export const removePersistedImage = async fileUri => {
  try {
    if (!fileUri || typeof fileUri !== 'string') return;
    const path = fileUri.startsWith('file://') ? fileUri.slice(7) : fileUri;
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch (error) {
    console.error('[PERSIST-IMAGE] Error al eliminar imagen', { error: error?.message });
  }
};
