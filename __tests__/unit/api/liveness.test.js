import * as SecureStore from 'expo-secure-store';
import {
  crearSesion,
  enviarEvidencia,
  obtenerDeviceId,
  LivenessError,
  mensajeErrorLiveness,
  mensajeRechazoLiveness,
} from '../../../src/api/liveness';

const sesionValida = {
  sessionId: 'sid-1',
  nonce: 'nonce-1',
  expiresAt: new Date(Date.now() + 60000).toISOString(),
  maxSeconds: 45,
  challenges: ['left', 'mouth'],
};

const respuesta = (status, cuerpo) => ({
  status,
  ok: status >= 200 && status < 300,
  json: jest.fn(async () => cuerpo),
});

const capturarError = async promesa => {
  try {
    await promesa;
  } catch (e) {
    return e;
  }
  return undefined;
};

describe('api/liveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue('device-abc');
    global.fetch = jest.fn();
  });

  describe('crearSesion', () => {
    it('LIV-01 - Crear sesión devuelve código de sesión, código de un solo uso, secuencia y tiempo máximo · sesión válida', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(200, sesionValida));
      const sesion = await crearSesion();
      expect(sesion).toEqual(sesionValida);
      const [url, opciones] = global.fetch.mock.calls[0];
      expect(url).toBe('https://identity.example/liveness/sessions');
      expect(opciones.method).toBe('POST');
      expect(JSON.parse(opciones.body)).toEqual({deviceId: 'device-abc'});
    });

    it('LIV-01 - Crear sesión devuelve código de sesión, código de un solo uso, secuencia y tiempo máximo · respuesta incompleta', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(200, {sessionId: 'x'}));
      const error = await capturarError(crearSesion());
      expect(error).toBeInstanceOf(LivenessError);
      expect(error.tipo).toBe('servidor');
    });

    it('LIV-02 - La secuencia incluye siempre un gesto y no repite movimientos · movimiento desconocido', async () => {
      global.fetch.mockResolvedValueOnce(
        respuesta(200, {...sesionValida, challenges: ['left', 'dance']}),
      );
      const error = await capturarError(crearSesion());
      expect(error.tipo).toBe('servidor');
    });

    it('LIV-09 - deviceId inválido al crear la sesión · se genera y guarda un deviceId hexadecimal', async () => {
      SecureStore.getItemAsync.mockResolvedValueOnce(null);
      const id = await obtenerDeviceId();
      expect(id).toMatch(/^[0-9a-f]{32}$/);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('liveness_device_id', id);
    });

    it('LIV-09 - deviceId inválido al crear la sesión · reutiliza el deviceId guardado', async () => {
      expect(await obtenerDeviceId()).toBe('device-abc');
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('LIV-26 - Bloqueo al llegar al límite de intentos · 429 con espera indica bloqueado', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(429, {retryAfterSeconds: 120}));
      const error = await capturarError(crearSesion());
      expect(error.tipo).toBe('bloqueado');
      expect(error.esperaSegundos).toBe(120);
      expect(mensajeErrorLiveness(error)).toContain('2 minutos');
    });

    it('LIV-48 - Límite de tasa por IP en los endpoints públicos · 429 sin espera indica límite', async () => {
      global.fetch.mockResolvedValueOnce({
        status: 429,
        ok: false,
        json: jest.fn(async () => {
          throw new Error('sin cuerpo');
        }),
      });
      const error = await capturarError(crearSesion());
      expect(error.tipo).toBe('limite');
    });

    it('LIV-23 - El servicio de detección no responde · error 500 se informa como servidor', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(500, {}));
      const error = await capturarError(crearSesion());
      expect(error.tipo).toBe('servidor');
    });

    it('LIV-23 - El servicio de detección no responde · sin conexión', async () => {
      global.fetch.mockRejectedValueOnce(new Error('network'));
      const error = await capturarError(crearSesion());
      expect(error.tipo).toBe('sin_conexion');
    });
  });

  describe('enviarEvidencia', () => {
    const fotos = [{challengePosition: 0, image: 'AAA'}];

    it('LIV-39 - Resultado aceptado incluye selfie y huella · devuelve selfie y resultado firmado', async () => {
      global.fetch.mockResolvedValueOnce(
        respuesta(200, {result: 'accepted', reason: 'ok', selfie: 'SELFIE', livenessResult: 'JWT'}),
      );
      const r = await enviarEvidencia(sesionValida, 'REF', fotos);
      expect(r).toEqual({result: 'accepted', reason: 'ok', selfie: 'SELFIE', livenessResult: 'JWT'});
      const [url, opciones] = global.fetch.mock.calls[0];
      expect(url).toBe('https://identity.example/liveness/sessions/sid-1/evidence');
      expect(JSON.parse(opciones.body)).toEqual({
        nonce: 'nonce-1',
        referenceImage: 'REF',
        frames: fotos,
      });
    });

    it('LIV-39 - Resultado aceptado incluye selfie y huella · aceptado sin resultado firmado se descarta', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(200, {result: 'accepted', reason: 'ok'}));
      const error = await capturarError(enviarEvidencia(sesionValida, 'REF', fotos));
      expect(error.tipo).toBe('servidor');
    });

    it('LIV-40 - Resultado rechazado no incluye selfie · rechazo sin selfie ni resultado firmado', async () => {
      global.fetch.mockResolvedValueOnce(
        respuesta(200, {result: 'rejected', reason: 'movement_missing'}),
      );
      const r = await enviarEvidencia(sesionValida, 'REF', fotos);
      expect(r.result).toBe('rejected');
      expect(r.selfie).toBeUndefined();
      expect(r.livenessResult).toBeUndefined();
    });

    it('LIV-07 - Evidencia sobre una sesión vencida · 410 indica vencida', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(410, {}));
      const error = await capturarError(enviarEvidencia(sesionValida, 'REF', fotos));
      expect(error.tipo).toBe('vencida');
    });

    it('LIV-05 - El código de un solo uso no se puede reutilizar · 409 indica usada', async () => {
      global.fetch.mockResolvedValueOnce(respuesta(409, {}));
      const error = await capturarError(enviarEvidencia(sesionValida, 'REF', fotos));
      expect(error.tipo).toBe('usada');
    });

    it('LIV-31 - Reintento idéntico por respuesta perdida · reenvía el mismo cuerpo tras un corte', async () => {
      jest.useFakeTimers();
      try {
        global.fetch
          .mockRejectedValueOnce(new Error('corte'))
          .mockResolvedValueOnce(
            respuesta(200, {result: 'accepted', reason: 'ok', selfie: 'S', livenessResult: 'J'}),
          );
        const alReintentar = jest.fn();
        const promesa = enviarEvidencia(sesionValida, 'REF', fotos, alReintentar);
        await jest.advanceTimersByTimeAsync(2000);
        const r = await promesa;
        expect(r.result).toBe('accepted');
        expect(alReintentar).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch.mock.calls[1][1].body).toBe(global.fetch.mock.calls[0][1].body);
      } finally {
        jest.useRealTimers();
      }
    });

    it('LIV-31 - Reintento idéntico por respuesta perdida · tras agotar los reintentos informa sin conexión', async () => {
      jest.useFakeTimers();
      try {
        global.fetch.mockRejectedValue(new Error('corte'));
        const promesa = capturarError(enviarEvidencia(sesionValida, 'REF', fotos));
        await jest.advanceTimersByTimeAsync(10000);
        const error = await promesa;
        expect(error.tipo).toBe('sin_conexion');
        expect(global.fetch).toHaveBeenCalledTimes(3);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('mensajes', () => {
    it('LIV-22 - Alguna comprobación falla · cada motivo de rechazo tiene un mensaje propio', () => {
      const generico = mensajeRechazoLiveness('otro');
      for (const motivo of ['multiple_faces', 'reference_not_frontal', 'movement_missing', 'no_signal']) {
        expect(mensajeRechazoLiveness(motivo)).not.toBe(generico);
      }
    });

    it('LIV-26 - Bloqueo al llegar al límite de intentos · espera corta se muestra en segundos', () => {
      expect(mensajeErrorLiveness(new LivenessError('bloqueado', 30))).toContain('30 segundos');
    });
  });
});
