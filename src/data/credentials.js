import axios from "axios";
import wira from "wira-sdk";
import { authenticateWithBackend } from "../utils/offlineQueueHandler";
import { BACKEND_RESULT } from "@env";
import { captureError } from "../config/sentry";

const wiraClient = wira?.default && typeof wira.default === 'object'
  ? wira.default
  : wira;

const getWiraMethod = methodName =>
  typeof wiraClient?.[methodName] === 'function'
    ? wiraClient[methodName].bind(wiraClient)
    : null;

export async function getCredentialForVote(voteId, did, privKey) {
  try {
    const getUserCredentials = getWiraMethod('getUserCredentials');
    if (!getUserCredentials) {
      return false;
    }

    const userCreds = await getUserCredentials(
      did,
      privKey,
    );

    return userCreds.find(cred => cred.info?.credentialSubject?.eventId === voteId);
  } catch (error) {
    console.error('Error fetching user credentials:', error);
    return false;
  }
}

export async function checkClaimedCredForVote(voteId, did, privKey) {
  try {
    const hasCredForVote = await getCredentialForVote(voteId, did, privKey) !== undefined;
    return hasCredForVote;
  } catch (error) {
    console.error('Error fetching user credentials:', error);
    return false;
  }
};

export async function claimForVote(voteId, dni, did, privKey) {
  try {
    const claimNewCredential = getWiraMethod('claimNewCredential');
    if (!claimNewCredential) {
      throw new Error('claimNewCredential is not available in wira-sdk');
    }

    const resolvedApiKey = await authenticateWithBackend(
      did,
      privKey,
    );

    const response = await axios.get(
      `${BACKEND_RESULT}/api/v1/voting/events/vote/cred-vc?eventId=${voteId}&dni=${dni}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': resolvedApiKey
        },
        timeout: 30000,
      },
    );

    if (!response?.data?.vc) {
      throw new Error('No credential data found in response when trying to claim credential for vote.');
    }

    await claimNewCredential(response.data.vc, did, privKey);

    return true;
  } catch (error) {
    console.log(error);
    const err = new Error(`Error fetching notifications for vote claim:`, { cause: error });
    captureError(
      err,
      {
        flow: 'institution-voting',
        critical: true,
        step: 'claim-credential',
        tableCode: '',
        allowPii: false,
        dni: ''
      }
    );
    return false;
  }
}

