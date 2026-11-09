import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import {UserDataBackupError, VaultError, createMockSession} from '@privado-id/expo-sdk';
import * as LocalAuthentication from 'expo-local-authentication';
import {configurarMocksRegistro} from './helpers/registrationFlow.shared';
import {AuthNav, StackNav} from '../../../../src/navigation/NavigationKey';
import LoginUser from '../../../../src/container/Auth/LoginUser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {incAttempts, isLocked, resetAttempts} from '../../../../src/utils/PinAttempts';
import {mockNavigation, renderWithProviders} from '../../../setup/test-utils';
import Strings from '../../../../src/i18n/String';
import {DEMO_PIN} from '../../../../src/features/demo/demoConfig';
import {
  __resetDemoSessionForTests,
  startDemoSession,
} from '../../../../src/features/demo/demoSession';
import {activateDemoSession} from '../../../../src/features/demo/demoLifecycle';
import {consumeHomeEntryFromLogin} from '../../../../src/utils/homeEntry';
import {captureError} from '../../../../src/config/sentry';
import {REGISTRY_BACKUP_PENDING_KEY} from '../../../../src/services/privado/registryBackupSync';
import {
  getPrivadoClient,
  getPrivadoVault,
} from '../../../../src/services/privado/privadoSession';

jest.mock('../../../../src/config/sentry', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../src/features/demo/demoLifecycle', () => ({
  activateDemoSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoClient: jest.fn(),
  getPrivadoVault: jest.fn(),
}));

const ACCOUNT = '0x00000000000000000000000000000000000000aa';
const HOLDER = {
  did: 'did:iden3:base:sepolia:2qHolder',
  keyId: 'BJJ:holder',
  wallet: {address: ACCOUNT},
};
const IDENTITY_VC = {
  id: 'urn:uuid:person',
  type: ['VerifiableCredential', 'PersonCredential'],
  credentialSubject: {
    id: HOLDER.did,
    fullName: 'Ana Pérez',
    nationalIdNumber: '00000000',
    birthDate: 631152000,
  },
};

