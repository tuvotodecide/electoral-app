import {resetAuthOnRehydrate} from '../../../src/redux/store';

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
});
