import { DEMO_DNI } from "./demoConfig";

/**
 * Fecha de nacimiento en SEGUNDOS: PersonalDetails.js hace
 * `new Date(birthSec * 1000)`.
 */
const DEMO_BIRTH_DATE_SECONDS = Math.floor(Date.UTC(1990, 0, 1) / 1000);

/**
 * Payload de wallet del modo demostración: lo que queda en
 * `state.wallet.payload`, con la misma forma que `loadIdentityPayload`.
 *
 * NO incluye `did` a propósito: el código que se autentica ante los backends
 * exige el DID de la sesión, así que su ausencia desactiva esas rutas; el
 * resto comprueba `isDemoActive()`.
 */
export const DEMO_WALLET_PAYLOAD = Object.freeze({
  isDemo: true,
  dni: DEMO_DNI,
  account: "0xdededededededededededededededededededede",
  vc: {
    credentialSubject: {
      fullName: "Cuenta demo",
      nationalIdNumber: DEMO_DNI,
      documentNumber: DEMO_DNI,
      governmentIdentifier: DEMO_DNI,
      birthDate: DEMO_BIRTH_DATE_SECONDS,
    },
  },
});
