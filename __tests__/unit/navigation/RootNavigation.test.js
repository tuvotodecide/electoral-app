import {navigate, navigationRef, safeNavigate} from '../../../src/navigation/RootNavigation';

describe('RootNavigation', () => {
  beforeEach(() => {
    navigationRef.isReady = jest.fn(() => true);
    navigationRef.navigate = jest.fn();
  });

  it('navega cuando el ref estÃ¡ listo', () => {
    navigate('ScreenA', {id: 1});
    expect(navigationRef.navigate).toHaveBeenCalledWith('ScreenA', {id: 1});
  });

  it('no navega si el ref no estÃ¡ listo', () => {
    navigationRef.isReady = jest.fn(() => false);
    navigate('ScreenB');
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });

  it('safeNavigate retorna true solo cuando navega', () => {
    expect(safeNavigate('ScreenC', {id: 3})).toBe(true);
    expect(navigationRef.navigate).toHaveBeenCalledWith('ScreenC', {id: 3});

    navigationRef.navigate.mockClear();
    navigationRef.isReady = jest.fn(() => false);

    expect(safeNavigate('ScreenD')).toBe(false);
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });
});
