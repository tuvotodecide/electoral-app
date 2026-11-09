import axios from "axios";
import { BACKEND_RESULT } from "@env";
import { authenticateWithBackend } from "../utils/offlineQueueHandler";
import { captureError } from "../config/sentry";
// Import directo (no el barrel de features/demo) para no arrastrar redux ni
// navegación a este módulo.
import { isDemoActive } from "../features/demo/demoSession";
import { getPrivadoSession, getPrivadoClient } from "../services/privado/privadoSession";
import { getVoteCredentialType } from "../services/privado/privadoConfig";
import { withVaultPin, withVaultUnlockReason } from "../services/privado/vaultUnlock";
import { uploadRegistryBackup } from "../services/privado/registryBackupSync";

/**
 * Credenciales de voto (una por evento) con el SDK de Privado ID.
 *
 * back-results emite la credencial en el issuer-node y devuelve el enlace de
 * su oferta; la app la reclama con `claimCredentialFromIssuer` y vuelve a
 * subir el respaldo del registro para que la recuperación con carnet la
 * incluya.
 *
 * `getCredentialForVote` devuelve `{id, type, info}`, con la credencial W3C en
 * `info` (la forma que esperan la votación y las recompensas).
 */

const UNLOCK_REASON = "Abre tu cuenta para revisar tu credencial de voto.";

/** Credencial sintética del modo demostración. */
const buildDemoCredential = (voteId) => ({
  id: "demo_credential",
  info: {
    credentialSubject: {
      eventId: voteId,
      nullifier: "1",
    },
  },
});

/**
 * Busca entre las credenciales de voto guardadas la del evento `voteId`. Los
 * resúmenes no están cifrados; solo se descifran las candidatas (si el vault
 * está bloqueado, el SDK pide el desbloqueo). Sin credenciales de voto no se
 * descifra nada.
 */
async function findVoteCredential(voteId) {
  const client = await getPrivadoClient();
  const summaries = await client.findCredentialsByType(getVoteCredentialType(), {
    includeExpired: true,
  });
  if (summaries.length === 0) {
    return undefined;
  }
  const wanted = String(voteId ?? "");
  return withVaultUnlockReason(UNLOCK_REASON, async () => {
    for (const summary of summaries) {
      const credential = await client.getCredentialById(summary.id);
      if (String(credential?.credentialSubject?.eventId ?? "") === wanted) {
        return { id: summary.id, type: summary.type, info: credential };
      }
    }
    return undefined;
  });
}

/**
 * Todas las credenciales de voto guardadas, `{id, type, info}`, más recientes
 * primero. Descifra cada una (si el vault está bloqueado, el SDK pide el
 * desbloqueo con `reason`). Lanza si no se pueden leer.
 */
export async function listVoteCredentials({ reason = UNLOCK_REASON } = {}) {
  if (isDemoActive()) {
    return [];
  }
  const client = await getPrivadoClient();
  const summaries = await client.findCredentialsByType(getVoteCredentialType(), {
    includeExpired: true,
  });
  if (summaries.length === 0) {
    return [];
  }
  return withVaultUnlockReason(reason, async () => {
    const credentials = [];
    for (const summary of summaries) {
      const credential = await client.getCredentialById(summary.id);
      if (credential) {
        credentials.push({ id: summary.id, type: summary.type, info: credential });
      }
    }
    return credentials;
  });
}

/**
 * Credencial de voto del evento, o `undefined` si no está o no se pudo leer.
 * Los argumentos que siguen a `voteId` (did, privKey) ya no se usan.
 */
export async function getCredentialForVote(voteId) {
  // En demo no hay identidad en el SDK: se devuelve una credencial sintética.
  if (isDemoActive()) {
    return buildDemoCredential(voteId);
  }

  try {
    return await findVoteCredential(voteId);
  } catch (error) {
    console.error("Error fetching user credentials:", error);
    return undefined;
  }
}

/**
 * Si ya está guardada la credencial de voto del evento. Lanza si no se pudo
 * comprobar (p. ej. `VaultUnlockCancelledError` si el usuario cerró el
 * desbloqueo), para no tratar un error como "ya reclamada".
 */
export async function checkClaimedCredForVote(voteId) {
  // Sin este corte, HomeScreen.handleVotingPress abriría el modal de PIN y
  // dispararía claimForVote (llamadas de red y el reclamo al issuer).
  if (isDemoActive()) {
    return true;
  }
  return (await findVoteCredential(voteId)) !== undefined;
}

/**
 * Reclama la credencial de voto del evento y actualiza el respaldo del
 * registro. Devuelve `{claimed, invalidPin, backupUpdated}`:
 * - `invalidPin`: el PIN no es el del vault; no se pidió nada a la red.
 * - `backupUpdated: false`: la credencial quedó guardada pero el respaldo no
 *   se pudo subir; queda pendiente y se reintenta con el próximo PIN.
 */
export async function claimForVote(voteId, dni, pin) {
  // Inalcanzable con el corte de checkClaimedCredForVote.
  if (isDemoActive()) {
    return { claimed: true, invalidPin: false, backupUpdated: true };
  }

  try {
    const { client, vault } = await getPrivadoSession();
    // El PIN abre el vault y cifra el respaldo: se comprueba antes de que
    // back-results emita la credencial.
    if (!(await vault.verifyPin(String(pin)))) {
      return { claimed: false, invalidPin: true, backupUpdated: false };
    }

    const resolvedApiKey = await authenticateWithBackend();
    const response = await axios.get(
      `${BACKEND_RESULT}/api/v1/voting/events/vote/cred-vc`,
      {
        params: { eventId: voteId, dni },
        headers: {
          "Content-Type": "application/json",
          "x-api-key": resolvedApiKey,
        },
        timeout: 30000,
      },
    );

    const offer = response?.data?.offer;
    if (!offer) {
      throw new Error(
        "back-results no devolvió la oferta de la credencial de voto.",
      );
    }

    return await withVaultPin(pin, async () => {
      const claim = await client.claimCredentialFromIssuer({
        offer,
        credentialType: getVoteCredentialType(),
      });
      if (!claim?.stored) {
        throw new Error("No se pudo guardar la credencial de voto.");
      }

      let backupUpdated = true;
      try {
        await uploadRegistryBackup(pin);
      } catch (error) {
        // La credencial ya está en el dispositivo: se puede votar. El
        // respaldo queda pendiente (ver registryBackupSync).
        backupUpdated = false;
        captureError(error, {
          flow: "institution-voting",
          critical: false,
          step: "registry-backup",
          allowPii: false,
        });
      }
      return { claimed: true, invalidPin: false, backupUpdated };
    });
  } catch (error) {
    console.error(error);
    captureError(error, {
      flow: "institution-voting",
      critical: true,
      step: "claim-credential",
      tableCode: "",
      allowPii: false,
    });
    return { claimed: false, invalidPin: false, backupUpdated: false };
  }
}
