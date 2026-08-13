import {CHAIN} from '@env';
import {sendOperationWithUserOpHash} from '../../../api/account';
import {submitInstitutionalAuthorization} from '../api/institutionalAuthorizationApi';
import {
  markInstitutionalAuthorizationOutboxSynced,
  saveInstitutionalAuthorizationOutboxItem,
} from '../outbox/institutionalAuthorizationOutbox';
import {assertInstitutionalAuthorizationExecutionMatches} from '../utils/institutionalAuthorizationRules';

export const INSTITUTIONAL_USER_OP_HASH_REQUIRED =
  'INSTITUTIONAL_USER_OP_HASH_REQUIRED';

const requireUserOpHash = value => {
  const userOpHash = String(value || '').trim();
  if (!userOpHash) {
    const error = new Error('No se recibió el identificador de la operación firmada.');
    error.code = INSTITUTIONAL_USER_OP_HASH_REQUIRED;
    throw error;
  }
  return userOpHash;
};

export const sendInstitutionalAuthorizationSubmission = async ({
  applicationId,
  deviceId,
  walletAddress,
  request,
  claim,
  privateKey,
  smartAccountAddress,
  submitFn = submitInstitutionalAuthorization,
}) => {
  const executionValidation = assertInstitutionalAuthorizationExecutionMatches({
    request,
    claim,
    expectedSmartAccount: smartAccountAddress,
  });

  const calls = executionValidation.calls.map(call => ({
    to: call.target,
    value: call.value,
    data: call.callData,
  }));
  const result = await sendOperationWithUserOpHash(
    privateKey,
    smartAccountAddress,
    CHAIN,
    calls,
  );
  const userOpHash = requireUserOpHash(result?.userOpHash);

  await saveInstitutionalAuthorizationOutboxItem({
    applicationId,
    deviceId,
    walletAddress,
    userOpHash,
    txHash: result?.txHash,
    syncStatus: 'PENDING',
  });

  let submitted;
  try {
    submitted = await submitFn(
      applicationId,
      deviceId,
      walletAddress,
      userOpHash,
      result?.txHash,
    );
  } catch (error) {
    // The operation was accepted by the bundler and is durably queued in the
    // outbox.  Preserve that fact for the UI so a transport failure while
    // recording it cannot reopen the same authorization for another signature.
    error.userOpHash = userOpHash;
    error.txHash = result?.txHash;
    throw error;
  }
  requireUserOpHash(submitted?.userOpHash);
  await markInstitutionalAuthorizationOutboxSynced(applicationId, userOpHash);

  return {
    submitted,
    userOpHash,
    txHash: result?.txHash,
  };
};
