import axios from 'axios';
import {BACKEND_RESULT} from '@env';
import wira from 'wira-sdk';
import store, {persistor} from '../../../redux/store';
import {StorageService} from '../../../services/StorageService';

const API_BASE = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1`;
const AUTH_STORAGE_PREFIX = 'institutionalAuthorization.mobileAuth';
const INVITATION_AUTH_STORAGE_PREFIX = 'institutionalInvitation.mobileAuth';
const AUTH_SKEW_MS = 30 * 1000;
const DEFAULT_AUTH_TTL_MS = 10 * 60 * 1000;
const BOOTSTRAP_WAIT_MS = 3000;

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const unwrapRequest = response => response?.data?.request || response?.data || null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const getWalletPayload = () => store.getState()?.wallet?.payload || null;

const getCredentialSubject = payload =>
  payload?.vc?.credentialSubject || payload?.vc?.vc?.credentialSubject || {};

const getCurrentDid = () => {
  const payload = getWalletPayload();
  const subject = getCredentialSubject(payload);
  return String(payload?.did || payload?.payloadQr?.did || subject?.did || '').trim();
};

const getCurrentPrivKey = () => {
  const payload = getWalletPayload();
  return String(payload?.privKey || payload?.payloadQr?.privKey || '').trim();
};

export const waitForInstitutionalAuthorizationWalletBootstrap = async (
  timeoutMs = BOOTSTRAP_WAIT_MS,
) => {
  const startedAt = Date.now();
  while (!persistor?.getState?.()?.bootstrapped && Date.now() - startedAt < timeoutMs) {
    await sleep(50);
  }
};

const authStorageKey = applicationId =>
  `${AUTH_STORAGE_PREFIX}:${String(applicationId || '').trim()}`;

const invitationAuthStorageKey = invitationId =>
  `${INVITATION_AUTH_STORAGE_PREFIX}:${String(invitationId || '').trim()}`;

const safeParse = value => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const isStoredApiKeyValid = stored =>
  Boolean(
    stored?.apiKey &&
      stored?.expiresAt &&
      new Date(stored.expiresAt).getTime() - AUTH_SKEW_MS > Date.now(),
  );

export const clearInstitutionalAuthorizationApiKey = async applicationId => {
  await StorageService.removeItem(authStorageKey(applicationId));
};

export const getOrCreateInstitutionalAuthorizationApiKey = async (
  applicationId,
  {forceRefresh = false} = {},
) => {
  await waitForInstitutionalAuthorizationWalletBootstrap();

  const did = getCurrentDid();
  const privKey = getCurrentPrivKey();
  if (!did || !privKey) {
    throw new Error('No se pudo validar tu acceso institucional');
  }

  const key = authStorageKey(applicationId);
  if (!forceRefresh) {
    const stored = safeParse(await StorageService.getItem(key));
    if (isStoredApiKeyValid(stored)) {
      return stored.apiKey;
    }
  }

  const response = await axios.get(
    `${API_BASE}/mobile/institutional-authorizations/auth/${encodeURIComponent(applicationId)}/request`,
    {headers: jsonHeaders},
  );
  const authData = response.data || {};
  if (!authData.apiKey || !authData.request) {
    throw new Error('No se pudo validar la identidad de este dispositivo.');
  }

  await wira.authenticateWithVerifier(
    JSON.stringify(authData.request),
    did,
    privKey,
  );

  const expiresAt =
    authData.expiresAt ||
    new Date(Date.now() + DEFAULT_AUTH_TTL_MS).toISOString();
  await StorageService.setItem(
    key,
    JSON.stringify({
      apiKey: authData.apiKey,
      applicationId,
      expiresAt,
    }),
  );

  return authData.apiKey;
};

export const getInstitutionalAuthorizationAuthHeaders = async (
  applicationId,
  options,
) => {
  const apiKey = await getOrCreateInstitutionalAuthorizationApiKey(applicationId, options);
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
};

const isUnauthorized = error => Number(error?.response?.status) === 401;

const shouldClearApiKeyForResponse = data => {
  const status = data?.request?.status || data?.status;
  return ['APPROVED', 'REJECTED', 'REVOKED', 'MOBILE_AUTHORIZATION_EXPIRED'].includes(status);
};

const institutionalAuthorizationRequest = async (
  applicationId,
  requestFactory,
  {retryOnUnauthorized = true} = {},
) => {
  const headers = await getInstitutionalAuthorizationAuthHeaders(applicationId);
  try {
    const response = await requestFactory(headers);
    if (shouldClearApiKeyForResponse(response.data)) {
      await clearInstitutionalAuthorizationApiKey(applicationId);
    }
    return response;
  } catch (error) {
    if (!retryOnUnauthorized || !isUnauthorized(error)) {
      throw error;
    }
    await clearInstitutionalAuthorizationApiKey(applicationId);
    const retryHeaders = await getInstitutionalAuthorizationAuthHeaders(applicationId, {
      forceRefresh: true,
    });
    const retryResponse = await requestFactory(retryHeaders);
    if (shouldClearApiKeyForResponse(retryResponse.data)) {
      await clearInstitutionalAuthorizationApiKey(applicationId);
    }
    return retryResponse;
  }
};

export const getInstitutionalAuthorizationRequest = async (
  applicationId,
) => {
  const response = await institutionalAuthorizationRequest(
    applicationId,
    headers =>
      axios.get(
        `${API_BASE}/institutional-admin-applications/mobile/authorizations/${encodeURIComponent(applicationId)}`,
        {headers},
      ),
  );
  return unwrapRequest(response);
};

export const claimInstitutionalAuthorization = async (
  applicationId,
  deviceId,
) => {
  const response = await institutionalAuthorizationRequest(
    applicationId,
    headers =>
      axios.post(
        `${API_BASE}/institutional-admin-applications/mobile/authorizations/${encodeURIComponent(applicationId)}/claim`,
        {deviceId},
        {headers},
      ),
  );
  return response.data;
};

export const startInstitutionalAuthorizationSigning = async (
  applicationId,
  deviceId,
) => {
  const response = await institutionalAuthorizationRequest(
    applicationId,
    headers =>
      axios.post(
        `${API_BASE}/institutional-admin-applications/mobile/authorizations/${encodeURIComponent(applicationId)}/signing`,
        {deviceId},
        {headers},
      ),
  );
  return unwrapRequest(response);
};

export const rejectInstitutionalAuthorization = async (
  applicationId,
  deviceId,
) => {
  const response = await institutionalAuthorizationRequest(
    applicationId,
    headers =>
      axios.post(
        `${API_BASE}/institutional-admin-applications/mobile/authorizations/${encodeURIComponent(applicationId)}/reject`,
        {deviceId, reasonCode: 'MOBILE_REJECTED'},
        {headers},
      ),
  );
  return unwrapRequest(response);
};

export const submitInstitutionalAuthorization = async (
  applicationId,
  deviceId,
  walletAddress,
  userOpHash,
  txHash,
) => {
  const body = {deviceId, userOpHash};
  if (txHash) body.txHash = txHash;
  const response = await institutionalAuthorizationRequest(
    applicationId,
    headers =>
      axios.post(
        `${API_BASE}/institutional-admin-applications/mobile/authorizations/${encodeURIComponent(applicationId)}/submission`,
        body,
        {headers},
      ),
  );
  return unwrapRequest(response);
};

export const acceptInstitutionalInvitation = async (
  invitationId,
) => {
  const response = await institutionalInvitationRequest(
    invitationId,
    headers => axios.post(
      `${API_BASE}/institutional-admin-applications/mobile/invitations/${encodeURIComponent(invitationId)}/accept`,
      {},
      {headers},
    ),
  );
  return response.data;
};

export const rejectInstitutionalInvitation = async (
  invitationId,
) => {
  const response = await institutionalInvitationRequest(
    invitationId,
    headers => axios.post(
      `${API_BASE}/institutional-admin-applications/mobile/invitations/${encodeURIComponent(invitationId)}/reject`,
      {},
      {headers},
    ),
  );
  return response.data;
};

export const clearInstitutionalInvitationApiKey = async invitationId => {
  await StorageService.removeItem(invitationAuthStorageKey(invitationId));
};

export const getOrCreateInstitutionalInvitationApiKey = async (
  invitationId,
  {forceRefresh = false} = {},
) => {
  await waitForInstitutionalAuthorizationWalletBootstrap();
  const did = getCurrentDid();
  const privKey = getCurrentPrivKey();
  if (!did || !privKey) {
    throw new Error('No se pudo validar tu identidad para esta invitación');
  }
  const key = invitationAuthStorageKey(invitationId);
  if (!forceRefresh) {
    const stored = safeParse(await StorageService.getItem(key));
    if (isStoredApiKeyValid(stored)) return stored.apiKey;
  }
  const response = await axios.get(
    `${API_BASE}/mobile/institutional-authorizations/auth/invitations/${encodeURIComponent(invitationId)}/request`,
    {headers: jsonHeaders},
  );
  const authData = response.data || {};
  if (!authData.apiKey || !authData.request) {
    throw new Error('No se pudo validar la identidad para esta invitación.');
  }
  await wira.authenticateWithVerifier(JSON.stringify(authData.request), did, privKey);
  await StorageService.setItem(
    key,
    JSON.stringify({
      apiKey: authData.apiKey,
      invitationId,
      expiresAt: authData.expiresAt || new Date(Date.now() + DEFAULT_AUTH_TTL_MS).toISOString(),
    }),
  );
  return authData.apiKey;
};

const getInstitutionalInvitationAuthHeaders = async (invitationId, options) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-api-key': await getOrCreateInstitutionalInvitationApiKey(invitationId, options),
});

const institutionalInvitationRequest = async (
  invitationId,
  requestFactory,
  {retryOnUnauthorized = true} = {},
) => {
  const headers = await getInstitutionalInvitationAuthHeaders(invitationId);
  try {
    return await requestFactory(headers);
  } catch (error) {
    if (!retryOnUnauthorized || !isUnauthorized(error)) throw error;
    await clearInstitutionalInvitationApiKey(invitationId);
    return requestFactory(await getInstitutionalInvitationAuthHeaders(invitationId, {forceRefresh: true}));
  }
};

export const getInstitutionalInvitationRequest = async invitationId => {
  const response = await institutionalInvitationRequest(
    invitationId,
    headers => axios.get(
      `${API_BASE}/institutional-admin-applications/mobile/invitations/${encodeURIComponent(invitationId)}`,
      {headers},
    ),
  );
  return unwrapRequest(response);
};

export const extractInstitutionalAuthorizationErrorCode = error => {
  const data =
    error?.response?.data ||
    error?.cause?.response?.data ||
    error?.apiDebug?.responseData ||
    null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)?.code || null;
    } catch {
      return null;
    }
  }
  return data?.code || data?.errorCode || null;
};
