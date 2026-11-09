import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';
import {VaultError, createMockVault} from '@privado-id/expo-sdk';
import VaultUnlockHost, {MAX_PIN_ATTEMPTS} from '../../../src/components/VaultUnlockHost';
import {
  VaultUnlockCancelledError,
  VaultUnlockUnavailableError,
  __resetVaultUnlockForTests,
  vaultUnlockProvider,
  withVaultUnlockReason,
} from '../../../src/services/privado/vaultUnlock';
import {getPrivadoVault} from '../../../src/services/privado/privadoSession';
import {getBiometryStatus} from '../../../src/services/biometrics';
import {incAttempts, resetAttempts} from '../../../src/utils/PinAttempts';
import {navigationRef} from '../../../src/navigation/RootNavigation';
import {AuthNav, StackNav} from '../../../src/navigation/NavigationKey';
import {renderWithProviders} from '../../setup/test-utils';

jest.mock('../../../src/services/privado/privadoSession', () => ({
  getPrivadoVault: jest.fn(),
}));
jest.mock('../../../src/services/biometrics', () => ({
  getBiometryStatus: jest.fn(),
}));
jest.mock('../../../src/utils/PinAttempts', () => ({
  incAttempts: jest.fn(),
  resetAttempts: jest.fn(async () => undefined),
}));
jest.mock('../../../src/navigation/RootNavigation', () => ({
  navigationRef: {isReady: jest.fn(() => true), reset: jest.fn()},
}));

const REQUEST = {purpose: 'unlock', biometricsEnabled: false};

