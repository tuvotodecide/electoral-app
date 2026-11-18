import {CIRCUITS_URL} from '@env';
import {CircuitId} from '@privado-id/expo-sdk';
import {getPrivadoSession} from './privadoSession';

/** Circuitos que la app necesita para autenticarse y generar pruebas. */
export const REQUIRED_CIRCUITS = [
  CircuitId.AuthV2,
  CircuitId.CredentialAtomicQuerySigV2,
  CircuitId.CredentialAtomicQueryMTPV2,
];

/**
 * Registra en el SDK los circuitos ya extraídos en una descarga anterior. El
 * registro vive en memoria, así que hay que llamarlo en cada arranque.
 * Devuelve `true` si estaban todos.
 */
export async function registerCachedCircuits() {
  const {circuits} = await getPrivadoSession();
  const {missing} = await circuits.registerCached({
    requiredCircuits: REQUIRED_CIRCUITS,
  });
  return missing.length === 0;
}

let downloadPromise = null;
const progressListeners = new Set();

/** `true` mientras `downloadCircuits` no ha terminado. */
export const isCircuitDownloadInProgress = () => downloadPromise !== null;

/**
 * Descarga el ZIP de `CIRCUITS_URL`, lo extrae en la caché y registra los
 * circuitos. Si ya hay una descarga en curso, se une a ella en lugar de
 * empezar otra. `onProgress` recibe `{phase, percent, bytesWritten, totalBytes}`.
 */
export function downloadCircuits({onProgress} = {}) {
  if (onProgress) {
    progressListeners.add(onProgress);
  }
  downloadPromise ??= (async () => {
    if (!String(CIRCUITS_URL ?? '').trim()) {
      throw new Error('[privado] Falta la variable de entorno CIRCUITS_URL.');
    }
    const {circuits} = await getPrivadoSession();
    return circuits
      .createDownloader({
        zipUrl: CIRCUITS_URL.trim(),
        requiredCircuits: REQUIRED_CIRCUITS,
        onProgress: progress => {
          progressListeners.forEach(listener => listener(progress));
        },
      })
      .prepare();
  })().finally(() => {
    downloadPromise = null;
    progressListeners.clear();
  });
  return downloadPromise;
}
