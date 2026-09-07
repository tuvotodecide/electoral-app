import axios from "axios";
import wira from "wira-sdk";
import { authenticateWithBackend } from "../utils/offlineQueueHandler";
import { BACKEND_RESULT, BACKEND_IDENTITY, IDENTITY_KEY } from "@env";
import { captureError } from "../config/sentry";
// Import directo (no el barrel de features/demo) para no arrastrar redux ni
// navegación a este módulo.
import { isDemoActive } from "../features/demo/demoSession";

const wiraClient =
  wira?.default && typeof wira.default === "object" ? wira.default : wira;

const getWiraMethod = (methodName) =>
  typeof wiraClient?.[methodName] === "function"
    ? wiraClient[methodName].bind(wiraClient)
    : null;

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

export async function getCredentialForVote(voteId, did, privKey) {
  // Llama al módulo nativo `wira.getUserCredentials`. En demo no hay identidad
  // en el wallet nativo, así que se devuelve una credencial sintética.
  if (isDemoActive()) {
    return buildDemoCredential(voteId);
  }

  try {
    const getUserCredentials = getWiraMethod("getUserCredentials");
    if (!getUserCredentials) {
      return false;
    }

    const userCreds = await getUserCredentials(did, privKey);

    return userCreds.find(
      (cred) => cred.info?.credentialSubject?.eventId === voteId,
    );
  } catch (error) {
    console.error("Error fetching user credentials:", error);
    return false;
  }
}

export async function checkClaimedCredForVote(voteId, did, privKey) {
  // Sin este corte, HomeScreen.handleVotingPress abriría el modal de PIN y
  // dispararía claimForVote (4 llamadas de red + una prueba ZK).
  if (isDemoActive()) {
    return true;
  }

  try {
    const hasCredForVote =
      (await getCredentialForVote(voteId, did, privKey)) !== undefined;
    return hasCredForVote;
  } catch (error) {
    console.error("Error fetching user credentials:", error);
    return false;
  }
}

export async function claimForVote(voteId, dni, did, privKey, pin) {
  // Inalcanzable con el corte de checkClaimedCredForVote, pero esta es la
  // función que escribe en el registro de identidad vía claimNewCredential.
  if (isDemoActive()) {
    return { claimed: true, invalidPin: false };
  }

  try {
    const claimNewCredential = getWiraMethod("claimNewCredential");
    if (!claimNewCredential) {
      throw new Error("claimNewCredential is not available in wira-sdk");
    }

    const isPinValid = await wira.checkPin(pin);
    if (!isPinValid) {
      return { claimed: false, invalidPin: true };
    }

    const resolvedApiKey = await authenticateWithBackend(did, privKey);

    const response = await axios.get(
      `${BACKEND_RESULT}/api/v1/voting/events/vote/cred-vc?eventId=${voteId}&dni=${dni}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": resolvedApiKey,
        },
        timeout: 30000,
      },
    );

    if (!response?.data?.vc) {
      throw new Error(
        "No credential data found in response when trying to claim credential for vote.",
      );
    }

    await claimNewCredential(response.data.vc, did, privKey, {
      pin,
      registryUrl: BACKEND_IDENTITY,
      registryApiKey: IDENTITY_KEY,
    });

    return { claimed: true, invalidPin: false };
  } catch (error) {
    console.error(error);
    const err = new Error(
      `Error fetching notifications for vote claim:` + error,
    );
    captureError(err, {
      flow: "institution-voting",
      critical: true,
      step: "claim-credential",
      tableCode: "",
      allowPii: false,
    });
    return { claimed: false, invalidPin: false };
  }
}