describe('VaultUnlockHost', () => {
  let vault;

  const renderHost = () => renderWithProviders(<VaultUnlockHost />);

  const typePin = (utils, pin) =>
    act(async () => {
      utils.getByTestId('vaultUnlockPinInput').props.handleTextChange(pin);
    });

  beforeEach(() => {
    jest.clearAllMocks();
    __resetVaultUnlockForTests();
    vault = createMockVault();
    getPrivadoVault.mockResolvedValue(vault);
    getBiometryStatus.mockResolvedValue({hasHardware: true, enrolled: true, biometryType: 'fingerprint'});
  });

  it('muestra el modal con el motivo y abre el vault con el PIN', async () => {
    const utils = renderHost();
    let unlocked;
    act(() => {
      unlocked = withVaultUnlockReason('Tienes actas pendientes', () => vaultUnlockProvider(REQUEST));
    });

    await waitFor(() => expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(true));
    expect(utils.getByTestId('vaultUnlockReason').props.children).toBe('Tienes actas pendientes');
    expect(utils.queryByTestId('vaultUnlockBiometricsButton')).toBeNull();

    await typePin(utils, '4821');

    await expect(unlocked).resolves.toEqual({type: 'pin', pin: '4821'});
    expect(vault.unlock).toHaveBeenCalledWith({type: 'pin', pin: '4821'});
    expect(resetAttempts).toHaveBeenCalled();
    expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(false);
  });

  it('con un PIN incorrecto indica los intentos y deja reintentar', async () => {
    vault.unlock.mockRejectedValueOnce(new VaultError('INVALID_PIN', 'wrong'));
    incAttempts.mockResolvedValueOnce(2);
    const utils = renderHost();
    let unlocked;
    act(() => {
      unlocked = vaultUnlockProvider(REQUEST);
    });
    await waitFor(() => expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(true));

    await typePin(utils, '0000');
    expect(utils.getByTestId('vaultUnlockError').props.children).toBe(
      `PIN incorrecto. Te quedan ${MAX_PIN_ATTEMPTS - 2} intentos.`,
    );
    expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(true);

    await typePin(utils, '4821');
    await expect(unlocked).resolves.toEqual({type: 'pin', pin: '4821'});
  });

  it('al agotar los intentos cancela, cierra la sesión y va a recuperación', async () => {
    vault.unlock.mockRejectedValue(new VaultError('INVALID_PIN', 'wrong'));
    incAttempts.mockResolvedValueOnce(MAX_PIN_ATTEMPTS);
    const utils = renderHost();
    let outcome;
    act(() => {
      // El rechazo llega dentro de typePin: se captura desde ya.
      outcome = vaultUnlockProvider(REQUEST).catch(error => error);
    });
    await waitFor(() => expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(true));

    await typePin(utils, '0000');

    await expect(outcome).resolves.toMatchObject({code: 'PIN_ATTEMPTS_EXHAUSTED'});
    expect(navigationRef.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: StackNav.AuthNavigation,
          params: {screen: AuthNav.SelectRecuperation},
        },
      ],
    });
    expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(false);
  });

  it('cancelar rechaza la operación con VaultUnlockCancelledError', async () => {
    const utils = renderHost();
    let unlocked;
    act(() => {
      unlocked = vaultUnlockProvider(REQUEST);
    });
    await waitFor(() => expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(true));

    fireEvent.press(utils.getByTestId('vaultUnlockCancelButton'));

    await expect(unlocked).rejects.toBeInstanceOf(VaultUnlockCancelledError);
    expect(vault.unlock).not.toHaveBeenCalled();
  });

  it('con biometría activada la intenta primero', async () => {
    getBiometryStatus.mockResolvedValue({hasHardware: true, enrolled: true, biometryType: 'face'});
    renderHost();

    await expect(
      vaultUnlockProvider({purpose: 'unlock', biometricsEnabled: true}),
    ).resolves.toEqual({type: 'biometrics', prompt: 'Escanea tu rostro'});
    expect(vault.unlock).toHaveBeenCalledWith({type: 'biometrics', prompt: 'Escanea tu rostro'});
  });

  it('si la biometría se cancela queda el PIN, y se puede volver a intentar', async () => {
    vault.unlock.mockRejectedValueOnce(new VaultError('BIOMETRICS_CANCELLED', 'cancelled'));
    const utils = renderHost();
    let unlocked;
    act(() => {
      unlocked = vaultUnlockProvider({purpose: 'unlock', biometricsEnabled: true});
    });

    await waitFor(() => expect(utils.getByTestId('vaultUnlockBiometricsButton')).toBeTruthy());
    await waitFor(() => expect(utils.queryByTestId('vaultUnlockBusy')).toBeNull());
    expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(true);

    await act(async () => {
      fireEvent.press(utils.getByTestId('vaultUnlockBiometricsButton'));
    });
    await expect(unlocked).resolves.toMatchObject({type: 'biometrics'});
    expect(vault.unlock).toHaveBeenCalledTimes(2);
  });

  it('si la biometría del dispositivo cambió oculta el botón y pide el PIN', async () => {
    vault.unlock.mockRejectedValueOnce(new VaultError('BIOMETRICS_INVALIDATED', 'changed'));
    const utils = renderHost();
    act(() => {
      vaultUnlockProvider({purpose: 'unlock', biometricsEnabled: true}).catch(() => undefined);
    });

    await waitFor(() =>
      expect(utils.getByTestId('vaultUnlockError').props.children).toMatch(/biometría de tu dispositivo cambió/),
    );
    expect(utils.queryByTestId('vaultUnlockBiometricsButton')).toBeNull();
  });

  it('sin sesión iniciada no muestra el modal', async () => {
    // react-redux está simulado en los tests (sesión iniciada): aquí, sin sesión.
    const {useSelector} = require('react-redux');
    const original = useSelector.getMockImplementation();
    useSelector.mockImplementation(selector =>
      selector({theme: {theme: {}}, auth: {isAuthenticated: false}}),
    );
    try {
      const utils = renderHost();

      await expect(vaultUnlockProvider(REQUEST)).rejects.toBeInstanceOf(
        VaultUnlockUnavailableError,
      );
      expect(utils.getByTestId('vaultUnlockModal').props.visible).toBe(false);
    } finally {
      useSelector.mockImplementation(original);
    }
  });

  it('no crea un vault: purpose create no se pide aquí', async () => {
    renderHost();
    await expect(
      vaultUnlockProvider({purpose: 'create', biometricsEnabled: false}),
    ).rejects.toBeInstanceOf(VaultUnlockUnavailableError);
  });
});
