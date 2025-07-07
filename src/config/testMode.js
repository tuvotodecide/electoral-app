// Flag global para el modo test
// Este flag puede ser verificado por cualquier función que haga llamadas de red

let isTestModeActive = false;

export const enableTestMode = () => {
  isTestModeActive = true;
  console.log('[TEST] Modo test activado globalmente');
};

export const disableTestMode = () => {
  isTestModeActive = false;
  console.log('[TEST] Modo test desactivado');
};

export const isTestMode = () => {
  return isTestModeActive;
};

// Función helper para verificar si se debe ejecutar código de red
export const shouldMakeNetworkCall = () => {
  if (isTestModeActive) {
    console.log('[TEST] Llamada de red bloqueada por modo test');
    return false;
  }
  return true;
};

// Función para crear respuestas mockeadas
export const createMockResponse = (data = {}) => {
  return Promise.resolve({
    data: {
      ok: true,
      ...data,
      isTestMode: true,
    },
    status: 200,
  });
};
