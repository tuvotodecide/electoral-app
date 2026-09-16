import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  __resetDemoSessionForTests,
  DEMO_SESSION_STORAGE_KEY,
  endDemoSession,
  hydrateDemoSession,
  isDemoActive,
  isDemoSessionHydrated,
  startDemoSession,
  subscribeDemoSession,
} from '../../../../src/features/demo/demoSession';

describe('demoSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetDemoSessionForTests();
  });

  it('isDemoActive es falso antes de hidratar', () => {
    expect(isDemoActive()).toBe(false);
    expect(isDemoSessionHydrated()).toBe(false);
  });

  it('hidrata a true cuando la clave persistida vale "1"', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('1');

    await expect(hydrateDemoSession()).resolves.toBe(true);
    expect(isDemoActive()).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(DEMO_SESSION_STORAGE_KEY);
  });

  it('hidrata a false cuando no hay clave persistida', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    await expect(hydrateDemoSession()).resolves.toBe(false);
    expect(isDemoActive()).toBe(false);
  });

  it('deduplica hidrataciones concurrentes en una sola lectura', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('1');

    await Promise.all([
      hydrateDemoSession(),
      hydrateDemoSession(),
      hydrateDemoSession(),
    ]);

    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a leer una vez hidratado', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('1');
    await hydrateDemoSession();
    await hydrateDemoSession();

    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
  });

  it('startDemoSession persiste y notifica una sola vez', async () => {
    const listener = jest.fn();
    subscribeDemoSession(listener);

    await startDemoSession();
    await startDemoSession();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      DEMO_SESSION_STORAGE_KEY,
      '1',
    );
    expect(isDemoActive()).toBe(true);
    // El segundo start no cambia el valor, así que no vuelve a emitir.
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('endDemoSession borra la clave y desactiva', async () => {
    await startDemoSession();
    await endDemoSession();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      DEMO_SESSION_STORAGE_KEY,
    );
    expect(isDemoActive()).toBe(false);
  });

  it('darse de baja deja de recibir notificaciones', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeDemoSession(listener);

    unsubscribe();
    await startDemoSession();

    expect(listener).not.toHaveBeenCalled();
  });

  it('un suscriptor que lanza no rompe a los demás', async () => {
    const roto = jest.fn(() => {
      throw new Error('boom');
    });
    const sano = jest.fn();
    subscribeDemoSession(roto);
    subscribeDemoSession(sano);

    await startDemoSession();

    expect(sano).toHaveBeenCalledTimes(1);
  });
});
