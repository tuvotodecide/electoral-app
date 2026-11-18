import React from 'react';
import {fireEvent, waitFor} from '@testing-library/react-native';
import {
  IdentityApiUnreachableError,
  RegistryRegistrationError,
  VaultError,
  createMockSession,
} from '@privado-id/expo-sdk';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav} from '../../../../src/navigation/NavigationKey';
import RegisterUser10 from '../../../../src/container/Auth/RegisterUser10';
import Strings from '../../../../src/i18n/String';
import {
  saveDraft,
  clearDraft,
  getDraft,
  updateDraft,
} from '../../../../src/utils/RegisterDraft';
import {claimRegisterRewardIfAvailable} from '../../../../src/utils/account';
import {getPrivadoSession} from '../../../../src/services/privado/privadoSession';
import {vaultUnlockProvider} from '../../../../src/services/privado/vaultUnlock';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../src/utils/account', () => ({
  claimRegisterRewardIfAvailable: jest.fn(async () => ({ok: true})),
}));

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoSession: jest.fn(),
}));

const ACCOUNT = '0x00000000000000000000000000000000000000aa';
const HOLDER = {
  did: 'did:iden3:base:sepolia:2qHolder',
  keyId: 'BJJ:holder',
  wallet: {address: ACCOUNT},
  isNew: true,
};
const IDENTITY_DATA = {
  numeroDoc: '00000000',
  fullName: 'Ana Pérez',
  fechaNacimiento: '1990-01-02',
};

const baseRouteParams = {
  ocrData: {numeroDoc: '00000000'},
  dni: '00000000',
  originalPin: '1234',
  useBiometry: false,
  identityData: IDENTITY_DATA,
  identityToken: 'header.claims.signature',
  identityTokenExpiresAt: '2026-11-07T12:10:00.000Z',
};

