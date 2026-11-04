// Cliente de la verificación facial con prueba de vida (backend-identity).
// Los endpoints /liveness son públicos a propósito: la app no lleva ninguna
// clave para ellos. El servidor mide el movimiento y decide; la app solo
// toma las fotos y las manda.
import { BACKEND_IDENTITY } from '@env';
import * as SecureStore from 'expo-secure-store';

const TIMEOUT_MS = 10000;
// La subida lleva varias fotos: se le da más tiempo que a una petición simple.
const TIEMPO_EVIDENCIA_MS = 30000;
// Veces que se reenvía la misma evidencia si la red falla o tarda. Es seguro:
// si el servidor ya la decidió, devuelve la misma respuesta sin contar otro intento.
const REINTENTOS_EVIDENCIA = 2;
const PAUSA_REINTENTO_MS = 1500;

const CLAVE_DEVICE_ID = 'liveness_device_id';
const MOVIMIENTOS = new Set(['left', 'right', 'up', 'mouth', 'eyes']);

export class LivenessError extends Error {
  /**
   * @param {'sin_configurar'|'sin_conexion'|'lenta'|'limite'|'bloqueado'|'vencida'|'usada'|'servidor'} tipo
   * @param {number} [esperaSegundos]
   */
  constructor(tipo, esperaSegundos) {
    super(tipo);
    this.tipo = tipo;
    this.esperaSegundos = esperaSegundos;
  }
}

const esRegistro = valor => typeof valor === 'object' && valor !== null;

// Identificador del dispositivo para el límite de intentos del servidor. Se
// genera una vez y se guarda en el almacenamiento seguro del teléfono.
export async function obtenerDeviceId() {
  const guardado = await SecureStore.getItemAsync(CLAVE_DEVICE_ID);
  if (guardado) return guardado;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const nuevo = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(CLAVE_DEVICE_ID, nuevo);
  return nuevo;
}

