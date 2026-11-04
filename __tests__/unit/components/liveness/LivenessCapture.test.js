import React from 'react';
import {act, render} from '@testing-library/react-native';
import {ImageManipulator} from 'expo-image-manipulator';
import LivenessCapture from '../../../../src/components/liveness/LivenessCapture';
import {enviarEvidencia} from '../../../../src/api/liveness';

jest.mock('../../../../src/api/liveness', () => ({
  ...jest.requireActual('../../../../src/api/liveness'),
  enviarEvidencia: jest.fn(),
}));

const sesionCon = (challenges, ms = 600000) => ({
  sessionId: 's',
  nonce: 'n',
  expiresAt: new Date(Date.now() + ms).toISOString(),
  maxSeconds: 45,
  challenges,
});

const aceptado = {result: 'accepted', reason: 'ok', selfie: 'S', livenessResult: 'J'};

describe('LivenessCapture', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    ImageManipulator.manipulate.mockImplementation(() => ({
      resize: () => ({
        renderAsync: async () => ({
          saveAsync: async () => ({uri: 'file://r.jpg', base64: 'B64'}),
        }),
      }),
    }));
    enviarEvidencia.mockResolvedValue(aceptado);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const montar = async (sesion, props = {}) => {
    const utils = render(
      <LivenessCapture sesion={sesion} onResultado={jest.fn()} onError={jest.fn()} {...props} />,
    );
    await act(async () => {
      utils.getByTestId('mockCamera').props.onCameraReady();
      await jest.advanceTimersByTimeAsync(20000);
    });
    return utils;
  };

  it('LIV-12 - Cantidad de fotos y posición de reto inválidas · envía referencia y 3 fotos por reto con su posición', async () => {
    const onResultado = jest.fn();
    await montar(sesionCon(['left', 'mouth']), {onResultado});

    expect(enviarEvidencia).toHaveBeenCalledTimes(1);
    const [sesion, referencia, fotos] = enviarEvidencia.mock.calls[0];
    expect(sesion.sessionId).toBe('s');
    expect(referencia).toBe('B64');
    expect(fotos).toHaveLength(6);
    expect(fotos.map(f => f.challengePosition)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(onResultado).toHaveBeenCalledWith(aceptado);
  });

  it('LIV-21 - Todas las comprobaciones pasan · inicia la captura una sola vez aunque la cámara avise dos veces', async () => {
    const utils = await montar(sesionCon(['left']));
    await act(async () => {
      utils.getByTestId('mockCamera').props.onCameraReady();
      await jest.advanceTimersByTimeAsync(20000);
    });
    expect(enviarEvidencia).toHaveBeenCalledTimes(1);
  });

  it('LIV-07 - Evidencia sobre una sesión vencida · no captura ni envía si la sesión ya venció', async () => {
    const onError = jest.fn();
    await montar(sesionCon(['left'], -1000), {onError});

    expect(enviarEvidencia).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0].tipo).toBe('vencida');
  });

  it('LIV-23 - El servicio de detección no responde · error al enviar se informa a la pantalla', async () => {
    const {LivenessError} = require('../../../../src/api/liveness');
    enviarEvidencia.mockRejectedValueOnce(new LivenessError('sin_conexion'));
    const onError = jest.fn();
    const onResultado = jest.fn();
    await montar(sesionCon(['left']), {onError, onResultado});

    expect(onError.mock.calls[0][0].tipo).toBe('sin_conexion');
    expect(onResultado).not.toHaveBeenCalled();
  });

  it('LIV-23 - El servicio de detección no responde · error desconocido se trata como servidor', async () => {
    enviarEvidencia.mockRejectedValueOnce(new Error('boom'));
    const onError = jest.fn();
    await montar(sesionCon(['left']), {onError});
    expect(onError.mock.calls[0][0].tipo).toBe('servidor');
  });

  it('LIV-29 - Fin del tiempo de espera · al desmontar no se llama a los callbacks', async () => {
    const onResultado = jest.fn();
    const onError = jest.fn();
    const utils = render(
      <LivenessCapture sesion={sesionCon(['left'])} onResultado={onResultado} onError={onError} />,
    );
    await act(async () => {
      utils.getByTestId('mockCamera').props.onCameraReady();
      await jest.advanceTimersByTimeAsync(500);
    });
    utils.unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(20000);
    });
    expect(enviarEvidencia).not.toHaveBeenCalled();
    expect(onResultado).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
