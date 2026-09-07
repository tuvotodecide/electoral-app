import {DEMO_DNI} from './demoConfig';

/**
 * Fecha de nacimiento en SEGUNDOS: PersonalDetails.js hace
 * `new Date(birthSec * 1000)`.
 */
const DEMO_BIRTH_DATE_SECONDS = Math.floor(Date.UTC(1990, 0, 1) / 1000);

/**
 * Payload de wallet del modo demostración: lo que queda en
 * `state.wallet.payload`, igual que el resultado de `wira.signIn`.
 *
 * NO incluye `did` ni `privKey` a propósito. Todo el código que habla con el
 * backend de identidad exige ambos (HomeScreen.js:1141, :1319, :1961,
 * UniversalHeader.js:101), así que su ausencia desactiva esas rutas sin tener
 * que tocar esos ficheros.
 */
export const DEMO_WALLET_PAYLOAD = Object.freeze({
  isDemo: true,
  dni: DEMO_DNI,
  account: '0xdededededededededededededededededededede',
  guardian: null,
  vc: {
    credentialSubject: {
      fullName: 'Cuenta de demostración',
      nationalIdNumber: DEMO_DNI,
      documentNumber: DEMO_DNI,
      governmentIdentifier: DEMO_DNI,
      birthDate: DEMO_BIRTH_DATE_SECONDS,
    },
  },
});
