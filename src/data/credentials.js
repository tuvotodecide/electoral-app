import axios from "axios";
import wira from "wira-sdk";
import { authenticateWithBackend } from "../utils/offlineQueueHandler";
import { BACKEND_RESULT } from "@env";
import { captureError } from "../config/sentry";

export async function getCredentialForVote(voteId, did, privKey) {
  try {
    const userCreds = await wira.getUserCredentials(
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
    const resolvedApiKey = await authenticateWithBackend(
      did,
      privKey,
    );

    const response = await axios.get(
      `${BACKEND_RESULT}/api/v1/users/${dni}/notifications`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': resolvedApiKey
        },
        timeout: 30000,
      },
    );

    if (!response?.data?.data || response.data.data.length === 0) {
      throw new Error('No notifications found for user when trying to claim credential for vote.');
    }

    const notification = response.data.data.find(
      notif => notif.data?.type === 'INSTITUTIONAL_EVENT_PUBLISHED' && notif.data?.eventId === voteId
    );

    if (!notification) {
      throw new Error('No matching notification found for vote credential claim.');
    }

    await wira.claimNewCredential(notification.data.credentialData, did, privKey);

    return true;
  } catch (error) {
    console.log('Error fetching notifications for vote claim:', error);
    const err = new Error(`Error fetching notifications for vote claim:`, error);
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