describe('RegisterUser10', () => {
  let session;
  let pinSeenWhileCreating;

  beforeEach(() => {
    jest.useRealTimers();
    configurarMocksRegistro();
    claimRegisterRewardIfAvailable.mockReset();
    claimRegisterRewardIfAvailable.mockResolvedValue({ok: true});

    session = createMockSession();
    pinSeenWhileCreating = undefined;
    // Como el SDK real: la primera clave privada pide al proveedor el PIN del vault.
    session.client.createOrLoadHolderDid = jest.fn(async () => {
      pinSeenWhileCreating = await vaultUnlockProvider({purpose: 'create', biometricsEnabled: false});
      return HOLDER;
    });
    session.client.claimCredentialFromIssuer = jest.fn(async () => ({stored: true}));
    session.client.createBackup = jest.fn(async () => 'privado-id-backup:1:mock');
    session.client.registerAccount = jest.fn(async () => ({
      id: HOLDER.did,
      did: HOLDER.did,
      accountAddress: ACCOUNT,
    }));
    getPrivadoSession.mockResolvedValue(session);
  });

  const renderScreen = (params = baseRouteParams) => {
    const localNavigation = {...mockNavigation, replace: jest.fn(), reset: jest.fn()};
    const screen = renderWithProviders(
      <RegisterUser10 navigation={localNavigation} route={{params}} />,
    );
    return {...screen, localNavigation};
  };

  it('crea el titular con el PIN, reclama la credencial, registra la cuenta y va a RegisterUser11', async () => {
    const {localNavigation} = renderScreen();

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser11, {
        account: ACCOUNT,
      });
    });

    expect(session.client.createOrLoadHolderDid).toHaveBeenCalledWith({smartWallet: true});
    expect(pinSeenWhileCreating).toEqual({type: 'pin', pin: '1234'});
    expect(session.client.requestIdentityCredential).toHaveBeenCalledWith({
      data: IDENTITY_DATA,
      identityToken: baseRouteParams.identityToken,
    });
    expect(session.client.claimCredentialFromIssuer).toHaveBeenCalledWith({
      offer: 'iden3comm://?request_uri=https%3A%2F%2Fissuer.example%2Fqr',
    });
    expect(session.client.createBackup).toHaveBeenCalledWith('1234');
    expect(session.client.registerAccount).toHaveBeenCalledWith({
      identityToken: baseRouteParams.identityToken,
      backup: 'privado-id-backup:1:mock',
    });
    expect(claimRegisterRewardIfAvailable).toHaveBeenCalledWith(ACCOUNT);
    expect(session.vault.enableBiometrics).not.toHaveBeenCalled();
    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        dni: '00000000',
        originalPin: '1234',
        identityToken: baseRouteParams.identityToken,
        identityData: IDENTITY_DATA,
        progress: {},
      }),
    );
    expect(updateDraft).toHaveBeenLastCalledWith({
      progress: {credentialClaimed: true, registered: true, rewardClaimed: true},
    });
    expect(clearDraft).toHaveBeenCalled();
  });

  it('activa la biometría cuando el usuario la eligió', async () => {
    const {localNavigation} = renderScreen({...baseRouteParams, useBiometry: true});
    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser11, {account: ACCOUNT});
    });
    expect(session.vault.enableBiometrics).toHaveBeenCalledTimes(1);
  });

  it('si el usuario cancela la biometría muestra el mensaje y reintenta', async () => {
    session.vault.enableBiometrics.mockRejectedValueOnce(
      new VaultError('BIOMETRICS_CANCELLED', 'cancelled'),
    );
    const {getByText, getByTestId, localNavigation} = renderScreen({
      ...baseRouteParams,
      useBiometry: true,
    });

    await waitFor(() => expect(getByText(Strings.biometricRejected)).toBeTruthy());
    expect(session.client.registerAccount).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('infoModalButton'));
    expect(localNavigation.replace).toHaveBeenCalledWith(
      AuthNav.RegisterUser10,
      expect.objectContaining({originalPin: '1234', useBiometry: true}),
    );
  });

  it('al reintentar salta los pasos ya hechos del mismo DNI', async () => {
    getDraft.mockResolvedValueOnce({
      dni: '00000000',
      progress: {credentialClaimed: true, registered: true},
    });
    const {localNavigation} = renderScreen();

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser11, {account: ACCOUNT});
    });
    expect(session.client.requestIdentityCredential).not.toHaveBeenCalled();
    expect(session.client.claimCredentialFromIssuer).not.toHaveBeenCalled();
    expect(session.client.registerAccount).not.toHaveBeenCalled();
    expect(claimRegisterRewardIfAvailable).toHaveBeenCalledWith(ACCOUNT);
  });

  it('ignora el progreso de un borrador de otro DNI', async () => {
    getDraft.mockResolvedValueOnce({dni: '99999999', progress: {registered: true}});
    const {localNavigation} = renderScreen();
    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser11, {account: ACCOUNT});
    });
    expect(session.client.registerAccount).toHaveBeenCalledTimes(1);
  });

  it('si falla la recompensa conserva el registro hecho y permite reintento', async () => {
    claimRegisterRewardIfAvailable.mockRejectedValueOnce(new Error('Error al reclamar recompensa'));
    const {getByTestId, getByText, localNavigation} = renderScreen();

    await waitFor(() => expect(getByText('Error al reclamar recompensa')).toBeTruthy());
    expect(updateDraft).toHaveBeenLastCalledWith({
      progress: {credentialClaimed: true, registered: true},
    });
    expect(clearDraft).not.toHaveBeenCalled();
    expect(localNavigation.replace).not.toHaveBeenCalledWith(AuthNav.RegisterUser11, expect.anything());

    fireEvent.press(getByTestId('infoModalButton'));
    expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser10, {
      ocrData: baseRouteParams.ocrData,
      dni: baseRouteParams.dni,
      originalPin: baseRouteParams.originalPin,
      useBiometry: baseRouteParams.useBiometry,
      identityData: IDENTITY_DATA,
      identityToken: baseRouteParams.identityToken,
      identityTokenExpiresAt: baseRouteParams.identityTokenExpiresAt,
    });
  });

  it('si el token de identidad expiró pide repetir la verificación del carnet', async () => {
    session.client.registerAccount.mockRejectedValueOnce(
      new RegistryRegistrationError('identity-invalid'),
    );
    const {getByTestId, getByText, localNavigation} = renderScreen();

    await waitFor(() => expect(getByText(/La verificación de tu carnet expiró/)).toBeTruthy());
    fireEvent.press(getByTestId('infoModalButton'));
    expect(localNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: AuthNav.RegisterUser2}],
    });
  });

  it('si el PIN no abre el vault de un intento anterior vuelve a RegisterUser8', async () => {
    session.client.createOrLoadHolderDid.mockRejectedValueOnce(
      new VaultError('INVALID_PIN', 'The PIN is incorrect.'),
    );
    const {getByTestId, getByText, localNavigation} = renderScreen();

    await waitFor(() => expect(getByText(/El PIN no coincide/)).toBeTruthy());
    fireEvent.press(getByTestId('infoModalButton'));
    expect(localNavigation.replace).toHaveBeenCalledWith(
      AuthNav.RegisterUser8,
      expect.objectContaining({
        dni: '00000000',
        identityData: IDENTITY_DATA,
        identityToken: baseRouteParams.identityToken,
      }),
    );
  });

  it('sin conexión muestra el error de red', async () => {
    session.client.requestIdentityCredential.mockRejectedValueOnce(
      new IdentityApiUnreachableError('credentials/identity', new Error('Network request failed')),
    );
    const {getByText} = renderScreen();
    await waitFor(() => expect(getByText(Strings.networkError)).toBeTruthy());
    expect(session.client.registerAccount).not.toHaveBeenCalled();
  });

  it('si la credencial no se guardó no registra la cuenta', async () => {
    session.client.claimCredentialFromIssuer.mockResolvedValueOnce({stored: false});
    const {getByText} = renderScreen();
    await waitFor(() =>
      expect(getByText('No se pudo guardar tu credencial de identidad.')).toBeTruthy(),
    );
    expect(session.client.registerAccount).not.toHaveBeenCalled();
  });

  it('con fromDraft usa el progreso de los parámetros', async () => {
    const {localNavigation} = renderScreen({
      ...baseRouteParams,
      fromDraft: true,
      progress: {credentialClaimed: true},
    });
    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.RegisterUser11, {account: ACCOUNT});
    });
    expect(getDraft).not.toHaveBeenCalled();
    expect(session.client.claimCredentialFromIssuer).not.toHaveBeenCalled();
    expect(session.client.registerAccount).toHaveBeenCalledTimes(1);
  });

  it('al volver de background reintenta con el draft guardado', async () => {
    const resumeDraft = {
      step: 'issueVC',
      dni: '22222222',
      originalPin: '1234',
      useBiometry: false,
      ocrData: {numeroDoc: '22222222'},
      progress: {credentialClaimed: true},
    };
    getDraft.mockResolvedValueOnce(null).mockResolvedValueOnce(resumeDraft);
    saveDraft.mockImplementationOnce(() => new Promise(() => {}));

    const ReactNative = require('react-native');
    let appStateListener;
    ReactNative.AppState.addEventListener.mockImplementationOnce((_evt, callback) => {
      appStateListener = callback;
      return {remove: jest.fn()};
    });

    const {localNavigation} = renderScreen();

    await waitFor(() => expect(typeof appStateListener).toBe('function'));
    appStateListener('background');
    appStateListener('active');

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(
        AuthNav.RegisterUser10,
        expect.objectContaining({...resumeDraft, fromDraft: true}),
      );
    });
  });
});
