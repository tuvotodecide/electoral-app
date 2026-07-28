import axios from 'axios';
import {BACKEND_RESULT} from '@env';
import wira from 'wira-sdk';
import store, {persistor} from '../../../redux/store';
import {StorageService} from '../../../services/StorageService';

const API_BASE = `${String(BACKEND_RESULT || '').replace(/\/+$/, '')}/api/v1`;
const AUTH_STORAGE_PREFIX = 'officialPublication.mobileAuth';
const AUTH_SKEW_MS = 30 * 1000;
const DEFAULT_AUTH_TTL_MS = 10 * 60 * 1000;
const BOOTSTRAP_WAIT_MS = 3000;

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

export const getOfficialPublicationWalletPayload = () => getWalletPayload();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export const waitForOfficialPublicationWalletBootstrap = async (
  timeoutMs = BOOTSTRAP_WAIT_MS,
) => {
  const startedAt = Date.now();
  while (!persistor?.getState?.()?.bootstrapped && Date.now() - startedAt < timeoutMs) {
    await sleep(50);
  }
};

const authStorageKey = requestId =>
  `${AUTH_STORAGE_PREFIX}:${String(requestId || '').trim()}`;

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

export const clearOfficialPublicationApiKey = async requestId => {
  await StorageService.removeItem(authStorageKey(requestId));
};

export const getOrCreateOfficialPublicationApiKey = async (
  requestId,
  {forceRefresh = false} = {},
) => {
  await waitForOfficialPublicationWalletBootstrap();

  const did = getCurrentDid();
  const privKey = getCurrentPrivKey();

  if (!did || !privKey) {
    throw new Error('No se pudo validar tu acceso institucional');
  }

  const key = authStorageKey(requestId);
  if (!forceRefresh) {
    const stored = safeParse(await StorageService.getItem(key));
    if (isStoredApiKeyValid(stored)) {
      return stored.apiKey;
    }
  }

  const response = await axios.get(
    `${API_BASE}/mobile/official-publication/auth/${encodeURIComponent(requestId)}/request`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
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
      requestId,
      expiresAt,
    }),
  );

  return authData.apiKey;
};

export const getOfficialPublicationAuthHeaders = async (
  requestId,
  options,
) => {
  const apiKey = await getOrCreateOfficialPublicationApiKey(requestId, options);

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
};

const unwrapRequest = response => response?.data?.request || response?.data || null;

const isUnauthorized = error => Number(error?.response?.status) === 401;

const shouldClearApiKeyForResponse = data => {
  const status = data?.request?.status || data?.status;
  return ['COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(status);
};

const officialPublicationRequest = async (
  requestId,
  requestFactory,
  {retryOnUnauthorized = true} = {},
) => {
  const headers = await getOfficialPublicationAuthHeaders(requestId);
  try {
    const response = await requestFactory(headers);
    if (shouldClearApiKeyForResponse(response.data)) {
      await clearOfficialPublicationApiKey(requestId);
    }
    return response;
  } catch (error) {
    if (!retryOnUnauthorized || !isUnauthorized(error)) {
      throw error;
    }
    await clearOfficialPublicationApiKey(requestId);
    const retryHeaders = await getOfficialPublicationAuthHeaders(requestId, {
      forceRefresh: true,
    });
    const retryResponse = await requestFactory(retryHeaders);
    if (shouldClearApiKeyForResponse(retryResponse.data)) {
      await clearOfficialPublicationApiKey(requestId);
    }
    return retryResponse;
  }
};

export const getOfficialPublicationRequest = async requestId => {
  const response = await officialPublicationRequest(requestId, headers =>
    axios.get(
      `${API_BASE}/mobile/official-publication/requests/${encodeURIComponent(requestId)}`,
      {headers},
    ),
  );
  return unwrapRequest(response);
};

export const claimOfficialPublication = async (requestId, deviceId) => {
  const response = await officialPublicationRequest(
    requestId,
    headers =>
      axios.post(
        `${API_BASE}/mobile/official-publication/requests/${encodeURIComponent(requestId)}/claim`,
        {deviceId},
        {headers},
      ),
  );
  return response.data;
};

export const startOfficialPublicationSigning = async (requestId, deviceId) => {
  const response = await officialPublicationRequest(
    requestId,
    headers =>
      axios.post(
        `${API_BASE}/mobile/official-publication/requests/${encodeURIComponent(requestId)}/signing`,
        {deviceId},
        {headers},
      ),
  );
  return unwrapRequest(response);
};

export const rejectOfficialPublication = async (requestId, deviceId) => {
  const response = await officialPublicationRequest(
    requestId,
    headers =>
      axios.post(
        `${API_BASE}/mobile/official-publication/requests/${encodeURIComponent(requestId)}/reject`,
        {
          deviceId,
          reasonCode: 'USER_REJECTED',
        },
        {headers},
      ),
  );
  await clearOfficialPublicationApiKey(requestId);
  return unwrapRequest(response);
};

export const submitOfficialPublication = async (
  requestId,
  deviceId,
  userOpHash,
  txHash,
) => {
  const body = {
    deviceId,
    userOpHash,
  };
  if (txHash) {
    body.txHash = txHash;
  }
  const response = await officialPublicationRequest(
    requestId,
    headers =>
      axios.post(
        `${API_BASE}/mobile/official-publication/requests/${encodeURIComponent(requestId)}/submission`,
        body,
        {headers},
      ),
  );
  return unwrapRequest(response);
};

export const extractOfficialPublicationErrorCode = error => {
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