describe('LoginUser', () => {
  let session;
  let vault;
  let client;
  let localNavigation;

  const renderLogin = (params = {}) =>
    renderWithProviders(
      <LoginUser navigation={localNavigation} route={{params}} />,
    );

  const typePin = async (getByTestId, pin = '1234') => {
    await waitFor(() => {
      expect(getByTestId('textInput')).toBeTruthy();
    });
    fireEvent.changeText(getByTestId('textInput'), pin);
  };

  beforeEach(() => {
    configurarMocksRegistro();
    AsyncStorage.multiSet = jest.fn(() => Promise.resolve());
    AsyncStorage.setItem = jest.fn(() => Promise.resolve());
    AsyncStorage.getItem = jest.fn(() => Promise.resolve(null));
    AsyncStorage.removeItem = jest.fn(() => Promise.resolve());
    __resetDemoSessionForTests();

    session = createMockSession();
    vault = session.vault;
    client = session.client;
    client.getHolderDid.mockResolvedValue(HOLDER);
    client.getCredentialByType.mockResolvedValue(IDENTITY_VC);
    getPrivadoVault.mockResolvedValue(vault);
    getPrivadoClient.mockResolvedValue(client);

    localNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      replace: jest.fn(),
      reset: jest.fn(),
    };
  });

  it('renderiza y navega a SelectRecuperation desde olvide mi PIN', async () => {
    const {getByTestId} = renderLogin();

    await waitFor(() => {
      expect(getByTestId('loginUserForgotPasswordButton')).toBeTruthy();
    });
    fireEvent.press(getByTestId('loginUserForgotPasswordButton'));

    expect(localNavigation.navigate).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
  });

  it('redirige a AccountLock cuando el usuario esta bloqueado', async () => {
    isLocked.mockResolvedValueOnce(true);
    renderLogin();

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.AccountLock);
    });
  });

  it('con el PIN correcto abre el vault, carga la credencial por tipo y entra', async () => {
    const {getByTestId} = renderLogin();
    await typePin(getByTestId, '1234');

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
    expect(vault.unlock).toHaveBeenCalledWith({type: 'pin', pin: '1234'});
    expect(client.getCredentialByType).toHaveBeenCalledWith('PersonCredential');
    expect(resetAttempts).toHaveBeenCalled();

    expect(JSON.parse(AsyncStorage.setItem.mock.calls.find(([k]) => k === 'FINLINE_FLAGS')[1]))
      .toMatchObject({BIO_ENABLED: false, HAS_WALLET: true});
  });

  it('con el PIN reintenta subir el respaldo del registro si quedó pendiente', async () => {
    AsyncStorage.getItem = jest.fn(key =>
      Promise.resolve(key === REGISTRY_BACKUP_PENDING_KEY ? '1' : null),
    );
    const {getByTestId} = renderLogin();
    await typePin(getByTestId, '1234');

    await waitFor(() => {
      expect(client.updateRegistryProfile).toHaveBeenCalledWith({
        backup: 'privado-id-backup:1:mock',
      });
    });
    expect(client.createBackup).toHaveBeenCalledWith('1234');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(REGISTRY_BACKUP_PENDING_KEY);
  });

  it('si el reintento del respaldo falla, entra igual y lo informa', async () => {
    AsyncStorage.getItem = jest.fn(key =>
      Promise.resolve(key === REGISTRY_BACKUP_PENDING_KEY ? '1' : null),
    );
    const error = new Error('offline');
    client.updateRegistryProfile.mockRejectedValue(error);
    const {getByTestId} = renderLogin();
    await typePin(getByTestId, '1234');

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
    await waitFor(() => {
      expect(captureError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({step: 'syncPendingRegistryBackup', critical: false}),
      );
    });
  });

  it('sin respaldo pendiente no crea ni sube respaldos al entrar', async () => {
    const {getByTestId} = renderLogin();
    await typePin(getByTestId, '1234');

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalled();
    });
    expect(client.createBackup).not.toHaveBeenCalled();
    expect(client.updateRegistryProfile).not.toHaveBeenCalled();
  });

  it('con la biometría activada abre el vault con ella y entra', async () => {
    vault.isBiometricsEnabled.mockResolvedValue(true);
    LocalAuthentication.supportedAuthenticationTypesAsync.mockResolvedValueOnce([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    renderLogin();

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: StackNav.TabNavigation}],
      });
    });
    expect(vault.unlock).toHaveBeenCalledWith({
      type: 'biometrics',
      prompt: 'Escanea tu rostro',
    });
    // Home debe cargar las elecciones desde la API en primer plano.
    expect(consumeHomeEntryFromLogin()).toBe(true);
  });

  it('sin biometría activada no la pide y espera el PIN', async () => {
    const {getByTestId} = renderLogin();
    await waitFor(() => {
      expect(getByTestId('textInput')).toBeTruthy();
    });
    await waitFor(() => {
      expect(vault.isBiometricsEnabled).toHaveBeenCalled();
    });
    expect(vault.unlock).not.toHaveBeenCalled();
    expect(localNavigation.reset).not.toHaveBeenCalled();
  });

  it('si el usuario cancela la biometría queda el PIN, sin aviso', async () => {
    vault.isBiometricsEnabled.mockResolvedValue(true);
    vault.unlock.mockRejectedValueOnce(new VaultError('BIOMETRICS_CANCELLED', 'cancelled'));

    const {getByTestId} = renderLogin();

    await waitFor(() => {
      expect(vault.unlock).toHaveBeenCalledTimes(1);
    });
    expect(getByTestId('loginUserInfoModal').props.visible).toBe(false);
    expect(captureError).not.toHaveBeenCalled();
    expect(localNavigation.reset).not.toHaveBeenCalled();
  });

  it('si la biometría del dispositivo cambió pide el PIN', async () => {
    vault.isBiometricsEnabled.mockResolvedValue(true);
    vault.unlock.mockRejectedValueOnce(new VaultError('BIOMETRICS_INVALIDATED', 'changed'));

    const {findByText} = renderLogin();

    expect(await findByText(/La biometría de tu dispositivo cambió/)).toBeTruthy();
    expect(localNavigation.reset).not.toHaveBeenCalled();
  });

  it('si falta la credencial de identidad avisa, vuelve a bloquear y no entra', async () => {
    vault.isBiometricsEnabled.mockResolvedValue(true);
    client.getCredentialByType.mockResolvedValue(undefined);
    client.getCredentials.mockResolvedValue([
      {id: 'x', type: ['VerifiableCredential', 'Other'], proofTypes: []},
    ]);

    const {findByText} = renderLogin();

    expect(await findByText(Strings.noBiometricData)).toBeTruthy();
    expect(vault.lock).toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({message: expect.stringContaining('solo hay Other')}),
      expect.objectContaining({step: 'load_identity_credential'}),
    );
    expect(localNavigation.reset).not.toHaveBeenCalled();
  });

  it('al llegar al limite de intentos muestra modal y redirige a recuperacion', async () => {
    incAttempts.mockResolvedValueOnce(5);
    vault.unlock.mockRejectedValueOnce(new VaultError('INVALID_PIN', 'wrong pin'));

    const {findByText, getByTestId} = renderLogin();
    await typePin(getByTestId);

    expect(await findByText(/Has agotado tus 5 intentos/i)).toBeTruthy();
    expect(getByTestId('loginUserInfoModal').props.visible).toBe(true);

    act(() => {
      getByTestId('loginUserInfoModalButton').props.onPress();
    });

    await waitFor(() => {
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
    });
  });

  it('con un PIN incorrecto indica los intentos restantes', async () => {
    incAttempts.mockResolvedValueOnce(2);
    vault.unlock.mockRejectedValueOnce(new VaultError('INVALID_PIN', 'wrong pin'));

    const {findByText, getByTestId} = renderLogin();
    await typePin(getByTestId);

    expect(await findByText(/Te quedan 3 intentos/)).toBeTruthy();
    expect(client.getCredentialByType).not.toHaveBeenCalled();
  });

  it('si no hay vault en el dispositivo redirige al registro inicial', async () => {
    vault.exists.mockResolvedValue(false);

    const {findByText, getByTestId} = renderLogin();
    await typePin(getByTestId);

    expect(await findByText(Strings.notRegistered)).toBeTruthy();
    expect(getByTestId('loginUserInfoModal').props.visible).toBe(true);

    act(() => {
      getByTestId('loginUserInfoModalButton').props.onPress();
    });

    await waitFor(() => {
      expect(localNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [
          {
            name: StackNav.AuthNavigation,
            params: {screen: AuthNav.RegisterUser1},
          },
        ],
      });
    });
    expect(vault.unlock).not.toHaveBeenCalled();
  });

  describe('tras la recuperación con carnet', () => {
    const STORED_BACKUP = {
      backup: 'privado-id-backup:1:header:ciphertext',
      discoverableHash: '0xhash',
      storedAt: '2026-11-07T12:00:00.000Z',
      isPrivadoBackup: true,
    };
    const recoveryParams = {isCIRecovery: true, dni: '00000000'};

    beforeEach(() => {
      client.getStoredRegistryBackup.mockResolvedValue(STORED_BACKUP);
    });

    it('restaura el respaldo con el PIN, lo borra y entra', async () => {
      const {getByTestId} = renderLogin(recoveryParams);
      await typePin(getByTestId, '4821');

      await waitFor(() => {
        expect(localNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
      });
      expect(client.restoreBackup).toHaveBeenCalledWith(STORED_BACKUP.backup, '4821', {
        replaceExisting: true,
      });
      expect(client.deleteStoredRegistryBackup).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('FINLINE_FLAGS');
      expect(client.getCredentialByType).toHaveBeenCalledWith('PersonCredential');
      // El vault queda abierto al restaurar: no se pide de nuevo el PIN ni la
      // biometría.
      expect(vault.unlock).not.toHaveBeenCalled();
    });

    it('con un PIN incorrecto cuenta el intento y conserva el respaldo', async () => {
      incAttempts.mockResolvedValueOnce(1);
      client.restoreBackup.mockRejectedValueOnce(
        new UserDataBackupError('INVALID_BACKUP_PASSWORD', 'wrong password'),
      );

      const {findByText, getByTestId} = renderLogin(recoveryParams);
      await typePin(getByTestId);

      expect(await findByText(/Te quedan 4 intentos/)).toBeTruthy();
      expect(client.deleteStoredRegistryBackup).not.toHaveBeenCalled();
      expect(localNavigation.reset).not.toHaveBeenCalled();
    });

    it('sin respaldo ni vault pide repetir la recuperación', async () => {
      client.getStoredRegistryBackup.mockResolvedValue(undefined);
      vault.exists.mockResolvedValue(false);

      const {findByText, getByTestId} = renderLogin(recoveryParams);
      await typePin(getByTestId);

      expect(await findByText(/No encontramos el respaldo de tu cuenta/)).toBeTruthy();
      act(() => {
        getByTestId('loginUserInfoModalButton').props.onPress();
      });
      expect(localNavigation.replace).toHaveBeenCalledWith(AuthNav.SelectRecuperation);
      expect(client.restoreBackup).not.toHaveBeenCalled();
    });

    it('sin respaldo pero con vault (ya restaurado) entra con el PIN', async () => {
      client.getStoredRegistryBackup.mockResolvedValue(undefined);

      const {getByTestId} = renderLogin(recoveryParams);
      await typePin(getByTestId, '4821');

      await waitFor(() => {
        expect(localNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{name: StackNav.TabNavigation}],
        });
      });
      expect(vault.unlock).toHaveBeenCalledWith({type: 'pin', pin: '4821'});
      expect(client.restoreBackup).not.toHaveBeenCalled();
    });

    it('con un respaldo de otro formato avisa y no restaura', async () => {
      client.getStoredRegistryBackup.mockResolvedValue({...STORED_BACKUP, isPrivadoBackup: false});

      const {findByText, getByTestId} = renderLogin(recoveryParams);
      await typePin(getByTestId);

      expect(await findByText(/No pudimos restaurar el respaldo/)).toBeTruthy();
      expect(client.restoreBackup).not.toHaveBeenCalled();
      expect(captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({step: 'restore_registry_backup'}),
      );
    });
  });

  it('si el vault falla de forma inesperada muestra modal de contingencia', async () => {
    vault.unlock.mockRejectedValueOnce(new VaultError('VAULT_CORRUPTED', 'broken'));

    const {findByText, getByTestId} = renderLogin();
    await typePin(getByTestId);

    expect(
      await findByText(/Ocurrió un error inesperado al verificar tu credencial/i),
    ).toBeTruthy();
  });

  describe('bypass del modo demostración', () => {
    it('activa la demo con el PIN demo cuando NO hay billetera local', async () => {
      await startDemoSession();
      vault.exists.mockResolvedValue(false);

      const {getByTestId} = renderLogin();
      await typePin(getByTestId, DEMO_PIN);

      await waitFor(() => {
        expect(activateDemoSession).toHaveBeenCalledTimes(1);
      });
      expect(vault.unlock).not.toHaveBeenCalled();
    });

    it('NO eclipsa a un usuario real cuyo PIN coincida con el demo', async () => {
      // El caso peligroso: billetera real presente y PIN igual al de la demo.
      await startDemoSession();

      const {getByTestId} = renderLogin();
      await typePin(getByTestId, DEMO_PIN);

      await waitFor(() => {
        expect(vault.unlock).toHaveBeenCalledWith({type: 'pin', pin: DEMO_PIN});
      });
      expect(activateDemoSession).not.toHaveBeenCalled();
    });

    it('no activa la demo con un PIN distinto', async () => {
      await startDemoSession();
      vault.exists.mockResolvedValue(false);

      const {getByTestId} = renderLogin();
      await typePin(getByTestId, '1111');

      await waitFor(() => {
        expect(activateDemoSession).not.toHaveBeenCalled();
      });
    });

    it('sin sesión demo activa el PIN demo no hace nada especial', async () => {
      vault.exists.mockResolvedValue(false);

      const {getByTestId} = renderLogin();
      await typePin(getByTestId, DEMO_PIN);

      await waitFor(() => {
        expect(activateDemoSession).not.toHaveBeenCalled();
      });
    });
  });
});
