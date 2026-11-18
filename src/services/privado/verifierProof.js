import {VerifierResponseError} from '@privado-id/expo-sdk';
import {getPrivadoClient} from './privadoSession';
import {withVaultUnlockReason} from './vaultUnlock';

/**
 * Responde una solicitud de autorización iden3comm de un verificador
 * (`AuthorizationRequestMessage` como objeto, JSON o enlace) con el SDK:
 * genera la respuesta JWZ (authV2 y una prueba por scope) y la envía a su
 * `callbackUrl`.
 *
 * Con `credentialId` (id de almacenamiento, el `id` que devuelve
 * `getCredentialForVote`) todos los scopes se prueban con esa credencial; sin
 * él, el SDK elige la más reciente que cumpla cada scope. `reason` es el texto
 * del modal si hay que abrir el vault.
 *
 * Si el verificador responde con un error HTTP lanza `VerifierResponseError`
 * (`httpStatus`, `responseText`).
 */
export async function answerVerifierRequest(request, {credentialId, reason} = {}) {
  const {offChainZk} = await getPrivadoClient();
  const zkRequest = await offChainZk.getZkRequest({link: request});
  const credentialIds = credentialId
    ? Object.fromEntries(zkRequest.scope.map(scope => [String(scope.id), credentialId]))
    : undefined;
  const answer = async () => {
    const prepared = await offChainZk.generateZkResponse({
      request: zkRequest,
      credentialIds,
    });
    return offChainZk.submitZkResponse({prepared});
  };
  // Sin `reason` no se apila nada: se conserva el de una operación externa.
  return reason ? withVaultUnlockReason(reason, answer) : answer();
}

/** Si `error` es el rechazo del verificador con ese estado HTTP. */
export const isVerifierRejection = (error, httpStatus) =>
  error instanceof VerifierResponseError && error.httpStatus === httpStatus;
