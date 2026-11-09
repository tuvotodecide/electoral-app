const loadSession = () => require('../../../../src/services/privado/privadoSession');

describe('privadoSession', () => {
  let createPersistentPrivadoExpoClient;

  beforeEach(() => {
    jest.resetModules();
    const sdk = require('@privado-id/expo-sdk');
    const {createMockSession} = sdk;
    createPersistentPrivadoExpoClient = sdk.createPersistentPrivadoExpoClient;
    createPersistentPrivadoExpoClient.mockReset();
    createPersistentPrivadoExpoClient.mockImplementation(async () =>
      createMockSession(),
    );
  });

  it('crea e inicializa una sola sesión aunque se pida a la vez', async () => {
    const {getPrivadoSession, getPrivadoClient, getPrivadoVault} = loadSession();

    const [a, b] = await Promise.all([getPrivadoSession(), getPrivadoSession()]);
    const client = await getPrivadoClient();
    const vault = await getPrivadoVault();

    expect(a).toBe(b);
    expect(client).toBe(a.client);
    expect(vault).toBe(a.vault);
    expect(createPersistentPrivadoExpoClient).toHaveBeenCalledTimes(1);
    expect(a.client.init).toHaveBeenCalledTimes(1);
  });

  it('pasa la config de Base Sepolia, el vault con PIN de 4 y el bloqueo de .env', async () => {
    const {getPrivadoSession} = loadSession();
    await getPrivadoSession();

    const options = createPersistentPrivadoExpoClient.mock.calls[0][0];
    expect(options.config.network).toEqual({
      blockchain: 'base',
      name: 'sepolia',
      chainId: 84532,
      rpcUrl: 'https://rpc.example',
    });
    expect(options.config.identityApi).toEqual({
      baseUrl: 'https://identity.example',
      apiKey: 'test-identity-key',
    });
    expect(options.lock).toEqual({lockOnBackground: true, idleTimeoutMinutes: 5});
    expect(options.pin).toEqual({minLength: 4});
    expect(typeof options.vaultUnlockProvider).toBe('function');
    expect(options.credentialPasswordProvider).toBeUndefined();
    expect(options.modules.fileSystem).toBeDefined();
  });

  it('vuelve a intentarlo si la creación falla', async () => {
    createPersistentPrivadoExpoClient.mockRejectedValueOnce(new Error('sqlite'));
    const {getPrivadoSession} = loadSession();

    await expect(getPrivadoSession()).rejects.toThrow('sqlite');
    await expect(getPrivadoSession()).resolves.toBeDefined();
    expect(createPersistentPrivadoExpoClient).toHaveBeenCalledTimes(2);
  });
});

describe('buildPrivadoLockPolicy', () => {
  const loadWithEnv = overrides => {
    jest.resetModules();
    jest.doMock('@env', () => ({
      ...jest.requireActual('../../../__mocks__/@env.js'),
      ...overrides,
    }));
    return require('../../../../src/services/privado/privadoConfig');
  };

  afterEach(() => {
    jest.dontMock('@env');
  });

  it('lee la política de las variables de entorno', () => {
    const {buildPrivadoLockPolicy} = loadWithEnv({
      PRIVADO_LOCK_ON_BACKGROUND: 'False',
      PRIVADO_IDLE_TIMEOUT_MINUTES: '2.5',
    });
    expect(buildPrivadoLockPolicy()).toEqual({lockOnBackground: false, idleTimeoutMinutes: 2.5});
  });

  it.each([
    [{PRIVADO_LOCK_ON_BACKGROUND: ''}, /PRIVADO_LOCK_ON_BACKGROUND/],
    [{PRIVADO_LOCK_ON_BACKGROUND: 'si'}, /true o false/],
    [{PRIVADO_IDLE_TIMEOUT_MINUTES: undefined}, /PRIVADO_IDLE_TIMEOUT_MINUTES/],
    [{PRIVADO_IDLE_TIMEOUT_MINUTES: '0'}, /mayor que 0/],
    [{PRIVADO_IDLE_TIMEOUT_MINUTES: 'cinco'}, /mayor que 0/],
  ])('rechaza %o', (overrides, message) => {
    const {buildPrivadoLockPolicy} = loadWithEnv(overrides);
    expect(() => buildPrivadoLockPolicy()).toThrow(message);
  });
});

describe('vaultUnlock', () => {
  const load = () => require('../../../../src/services/privado/vaultUnlock');

  beforeEach(() => {
    jest.resetModules();
  });

  it('usa el PIN de withVaultPin mientras dura la operación', async () => {
    const {withVaultPin, vaultUnlockProvider} = load();
    const request = {purpose: 'create', biometricsEnabled: false};

    const seen = await withVaultPin(1234, () => vaultUnlockProvider(request));

    expect(seen).toEqual({type: 'pin', pin: '1234'});
    await expect(vaultUnlockProvider(request)).rejects.toMatchObject({
      code: 'VAULT_UNLOCK_UNAVAILABLE',
    });
  });

  it('delega en el prompter registrado cuando no hay PIN en curso', async () => {
    const {setVaultUnlockPrompter, vaultUnlockProvider} = load();
    const prompter = jest.fn(async () => ({type: 'biometrics', prompt: 'Usa tu huella'}));
    const unregister = setVaultUnlockPrompter(prompter);
    const request = {purpose: 'unlock', biometricsEnabled: true};

    await expect(vaultUnlockProvider(request)).resolves.toEqual({
      type: 'biometrics',
      prompt: 'Usa tu huella',
    });
    expect(prompter).toHaveBeenCalledWith(request);

    unregister();
    await expect(vaultUnlockProvider(request)).rejects.toThrow();
  });
});
