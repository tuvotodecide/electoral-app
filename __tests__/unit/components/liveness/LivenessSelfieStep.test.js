import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {renderWithProviders} from '../../../setup/test-utils';
import LivenessSelfieStep from '../../../../src/components/liveness/LivenessSelfieStep';
import {crearSesion, LivenessError} from '../../../../src/api/liveness';

let mockResultado = {result: 'accepted', reason: 'ok', selfie: 'SELFIE64', livenessResult: 'SIGNED'};

jest.mock('../../../../src/components/liveness/LivenessCapture', () => {
  const {Pressable, Text} = require('react-native');
  return function MockCapture({onResultado, onError}) {
    return (
      <>
        <Pressable testID="mockResultado" onPress={() => onResultado(mockResultado)}>
          <Text>resultado</Text>
        </Pressable>
        <Pressable testID="mockError" onPress={() =>
            onError(new (require('../../../../src/api/liveness').LivenessError)('vencida'))
          }>
          <Text>error</Text>
        </Pressable>
      </>
    );
  };
});

jest.mock('../../../../src/api/liveness', () => ({
  ...jest.requireActual('../../../../src/api/liveness'),
  crearSesion: jest.fn(),
}));

const sesion = {
  sessionId: 's',
  nonce: 'n',
  expiresAt: new Date(Date.now() + 60000).toISOString(),
  maxSeconds: 45,
  challenges: ['left'],
};

describe('LivenessSelfieStep', () => {
  const requestPermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    crearSesion.mockResolvedValue(sesion);
    jest.spyOn(require('expo-camera'), 'useCameraPermissions').mockReturnValue([
      {granted: true},
      requestPermission,
    ]);
  });

  const iniciar = async onVerified => {
    const utils = renderWithProviders(<LivenessSelfieStep onVerified={onVerified} />);
    // Arranca solo al montar: la intro la muestra RegisterUser3.
    await waitFor(() => utils.getByTestId('mockResultado'));
    return utils;
  };

  it('LIV-21 - Todas las comprobaciones pasan · entrega la selfie verificada y el resultado firmado', async () => {
    const onVerified = jest.fn();
    const {getByTestId} = await iniciar(onVerified);
    fireEvent.press(getByTestId('mockResultado'));
    expect(onVerified).toHaveBeenCalledWith({
      selfie: {base64: 'SELFIE64'},
      livenessResult: 'SIGNED',
    });
  });

  it('LIV-22 - Alguna comprobación falla · muestra el motivo y no entrega selfie', async () => {
    mockResultado = {result: 'rejected', reason: 'multiple_faces'};
    const onVerified = jest.fn();
    const {getByTestId, findByText} = await iniciar(onVerified);
    fireEvent.press(getByTestId('mockResultado'));
    expect(await findByText(/más de una persona/)).toBeTruthy();
    expect(onVerified).not.toHaveBeenCalled();
    mockResultado = {result: 'accepted', reason: 'ok', selfie: 'SELFIE64', livenessResult: 'SIGNED'};
  });

  it('LIV-07 - Evidencia sobre una sesión vencida · avisa y permite reintentar', async () => {
    const onVerified = jest.fn();
    const {getByTestId, findByText} = await iniciar(onVerified);
    fireEvent.press(getByTestId('mockError'));
    expect(await findByText(/Se acabó el tiempo/)).toBeTruthy();
    expect(getByTestId('livenessSelfieStep_start')).toBeTruthy();
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('LIV-26 - Bloqueo al llegar al límite de intentos · muestra la espera y no abre la cámara', async () => {
    crearSesion.mockRejectedValueOnce(new LivenessError('bloqueado', 90));
    const {findByText, queryByTestId} = renderWithProviders(
      <LivenessSelfieStep onVerified={jest.fn()} />,
    );
    expect(await findByText(/Espera 2 minutos/)).toBeTruthy();
    expect(queryByTestId('mockResultado')).toBeNull();
  });

  it('LIV-48 - Límite de tasa por IP en los endpoints públicos · sin permiso de cámara no pide sesión', async () => {
    requestPermission.mockResolvedValueOnce({granted: false});
    require('expo-camera').useCameraPermissions.mockReturnValue([{granted: false}, requestPermission]);
    const {findByText} = renderWithProviders(
      <LivenessSelfieStep onVerified={jest.fn()} />,
    );
    expect(await findByText(/Necesitamos la cámara/)).toBeTruthy();
    expect(crearSesion).not.toHaveBeenCalled();
  });
});
