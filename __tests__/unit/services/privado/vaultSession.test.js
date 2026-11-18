import {createMockVault} from '@privado-id/expo-sdk';
import {getPrivadoVault} from '../../../../src/services/privado/privadoSession';
import {
  VaultUnlockCancelledError,
  __resetVaultUnlockForTests,
  setVaultUnlockPrompter,
  vaultUnlockProvider,
} from '../../../../src/services/privado/vaultUnlock';
import {
  VAULT_TOUCH_THROTTLE_MS,
  __resetVaultActivityForTests,
  ensureVaultUnlocked,
  touchVaultActivity,
} from '../../../../src/services/privado/vaultSession';

jest.mock('../../../../src/services/privado/privadoSession', () => ({
  getPrivadoVault: jest.fn(),
}));

describe('ensureVaultUnlocked', () => {
  let vault;

  beforeEach(() => {
    __resetVaultUnlockForTests();
    vault = createMockVault();
    // Como el vault real: sin método, pide el desbloqueo al proveedor.
    vault.unlock.mockImplementation(async () => {
      await vaultUnlockProvider({purpose: 'unlock', biometricsEnabled: false});
      vault.isUnlocked.mockReturnValue(true);
    });
    getPrivadoVault.mockResolvedValue(vault);
  });

  it('con el vault abierto no pide nada', async () => {
    vault.isUnlocked.mockReturnValue(true);
    await expect(ensureVaultUnlocked()).resolves.toBe(true);
    expect(vault.unlock).not.toHaveBeenCalled();
  });

  it('pide el desbloqueo con el motivo indicado', async () => {
    const prompter = jest.fn(async () => ({type: 'pin', pin: '4821'}));
    setVaultUnlockPrompter(prompter);

    await expect(ensureVaultUnlocked({reason: 'Actas pendientes'})).resolves.toBe(true);
    expect(prompter).toHaveBeenCalledWith(expect.objectContaining({reason: 'Actas pendientes'}));
  });

  it('si el usuario cancela devuelve false y no vuelve a preguntar enseguida', async () => {
    const prompter = jest.fn(async () => {
      throw new VaultUnlockCancelledError();
    });
    setVaultUnlockPrompter(prompter);

    await expect(ensureVaultUnlocked()).resolves.toBe(false);
    await expect(ensureVaultUnlocked()).resolves.toBe(false);
    expect(prompter).toHaveBeenCalledTimes(1);
    expect(vault.unlock).toHaveBeenCalledTimes(1);
  });

  it('sin forma de pedirlo o sin vault devuelve false', async () => {
    await expect(ensureVaultUnlocked()).resolves.toBe(false);

    vault.exists.mockResolvedValue(false);
    vault.unlock.mockClear();
    await expect(ensureVaultUnlocked()).resolves.toBe(false);
    expect(vault.unlock).not.toHaveBeenCalled();
  });

  it('otros errores se propagan', async () => {
    vault.unlock.mockRejectedValueOnce(new Error('corrupto'));
    await expect(ensureVaultUnlocked()).rejects.toThrow('corrupto');
  });
});

describe('touchVaultActivity', () => {
  let vault;
  let nowSpy;

  beforeEach(() => {
    __resetVaultActivityForTests();
    vault = createMockVault();
    getPrivadoVault.mockResolvedValue(vault);
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => nowSpy.mockRestore());

  const flush = () => new Promise(resolve => setImmediate(resolve));

  it('cuenta un toque como uso del vault, como mucho cada 15 s', async () => {
    touchVaultActivity();
    touchVaultActivity();
    await flush();
    expect(vault.touch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1_000_000 + VAULT_TOUCH_THROTTLE_MS);
    touchVaultActivity();
    await flush();
    expect(vault.touch).toHaveBeenCalledTimes(2);
  });

  it('si la sesión del SDK falla no lanza', async () => {
    getPrivadoVault.mockRejectedValueOnce(new Error('sin config'));
    expect(() => touchVaultActivity()).not.toThrow();
    await flush();
  });
});
