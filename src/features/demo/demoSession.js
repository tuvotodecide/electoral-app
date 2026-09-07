/**
 * Estado del modo demostración.
 *
 * Fuente de verdad del modo demostración. Debe poder consultarse de forma
 * SÍNCRONA (`isDemoActive`) porque `getElectionRepository()` se llama desde
 * callbacks y desde `queueAdapter`, fuera de React.
 *
 * Este módulo no importa redux, navegación ni repositorios: es una hoja del
 * grafo de dependencias. Importarlos crearía un ciclo a través de
 * useElectionRepository -> queueAdapter -> HomeScreen.
 */

import {useSyncExternalStore} from 'react';

import {StorageService} from '../../services/StorageService';

export const DEMO_SESSION_STORAGE_KEY = '@demo/session:v1';

let active = false;
let hydrated = false;
let hydrationPromise = null;
const listeners = new Set();

const emit = () => {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (_) {
      // un suscriptor roto no debe romper a los demás
    }
  });
};

const setActive = next => {
  const normalized = Boolean(next);
  if (normalized === active) {
    return;
  }
  active = normalized;
  emit();
};

/** Lectura síncrona. Falso hasta que `hydrateDemoSession()` resuelva. */
export const isDemoActive = () => active;

export const isDemoSessionHydrated = () => hydrated;

/**
 * Carga el flag persistido. Idempotente y deduplicada: se puede llamar desde
 * varios sitios (splash, Connect) sin coste.
 * @returns {Promise<boolean>}
 */
export const hydrateDemoSession = async () => {
  if (hydrated) {
    return active;
  }
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      try {
        const raw = await StorageService.getItem(DEMO_SESSION_STORAGE_KEY);
        setActive(raw === '1');
      } catch (_) {
        setActive(false);
      } finally {
        hydrated = true;
        hydrationPromise = null;
      }
      return active;
    })();
  }
  return hydrationPromise;
};

export const startDemoSession = async () => {
  await StorageService.setItem(DEMO_SESSION_STORAGE_KEY, '1');
  hydrated = true;
  setActive(true);
  return true;
};

export const endDemoSession = async () => {
  await StorageService.removeItem(DEMO_SESSION_STORAGE_KEY);
  hydrated = true;
  setActive(false);
  return true;
};

/* ------------------------------------------------------------------ */
/* Reactividad React                                                    */
/* ------------------------------------------------------------------ */

export const subscribeDemoSession = listener => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Devuelve un booleano primitivo: estable entre renders. */
const getDemoSessionSnapshot = () => active;

export const useIsDemoActive = () =>
  useSyncExternalStore(
    subscribeDemoSession,
    getDemoSessionSnapshot,
    getDemoSessionSnapshot,
  );

/** Solo para tests. */
export const __resetDemoSessionForTests = () => {
  active = false;
  hydrated = false;
  hydrationPromise = null;
  listeners.clear();
};
