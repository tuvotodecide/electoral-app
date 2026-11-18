import {RegistryRefusalError} from '@privado-id/expo-sdk';
import Strings from '../../i18n/String';

// analysisCode de backend-identity (registry/analyze y registry/recovery-ci)
// -> mensaje para el usuario. El texto de `details` puede cambiar; el código no.
const ANALYSIS_ERROR_MESSAGES = {
  'front-back-order': () => Strings.frontBackOrderError,
  'face-mismatch': () => Strings.faceMatchFailedError,
  'missing-data': () => Strings.missingDataError,
  unavailable: () => Strings.analysisUnavailableError,
};

/**
 * Mensaje para un fallo del análisis del carnet, o `undefined` si el error no
 * es uno de esos (el llamador decide el mensaje genérico y si lo reporta).
 */
export function analysisErrorMessage(error) {
  if (!(error instanceof RegistryRefusalError)) {
    return undefined;
  }
  return ANALYSIS_ERROR_MESSAGES[error.analysisCode]?.();
}
