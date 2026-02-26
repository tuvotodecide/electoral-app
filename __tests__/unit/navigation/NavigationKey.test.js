import {
  StackNav,
  TabNav,
  AuthNav,
} from '../../../src/navigation/NavigationKey';
import {
  StackNav as StackNavClean,
  TabNav as TabNavClean,
  AuthNav as AuthNavClean,
} from '../../../src/navigation/NavigationKeyClean';

describe('NavigationKey', () => {
  it('expone rutas base del stack', () => {
    expect(StackNav.Splash).toBe('Splash');
    expect(StackNav.AuthNavigation).toBe('AuthNavigation');
    expect(StackNav.TabNavigation).toBe('TabNavigation');
  });

  it('expone rutas del tab', () => {
    expect(TabNav.HomeScreen).toBe('HomeScreen');
    expect(TabNav.Profile).toBe('Profile');
  });

  it('expone rutas de auth', () => {
    expect(AuthNav.Login).toBe('Login');
    expect(AuthNav.CreatePin).toBe('CreatePin');
    expect(AuthNav.RegisterUser10).toBe('RegisterUser10');
  });
});

describe('NavigationKeyClean', () => {
  it('expone rutas base del stack', () => {
    expect(StackNavClean.Splash).toBe('Splash');
    expect(StackNavClean.AuthNavigation).toBe('AuthNavigation');
    expect(StackNavClean.TabNavigation).toBe('TabNavigation');
  });

  it('expone rutas del tab', () => {
    expect(TabNavClean.HomeScreen).toBe('HomeScreen');
    expect(TabNavClean.Profile).toBe('Profile');
  });

  it('expone rutas de auth', () => {
    expect(AuthNavClean.Login).toBe('Login');
    expect(AuthNavClean.CreatePin).toBe('CreatePin');
    expect(AuthNavClean.RegisterUser11).toBe('RegisterUser11');
  });
});