async function post(ruta, cuerpo, tiempoMaximoMs = TIMEOUT_MS) {
  if (!BACKEND_IDENTITY) throw new LivenessError('sin_configurar');
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), tiempoMaximoMs);
  try {
    return await fetch(`${BACKEND_IDENTITY}${ruta}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: control.signal,
    });
  } catch {
    // Si saltó nuestro tiempo máximo, la conexión existe pero es lenta.
    throw new LivenessError(control.signal.aborted ? 'lenta' : 'sin_conexion');
  } finally {
    clearTimeout(temporizador);
  }
}

// Valida la forma de la respuesta: la app no da por buena una sesión rara.
function leerSesion(cuerpo) {
  if (
    !esRegistro(cuerpo) ||
    typeof cuerpo.sessionId !== 'string' ||
    typeof cuerpo.nonce !== 'string' ||
    typeof cuerpo.expiresAt !== 'string' ||
    typeof cuerpo.maxSeconds !== 'number' ||
    !Array.isArray(cuerpo.challenges) ||
    !cuerpo.challenges.every(m => typeof m === 'string' && MOVIMIENTOS.has(m))
  ) {
    throw new LivenessError('servidor');
  }
  return {
    sessionId: cuerpo.sessionId,
    nonce: cuerpo.nonce,
    expiresAt: cuerpo.expiresAt,
    maxSeconds: cuerpo.maxSeconds,
    challenges: cuerpo.challenges,
  };
}

/** Pide una sesión de verificación facial. */
export async function crearSesion() {
  const deviceId = await obtenerDeviceId();
  const respuesta = await post('/liveness/sessions', { deviceId });
  if (respuesta.status === 429) {
    let espera;
    try {
      const cuerpo = await respuesta.json();
      if (esRegistro(cuerpo) && typeof cuerpo.retryAfterSeconds === 'number') {
        espera = cuerpo.retryAfterSeconds;
      }
    } catch {
      // Sin cuerpo legible: se trata como límite de tasa.
    }
    throw new LivenessError(espera === undefined ? 'limite' : 'bloqueado', espera);
  }
  if (!respuesta.ok) throw new LivenessError('servidor');
  try {
    return leerSesion(await respuesta.json());
  } catch (error) {
    throw error instanceof LivenessError ? error : new LivenessError('servidor');
  }
}

function leerResultado(cuerpo) {
  if (
    !esRegistro(cuerpo) ||
    (cuerpo.result !== 'accepted' && cuerpo.result !== 'rejected') ||
    typeof cuerpo.reason !== 'string'
  ) {
    throw new LivenessError('servidor');
  }
  // Un "aceptado" sin resultado firmado ni selfie no es un aceptado.
  if (
    cuerpo.result === 'accepted' &&
    (typeof cuerpo.livenessResult !== 'string' || typeof cuerpo.selfie !== 'string')
  ) {
    throw new LivenessError('servidor');
  }
  return {
    result: cuerpo.result,
    reason: cuerpo.reason,
    livenessResult: typeof cuerpo.livenessResult === 'string' ? cuerpo.livenessResult : undefined,
    selfie: typeof cuerpo.selfie === 'string' ? cuerpo.selfie : undefined,
  };
}

/**
 * Envía la evidencia y devuelve la decisión del servidor. Ante un corte o una
 * espera larga reenvía el mismo cuerpo. `alReintentar` avisa a la pantalla.
 * @param {object} sesion
 * @param {string} referencia JPEG base64 de frente
 * @param {{challengePosition:number,image:string}[]} fotos
 * @param {() => void} [alReintentar]
 */
export async function enviarEvidencia(sesion, referencia, fotos, alReintentar) {
  let respuesta;
  for (let intento = 0; respuesta === undefined; intento++) {
    try {
      respuesta = await post(
        `/liveness/sessions/${sesion.sessionId}/evidence`,
        { nonce: sesion.nonce, referenceImage: referencia, frames: fotos },
        TIEMPO_EVIDENCIA_MS,
      );
    } catch (error) {
      const deRed =
        error instanceof LivenessError && (error.tipo === 'lenta' || error.tipo === 'sin_conexion');
      if (!deRed || intento >= REINTENTOS_EVIDENCIA) throw error;
      alReintentar?.();
      await new Promise(resolver => setTimeout(resolver, PAUSA_REINTENTO_MS));
    }
  }
  if (respuesta.status === 410) throw new LivenessError('vencida');
  if (respuesta.status === 409) throw new LivenessError('usada');
  if (respuesta.status === 429) throw new LivenessError('limite');
  if (!respuesta.ok) throw new LivenessError('servidor');
  try {
    return leerResultado(await respuesta.json());
  } catch (error) {
    throw error instanceof LivenessError ? error : new LivenessError('servidor');
  }
}

/** Mensaje para la persona según el tipo de error. */
export function mensajeErrorLiveness(error) {
  switch (error?.tipo) {
    case 'sin_configurar':
      return 'La app no tiene servidor configurado.';
    case 'sin_conexion':
      return 'Sin conexión. Revisa tu internet.';
    case 'lenta':
      return 'Conexión lenta. Busca mejor señal.';
    case 'limite':
      return 'Demasiados intentos. Espera un momento.';
    case 'vencida':
      return 'Se acabó el tiempo. Intenta de nuevo.';
    case 'usada':
      return 'Esta verificación ya se usó. Empieza otra.';
    case 'bloqueado': {
      const s = error.esperaSegundos ?? 0;
      return `Demasiados intentos. Espera ${s < 60 ? `${s} segundos` : `${Math.ceil(s / 60)} minutos`}.`;
    }
    default:
      return 'Algo salió mal. Inténtalo de nuevo.';
  }
}

/** El servidor da pocos motivos y generales a propósito. */
export function mensajeRechazoLiveness(motivo) {
  switch (motivo) {
    case 'multiple_faces':
      return 'Hay más de una persona. Quédate solo.';
    case 'reference_not_frontal':
      return 'Al empezar, mira de frente sin girar.';
    case 'movement_missing':
      return 'No vimos los movimientos. Hazlos con calma.';
    case 'no_signal':
      return 'No vimos tu rostro. Busca buena luz.';
    default:
      return 'No pudimos verificarte. Inténtalo de nuevo.';
  }
}
