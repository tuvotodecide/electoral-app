import {dropPersistedWallet, resetAuthOnRehydrate} from '../../../src/redux/store';

describe('redux store persistence', () => {
  it('al rehidratar auth fuerza isAuthenticated a false y conserva el resto', () => {
    const pendingNotificationNavigation = {
      type: 'notification',
      targetRoute: 'VotingNotificationDetailScreen',
    };

    const rehydrated = resetAuthOnRehydrate.out(
      {isAuthenticated: true, pendingNav: null, pendingNotificationNavigation},
      'auth',
    );

    expect(rehydrated).toEqual({
      isAuthenticated: false,
      pendingNav: null,
      pendingNotificationNavigation,
    });
  });

  it('no modifica otras slices al rehidratar', () => {
    const wallet = {payload: {account: '0xabc'}};

    expect(resetAuthOnRehydrate.out(wallet, 'wallet')).toBe(wallet);
  });

  it('guarda auth sin cambios', () => {
    const auth = {isAuthenticated: true, pendingNav: null};

    expect(resetAuthOnRehydrate.in(auth, 'auth')).toBe(auth);
  });

  describe('wallet no se persiste', () => {
    it('descarta el wallet guardado por versiones anteriores (con la clave privada)', async () => {
      const stored = {
        wallet: {payload: {did: 'did:x', privKey: '0xsecret', vc: {}}},
        auth: {isAuthenticated: false},
        _persist: {version: -1, rehydrated: false},
      };

      await expect(dropPersistedWallet(stored)).resolves.toEqual({
        auth: {isAuthenticated: false},
        _persist: {version: -1, rehydrated: false},
      });
    });

    it('sin wallet guardado devuelve el estado tal cual', async () => {
      const stored = {auth: {isAuthenticated: false}};
      await expect(dropPersistedWallet(stored)).resolves.toBe(stored);
      await expect(dropPersistedWallet(undefined)).resolves.toBeUndefined();
    });
  });
});
