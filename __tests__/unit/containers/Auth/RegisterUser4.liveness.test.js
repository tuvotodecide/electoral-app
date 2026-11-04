import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser4 from '../../../../src/container/Auth/RegisterUser4';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/components/liveness/LivenessCapture', () => {
  const {Pressable, Text} = require('react-native');
  return function MockCapture({onResultado}) {
    return (
      <Pressable
        testID="mockCapture"
        onPress={() =>
          onResultado({result: 'accepted', reason: 'ok', selfie: 'SELFIE64', livenessResult: 'SIGNED'})
        }>
        <Text>capture</Text>
      </Pressable>
    );
  };
});

jest.mock('../../../../src/api/liveness', () => ({
  ...jest.requireActual('../../../../src/api/liveness'),
  crearSesion: jest.fn(async () => ({
    sessionId: 's',
    nonce: 'n',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    maxSeconds: 45,
    challenges: ['left'],
  })),
}));

describe('RegisterUser4 con prueba de vida', () => {
  beforeEach(() => {
    configurarMocksRegistro();
    jest.spyOn(require('expo-camera'), 'useCameraPermissions').mockReturnValue([
      {granted: true},
      jest.fn(),
    ]);
  });

  it('pasa la selfie verificada y el resultado firmado a RegisterUser5', async () => {
    const route = {params: {dni: '123', frontImage: {uri: 'f'}, backImage: {uri: 'b'}}};
    const {getByTestId} = renderWithProviders(
      <RegisterUser4 navigation={mockNavigation} route={route} />,
    );
    // La verificación arranca sola al montar el paso (la intro es RegisterUser3).
    await waitFor(() => getByTestId('mockCapture'));
    fireEvent.press(getByTestId('mockCapture'));
    await waitFor(() =>
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        AuthNav.RegisterUser5,
        expect.objectContaining({
          selfie: {base64: 'SELFIE64'},
          livenessResult: 'SIGNED',
        }),
      ),
    );
  });
});
