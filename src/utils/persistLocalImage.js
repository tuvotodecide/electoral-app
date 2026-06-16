import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

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
    const head = await fetch(safeUri, { method: 'HEAD' }).catch(() => null);
    const ct = head?.headers?.get?.('content-type') || '';

    const ext = guessExt(safeUri, ct);
    const destPath = `${Paths.document.uri}/acta-${Date.now()}.${ext}`;

    // 2) Descarga directa con expo-file-system
    const res = await File.downloadFileAsync(safeUri, destPath);

    // 3) Validación fuerte
    if (!res?.exists) {
      throw new Error('[persistLocalImage] Descarga HTTP sin archivo generado.');
    }

    return destPath;
  }

  const ext = guessExt(safeUri);
  const destPath = `${Paths.document.uri}/acta-${Date.now()}.${ext}`;

  const isFile = safeUri.startsWith('file://');
  const isAndroidContent = Platform.OS === 'android' && safeUri.startsWith('content://');
  const isIOSAsset =
    Platform.OS === 'ios' &&
    (safeUri.startsWith('ph://') ||
      safeUri.startsWith('assets-library://') ||
      safeUri.startsWith('content://'));

  if (isFile) {
    (new File(safeUri)).copy(new File(destPath));
  } else if (isAndroidContent || isIOSAsset) {
    const base64 = await (new File(safeUri)).base64();
    (new File(destPath)).write(base64, {
      encoding: 'base64'
    });
  } else {
    const base64 = await (new File(safeUri)).base64();
    (new File(destPath)).write(base64, {
      encoding: 'base64'
    });
  }

  return destPath;
};


export const removePersistedImage = async fileUri => {
  try {
    if (!fileUri || typeof fileUri !== 'string') return;
    const fileToRemove = new File(fileUri);
    const { exists } = fileToRemove.info();

    if (exists) fileToRemove.delete();
  } catch (error) {
    console.error('[PERSIST-IMAGE] Error al eliminar imagen', { error: error?.message });
  }
};
