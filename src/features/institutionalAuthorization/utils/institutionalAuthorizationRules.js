import {getAddress, isAddress, isHex} from 'viem';

export const INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH =
  'INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH';

export const INSTITUTIONAL_AUTHORIZATION_WALLET_MISMATCH =
  'INSTITUTIONAL_AUTHORIZATION_WALLET_MISMATCH';

const throwPackageMismatch = message => {
  const error = new Error(message || 'No se pudo validar la autorización institucional.');
  error.code = INSTITUTIONAL_AUTHORIZATION_PACKAGE_MISMATCH;
  throw error;
};

export const normalizeWalletAddress = value => {
  const text = String(value || '').trim();
  if (!isAddress(text)) return '';
  return getAddress(text);
};

export const sameWalletAddress = (a, b) => {
  const left = normalizeWalletAddress(a);
  const right = normalizeWalletAddress(b);
  return Boolean(left && right && left === right);
};

export const assertInstitutionalSignerWallet = (expected, actual) => {
  if (!sameWalletAddress(expected, actual)) {
    const error = new Error('La billetera del teléfono no corresponde al administrador principal.');
    error.code = INSTITUTIONAL_AUTHORIZATION_WALLET_MISMATCH;
    throw error;
  }
};

export const isInstitutionalAuthorizationExpired = request => {
  const status = String(request?.status || '').toUpperCase();
  if (status === 'MOBILE_AUTHORIZATION_EXPIRED' || status === 'EXPIRED') return true;
  const parsed = Date.parse(String(request?.expiresAt || ''));
  return Number.isFinite(parsed) && Date.now() >= parsed;
};

export const assertInstitutionalAuthorizationExecutionMatches = ({
  request,
  claim,
  expectedSmartAccount,
}) => {
  const execution = claim?.execution;
  if (!execution || String(claim?.request?.applicationId || claim?.requestId || '') !== String(request?.applicationId || request?.requestId || '')) {
    throwPackageMismatch();
  }
  const expectedAction = String(request?.action || 'ADD_AUTHORIZED_ADDRESS');
  if (!['ADD_AUTHORIZED_ADDRESS', 'REMOVE_AUTHORIZED_ADDRESS', 'CHANGE_INSTITUTION_ADMIN'].includes(expectedAction)) {
    throwPackageMismatch('La acción solicitada no corresponde a una autorización institucional.');
  }
  if (execution.action !== expectedAction) {
    throwPackageMismatch('La acción preparada no corresponde a la autorización institucional.');
  }
  if (String(execution.stableInstitutionId || '') !== String(request?.stableInstitutionId || '')) {
    throwPackageMismatch('El identificador estable de la institución no coincide.');
  }
  if (String(execution.stableInstitutionId || '') === String(request?.applicationId || request?.requestId || '')) {
    throwPackageMismatch('La autorización no puede usar el ID de solicitud como identificador institucional.');
  }
  assertInstitutionalSignerWallet(request?.signerWallet, expectedSmartAccount);
  if (!sameWalletAddress(execution.signerWallet, request?.signerWallet)) {
    throwPackageMismatch('La billetera firmante preparada no coincide.');
  }
  if (!sameWalletAddress(execution.targetWallet, request?.targetWallet)) {
    throwPackageMismatch('La billetera a autorizar no coincide.');
  }
  const calls = Array.isArray(execution.calls) ? execution.calls : [];
  if (calls.length !== 1) {
    throwPackageMismatch('La autorización institucional debe contener una sola operación.');
  }
  const [call] = calls;
  if (
    call?.purpose !== expectedAction ||
    !isAddress(call?.target || '') ||
    !isHex(call?.callData || '', {strict: true}) ||
    BigInt(call?.value || 0) !== 0n
  ) {
    throwPackageMismatch();
  }
  return {calls};
};
