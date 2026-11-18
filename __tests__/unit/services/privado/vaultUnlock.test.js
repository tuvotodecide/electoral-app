import {
  UNLOCK_CANCEL_COOLDOWN_MS,
  VaultUnlockCancelledError,
  VaultUnlockUnavailableError,
  __resetVaultUnlockForTests,
  isUnlockCancelCoolingDown,
  setVaultUnlockPrompter,
  vaultUnlockProvider,
  withVaultPin,
  withVaultUnlockReason,
} from '../../../../src/services/privado/vaultUnlock';

const REQUEST = {purpose: 'unlock', biometricsEnabled: false};

describe('vaultUnlockProvider', () => {
  let time;

  beforeEach(() => {
    time = 1_000_000;
    __resetVaultUnlockForTests({clock: () => time});
  });

  it('sin PIN en curso ni prompter no se puede desbloquear', async () => {
    await expect(vaultUnlockProvider(REQUEST)).rejects.toBeInstanceOf(
      VaultUnlockUnavailableError,
    );
  });

  it('el PIN en curso tiene prioridad sobre el prompter', async () => {
    const prompter = jest.fn();
    setVaultUnlockPrompter(prompter);

    await expect(
      withVaultPin('4821', () => vaultUnlockProvider(REQUEST)),
    ).resolves.toEqual({type: 'pin', pin: '4821'});
    expect(prompter).not.toHaveBeenCalled();
  });

  it('pasa al prompter el motivo de la operación en curso', async () => {
    const prompter = jest.fn(async () => ({type: 'pin', pin: '4821'}));
    setVaultUnlockPrompter(prompter);

    await withVaultUnlockReason('Tienes actas pendientes', () =>
      vaultUnlockProvider(REQUEST),
    );
    await vaultUnlockProvider(REQUEST);

    expect(prompter).toHaveBeenNthCalledWith(1, {...REQUEST, reason: 'Tienes actas pendientes'});
    expect(prompter).toHaveBeenNthCalledWith(2, {...REQUEST, reason: undefined});
  });

  it('tras una cancelación no vuelve a pedirlo durante un minuto', async () => {
    const prompter = jest.fn(async () => {
      throw new VaultUnlockCancelledError();
    });
    setVaultUnlockPrompter(prompter);

    await expect(vaultUnlockProvider(REQUEST)).rejects.toBeInstanceOf(
      VaultUnlockCancelledError,
    );
    expect(isUnlockCancelCoolingDown()).toBe(true);

    time += UNLOCK_CANCEL_COOLDOWN_MS - 1;
    await expect(vaultUnlockProvider(REQUEST)).rejects.toBeInstanceOf(
      VaultUnlockCancelledError,
    );
    expect(prompter).toHaveBeenCalledTimes(1);

    time += 1;
    prompter.mockResolvedValueOnce({type: 'pin', pin: '4821'});
    await expect(vaultUnlockProvider(REQUEST)).resolves.toEqual({type: 'pin', pin: '4821'});
    expect(prompter).toHaveBeenCalledTimes(2);
  });

  it('otros errores del prompter no activan la pausa', async () => {
    setVaultUnlockPrompter(async () => {
      throw new Error('boom');
    });
    await expect(vaultUnlockProvider(REQUEST)).rejects.toThrow('boom');
    expect(isUnlockCancelCoolingDown()).toBe(false);
  });

  it('desregistrar el prompter solo quita el propio', async () => {
    const first = jest.fn(async () => ({type: 'pin', pin: '1'}));
    const second = jest.fn(async () => ({type: 'pin', pin: '2'}));
    const removeFirst = setVaultUnlockPrompter(first);
    setVaultUnlockPrompter(second);
    removeFirst();

    await expect(vaultUnlockProvider(REQUEST)).resolves.toEqual({type: 'pin', pin: '2'});
  });
});
