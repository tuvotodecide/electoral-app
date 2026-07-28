import {CHAIN} from '@env';
import {sendOperationWithUserOpHash} from '../../../api/account';
import {submitOfficialPublication} from '../api/officialPublicationApi';
import {
  markOfficialPublicationOutboxSynced,
  saveOfficialPublicationOutboxItem,
} from '../outbox/officialPublicationOutbox';
import {assertOfficialPublicationExecutionMatches} from '../utils/officialPublicationHash';

export const OFFICIAL_PUBLICATION_USER_OP_HASH_REQUIRED =
  'OFFICIAL_PUBLICATION_USER_OP_HASH_REQUIRED';

const requireUserOpHash = value => {
  const userOpHash = String(value || '').trim();
  if (!userOpHash) {
    const error = new Error('No se recibió el identificador de la operación.');
    error.code = OFFICIAL_PUBLICATION_USER_OP_HASH_REQUIRED;
    throw error;
  }
  return userOpHash;
};

export const sendOfficialPublicationSubmission = async ({
  requestId,
  deviceId,
  request,
  claim,
  privateKey,
  smartAccountAddress,
  submitFn = submitOfficialPublication,
}) => {
  const executionValidation = assertOfficialPublicationExecutionMatches({
    request,
    claim,
    expectedSmartAccount: smartAccountAddress,
  });

  const result = await sendOperationWithUserOpHash(
    privateKey,
    smartAccountAddress,
    CHAIN,
    executionValidation.calls.map(call => ({
      to: call.target,
      value: call.value,
      data: call.callData,
    })),
  );
  const userOpHash = requireUserOpHash(result?.userOpHash);

  await saveOfficialPublicationOutboxItem({
    requestId,
    deviceId,
    userOpHash,
    txHash: result?.txHash,
    syncStatus: 'PENDING',
  });

  const submitted = await submitFn(requestId, deviceId, userOpHash, result?.txHash);
  requireUserOpHash(submitted?.userOpHash);
  await markOfficialPublicationOutboxSynced(requestId, userOpHash);

  return {
    submitted,
    userOpHash,
    txHash: result?.txHash,
  };
};
