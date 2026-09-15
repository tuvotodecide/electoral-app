// Marca de un solo uso: Home se abrió justo después de desbloquear en
// LoginUser. Home la consume para cargar las elecciones desde la API en primer
// plano; en cualquier otra entrada muestra la copia guardada y refresca en
// segundo plano.
let enteredFromLogin = false;

export const markHomeEntryFromLogin = () => {
  enteredFromLogin = true;
};

export const consumeHomeEntryFromLogin = () => {
  const value = enteredFromLogin;
  enteredFromLogin = false;
  return value;
};
